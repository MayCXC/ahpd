/** Starting one of these in the background, and finding it again. */

import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { closeSync, fstatSync, openSync, readdirSync, readSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { connect } from 'node:net';
import { basename, dirname, join } from 'node:path';
import { readJson, writeJsonAtomic } from '@ahpd/sdk';
import { daemonLog, daemonPath, ensureConfigDir } from './config.js';

/**
 * Where a daemon on Windows takes a stop and a restart, and the key that proves
 * the request is this user's.
 *
 * Windows cannot send `SIGHUP` or `SIGUSR2`, and `SIGTERM` is a hard kill with
 * no `stopping` event, so `stop` and `restart` reach a daemon there through a
 * named pipe rather than a signal. The key is what keeps another user out: a
 * named pipe gives read access to Everyone by default, and the name is random
 * so nobody can make the pipe first and take the key. Both live in the record,
 * which is 0600, as the connect URL's token does.
 */
export interface Control {
  /** The named pipe the daemon listens on. */
  pipe: string;
  /** The key a request must carry, 32 random bytes as hex. */
  key: string;
}

/** What a detached daemon records about itself. */
export interface Running {
  pid: number;
  /** The origin it listens on, without the token. What every verb prints. */
  url: string;
  /**
   * The origin with the token in the query, for a person to copy out of the
   * 0600 record. This field carries the secret and `url` does not.
   */
  connectUrl: string;
  paths: string[];
  startedAt: string;
  /**
   * Where automations are kept and whether their schedules fire, in the
   * daemon's own words. Absent from a record an older daemon wrote.
   */
  automations?: string;
  /**
   * The line the child was started with, after the program: what a restart
   * starts again. Absent from a record an older daemon wrote.
   */
  argv?: string[];
  /**
   * What this daemon started without, one line each, in the order the plugins
   * found them: a plugin that failed, an item of a plugin's that it dropped.
   * Absent when nothing was skipped, and from a record an older daemon wrote.
   */
  skipped?: string[];
  /**
   * Where a stop and a restart reach this daemon, on a platform whose signals
   * do not. Absent on Linux and macOS, where the terminal still sends signals,
   * and from a record an older daemon wrote.
   */
  control?: Control;
}

/**
 * How long a start waits for the new daemon to say where it is listening.
 * `ahpd restart` gives a successor longer than this, `SUCCESSOR_WAIT_MS`, so
 * the restarting daemon's own answer always reaches it first.
 */
export const READY_TIMEOUT_MS = 20_000;

/**
 * Set in the environment of a daemon `start` spawns: the one process that will
 * be recorded, and so the one that answers the restart signals.
 */
export const DETACHED_ENV = 'AHPD_DETACHED';

/**
 * Set in the environment of a daemon `start` spawns on Windows: the pipe and
 * key it takes its stop and restart requests on, as JSON. The child reads it
 * and deletes it at once, the way it takes `DETACHED_ENV`, so a shell a session
 * runs does not inherit either.
 */
export const CONTROL_ENV = 'AHPD_CONTROL';

/** The name every control pipe starts with, before the random part. */
const PIPE_PREFIX = '\\\\.\\pipe\\ahpd-';

/**
 * The signals a request may stand for: the two a restart takes, and a stop.
 *
 * The names are the ones `process.on` binds and `process.kill` sends, because a
 * request stands for the signal it names rather than for an action of its own.
 */
export type ControlledSignal = 'SIGTERM' | 'SIGHUP' | 'SIGUSR2';

/** The one line a request is: the key, and the signal it stands for. */
export const requestLine = (control: Control, signal: ControlledSignal): string =>
  `${JSON.stringify({ key: control.key, signal })}\n`;

/**
 * The pipe and key a daemon started on `platform` takes its stop and restart
 * requests on, and nothing on a platform whose signals reach a daemon.
 *
 * Both are new for each start, and so for each successor of a restart, because
 * a name another process could predict is a name another process could take
 * first.
 *
 * `pipe` is only for a test: the control path is `node:net` on both platforms,
 * so a case on Linux drives it over a unix socket path rather than a named
 * pipe, which is the one end of the protocol a machine here can hold.
 */
export function controlFor(platform: NodeJS.Platform, pipe?: string): Control | undefined {
  if (platform !== 'win32') return undefined;
  // 16 bytes of name, 32 of key: the name only has to be unguessable, and the
  // key is what a request is checked against.
  return { pipe: pipe ?? `${PIPE_PREFIX}${randomBytes(16).toString('hex')}`, key: randomBytes(32).toString('hex') };
}

/** Is that process still there? A record outlives a crash, and says nothing about one. */
const alive = (pid: number): boolean => {
  // `0` and the negatives are not processes: to `kill` they mean process
  // *groups*, and pid 0 is the caller's own - which would report any record
  // holding one as running, and then signal this process rather than it.
  if (pid <= 0) return false;
  try {
    // Signal 0 checks for existence without asking the process to do anything.
    process.kill(pid, 0);
    return true;
  }
  catch { return false; }
};

/**
 * Whether that pid may be a process: one there, or one this user may not
 * signal (`EPERM`), which is somebody else's and not gone. What a sweep asks
 * before it removes a file named by a pid.
 */
const present = (pid: number): boolean => {
  if (pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  }
  catch (error) { return (error as { code?: unknown }).code === 'EPERM'; }
};

/**
 * The daemon this user has running, if the record names one that still is.
 *
 * A stale record is cleared rather than reported: a `daemon.json` left behind
 * by a crash would otherwise have `start` refuse for ever, on the strength of
 * a process that is not there. A file that holds no record at all, such as
 * `null` or text that is not JSON, is cleared the same way.
 *
 * This is the one reader of the record, and a caller printing one takes `url`:
 * `connectUrl` carries the secret and belongs on no line.
 */
export function running(): Running | undefined {
  const read = readJson(daemonPath());
  // A file that is not there, and one that could not be opened, are both a
  // daemon with no record: neither is a file anybody may clear.
  if (!read.ok && read.kind !== 'not-json') return undefined;
  // Text that is not JSON is a file that was read and held no record, which is
  // the same thing as one that holds `null`, and is cleared below.
  const found = read.ok ? recordIn(read.value) : undefined;
  if (found === undefined) {
    // Not a record at all, so nobody's: it goes whatever it holds.
    try { unlinkSync(daemonPath()); }
    catch { /* it was already gone, which is what was wanted */ }
    return undefined;
  }
  if (!alive(found.pid)) {
    // Through `forget`, so a record another daemon claimed since the read stays.
    forget([found.pid]);
    return undefined;
  }
  return found;
}

/** The record in that value: a JSON object with a numeric pid, or nothing. */
const recordIn = (parsed: unknown): Running | undefined => {
  if (typeof parsed !== 'object' || parsed === null || typeof (parsed as { pid?: unknown }).pid !== 'number') return undefined;
  return parsed as Running;
};

/** The record as the file holds it, alive or not; nothing when there is none or it is not a record. */
const recorded = (): Running | undefined => {
  const read = readJson(daemonPath());
  return read.ok ? recordIn(read.value) : undefined;
};

/**
 * The temp file a writer leaves beside the file it replaces whole.
 *
 * Every writer here names its scratch the same way - the daemon's own record,
 * the users file, the policies, the automations, the machine owners, the vault -
 * so one pattern reads them all, and the pid in the name is what says whether
 * the process that wrote it is still there.
 */
const TEMP = /^(.+)\.(\d+)\.tmp$/u;

/**
 * Remove the temp files of processes that are gone, beside each file named.
 *
 * A temp is named by its writer's pid, so one process leaves at most one per
 * file, and only when it died between the write and the rename; this clears
 * those. The file itself need not exist: a writer killed before its first
 * rename leaves the scratch and nothing else, and clearing it is the point.
 */
export const sweepTemps = (beside: readonly string[]): void => {
  for (const file of beside) {
    const dir = dirname(file);
    const name = basename(file);
    let names: string[];
    try { names = readdirSync(dir); }
    catch { continue; }
    for (const found of names) {
      const match = TEMP.exec(found);
      // Only this file's own scratch: `notes.json.7.tmp` beside the policies is
      // somebody else's, whatever its shape.
      if (match === null || match[1] !== name) continue;
      const pid = Number(match[2]);
      if (!Number.isInteger(pid) || pid === process.pid || present(pid)) continue;
      try { unlinkSync(join(dir, found)); }
      catch { /* another process swept it first */ }
    }
  }
};

/**
 * The URL a person connects with: the announced origin, with the token in the
 * query when there is one.
 *
 * The one place the query is appended, and the only function that puts the
 * secret into a URL. `url` on the record stays the token-free origin, because
 * the verbs print it and stdout is a log.
 */
export function readyUrl(origin: string, token?: string): string {
  const base = `${origin.endsWith('/') ? origin.slice(0, -1) : origin}/`;
  // Encoded, because a token read from a file may hold anything.
  return token === undefined ? base : `${base}?tkn=${encodeURIComponent(token)}`;
}

/**
 * The record built from what the child announced.
 *
 * Pure, so the shape it writes is testable without spawning anything. The
 * origin and the directories come off its own announcement rather than off the
 * command line, because the directories may have come from the configuration
 * file and a record built from argv would name none of them.
 *
 * The lines it announced as skipped come off it too, which is the whole way
 * they travel: the child that skipped wrote them beside the origin it announced,
 * and the record is what a person who started it is shown.
 *
 * `control` is what `start` made for a child on Windows, which the child was
 * given in its environment. It is nowhere else in the record, and no line the
 * verbs print comes from it: the key belongs in the 0600 file and nowhere a log
 * would hold it.
 */
export function recordOf(announced: string, pid: number, token?: string, argv?: string[], control?: Control): Running {
  const url = /ws:\/\/[^\s,]+/.exec(announced)?.[0] ?? announced;
  const automations = /^automations (.+)$/m.exec(announced)?.[1]?.trim();
  const skipped = skippedOf(announced);
  return {
    pid,
    url,
    connectUrl: readyUrl(url, token),
    paths: (/sessions in (.+)/.exec(announced)?.[1] ?? '')
      .trim().split(',').map((one) => one.trim()).filter((one) => one !== ''),
    startedAt: new Date().toISOString(),
    ...(automations !== undefined ? { automations } : {}),
    ...(argv !== undefined ? { argv } : {}),
    ...(skipped.length > 0 ? { skipped } : {}),
    ...(control === undefined ? {} : { control }),
  };
}

/**
 * What an announcement said was skipped, without the `skipped: ` it is
 * announced under, in the order the daemon found it.
 *
 * One line each and the mark is the line's own: an announcement other daemons
 * also write to is read from an `ahpd on` line to the next one, so what this
 * says is only ever about the daemon that said it.
 */
export function skippedOf(announced: string): string[] {
  return [...announced.matchAll(/^skipped: (.*)$/gmu)].map((found) => found[1] as string);
}

/**
 * What `daemon.log` holds from byte `from` on, read from that offset rather
 * than whole; empty when there is no log or nothing after it.
 */
export function logSince(from: number): string {
  let fd: number;
  try { fd = openSync(daemonLog(), 'r'); }
  catch { return ''; }
  try {
    const size = fstatSync(fd).size;
    if (size <= from) return '';
    const buffer = Buffer.alloc(size - from);
    let at = 0;
    while (at < buffer.length) {
      const read = readSync(fd, buffer, at, buffer.length - at, from + at);
      if (read === 0) break;
      at += read;
    }
    return buffer.subarray(0, at).toString('utf8');
  }
  finally {
    closeSync(fd);
  }
}

/**
 * The announcement of the daemon `pid`, from its `ahpd on` line to the next
 * one, in a log other processes also write to; nothing until it has written it.
 *
 * The announcement is one write holding a `pid` line, so the block that holds
 * this pid's line is this daemon's, whatever other daemons wrote around it.
 */
export function announcementOf(log: string, pid: number): string | undefined {
  const starts = [...log.matchAll(/^ahpd on ws:\/\//gmu)].map((found) => found.index);
  const own = new RegExp(`^pid ${String(pid)}$`, 'mu');
  for (const [at, start] of starts.entries()) {
    const block = log.slice(start, starts[at + 1] ?? log.length);
    if (own.test(block)) return block;
  }
  return undefined;
}

/**
 * The one line `status` prints about a running daemon.
 *
 * Built from `url` alone, which is the token-free origin: a record dump would
 * print `connectUrl` and with it the secret. The line is a function so a test
 * can hold it to that.
 */
export function statusLine(record: Pick<Running, 'url' | 'pid' | 'startedAt'>): string {
  return `ahpd on ${record.url} (pid ${String(record.pid)}), started ${record.startedAt}`;
}

/**
 * The size `daemon.log` may reach before a start moves it aside: over this, and
 * the start that finds it renames it and opens a new one in its place.
 */
const LOG_LIMIT = 5 * 1024 * 1024;

/**
 * Move a log that has outgrown the limit aside, before a start appends to it.
 *
 * At the start and not on a timer, so nothing has to be running to watch the
 * file: the daemon whose log grew unchecked is the one nobody has been near.
 * One previous log is kept and this one replaces it, which is as much of a log
 * nobody has read in a while as is worth keeping.
 */
const rotateLog = (): void => {
  let size: number;
  try { size = statSync(daemonLog()).size; }
  catch { return; }
  if (size <= LOG_LIMIT) return;
  try { renameSync(daemonLog(), `${daemonLog()}.1`); }
  catch { /* another start got there first, and the log is its own to keep */ }
};

/**
 * Start one in the background, and wait until it says where it is.
 *
 * Detached and with its streams let go, so it outlives the shell that started
 * it - which is the whole point, and the difference between this and running
 * `ahpd` in a terminal you then have to keep open.
 *
 * `replacing` is the pid of a daemon restarting itself, whose record stays
 * until this one's is written, so a stop in between still reaches it.
 *
 * On Windows it also makes the pipe and key the child answers a stop and a
 * restart on, hands them to it in `CONTROL_ENV`, and records them, because the
 * record is what a verb reads and this process is the one that writes it.
 */
export async function start(argv: string[], self: string, token?: string, replacing?: number): Promise<Running> {
  const already = running();
  if (already && already.pid !== replacing) throw new Error(`One is already running: ${already.url} (pid ${String(already.pid)})`);

  ensureConfigDir();
  rotateLog();
  /*
   * Where this run's output will start.
   *
   * The log is appended to across runs, so reading the whole file for an
   * address finds the *previous* daemon's - which is a record pointing at a
   * port this process never bound, and was.
   */
  const from = (() => {
    try { return statSync(daemonLog()).size; }
    catch { return 0; }
  })();
  /*
   * Its output goes to a file, not to a pipe held here.
   *
   * A pipe dies with the process holding its other end, and this process is
   * about to exit - so the daemon's next log line would kill it. A file also
   * leaves something to read when it misbehaves, which a background process
   * with no output at all does not.
   */
  const log = openSync(daemonLog(), 'a');
  /*
   * Where this daemon will take its stop and its restart.
   *
   * Nothing on Linux and macOS, where the terminal sends signals and the
   * record's pid is enough. On Windows the signals are not there, so the two
   * verbs are requests to a pipe this process makes, hands to the child, and
   * records - the child cannot make it, because the parent is the one that
   * writes the record and it is the record a verb reads.
   */
  const control = controlFor(process.platform);
  /*
   * The flags this process was given, ahead of the script.
   *
   * A daemon started by the dev runner is a second run of this program, and the
   * runner's loader is on node's own argv rather than in `NODE_OPTIONS`. A child
   * that is not handed the same flags cannot load the workspace's sources. An
   * installed daemon has an empty `execArgv`, so nothing changes for it.
   */
  const child = spawn(process.execPath, [...process.execArgv, self, ...argv], {
    detached: true,
    stdio: ['ignore', log, log],
    env: {
      ...process.env,
      [DETACHED_ENV]: '1',
      ...(control === undefined ? {} : { [CONTROL_ENV]: JSON.stringify(control) }),
    },
  });
  child.unref();
  closeSync(log);

  /*
   * Wait for it to say where it is, by reading what it wrote.
   *
   * Polling rather than listening, because nothing here is holding its
   * output any more - which is exactly the point.
   */
  /** What it said about itself, so the record is its answer and not a guess. */
  let announced = '';
  await new Promise<string>((answer, fail) => {
    const gaveUp = Date.now() + READY_TIMEOUT_MS;
    const look = (): void => {
      const said = logSince(from);
      const own = child.pid === undefined ? undefined : announcementOf(said, child.pid);
      if (own !== undefined) { announced = own; answer(own); return; }
      if (child.exitCode !== null) {
        fail(new Error(`it exited with ${String(child.exitCode)}. See ${daemonLog()}`));
        return;
      }
      if (Date.now() > gaveUp) {
        fail(new Error(`it started but never said where it was listening. See ${daemonLog()}`));
        return;
      }
      setTimeout(look, 100);
    };
    look();
  }).catch((error: unknown) => {
    if (child.pid !== undefined) {
      try { process.kill(child.pid, 'SIGKILL'); }
      catch { /* already gone */ }
    }
    throw error;
  });

  // It announced where it was listening, so it started; this is for the type
  // rather than for the case, and `0` must never reach the record.
  if (child.pid === undefined) throw new Error('it started but has no process id');
  const record = recordOf(announced, child.pid, token, argv, control);
  /** Stop the child this start made, which no record will name. */
  const unmade = (): void => {
    try { process.kill(child.pid as number, 'SIGTERM'); }
    catch { /* already gone */ }
  };
  let other: Running | undefined;
  try {
    other = claim(record, replacing);
  }
  catch (error) {
    unmade();
    throw error;
  }
  if (other !== undefined) {
    unmade();
    throw new Error(`another daemon, pid ${String(other.pid)}, was started in its place while it started`);
  }
  return record;
}

/**
 * Write `record` as the one running, unless the record names another live
 * daemon than `replacing`, which is answered instead and left as it is.
 *
 * Checked again at the write rather than only before the spawn, because a
 * start can take seconds and a person can `ahpd stop` and `ahpd start` in them.
 */
export function claim(record: Running, replacing?: number): Running | undefined {
  const already = recorded();
  if (already !== undefined && already.pid !== replacing && alive(already.pid)) return already;
  sweepTemps([daemonPath()]);
  // Owner-only: the record holds `connectUrl`, which is the origin with the
  // token in it.
  writeJsonAtomic(daemonPath(), record, { mode: 0o600 });
  return undefined;
}

/**
 * Forget where it was: the record goes, and the process is left alone.
 *
 * With `only`, the record goes only when it names one of those pids, so a
 * daemon forgetting itself never takes another daemon's record with it.
 */
export function forget(only?: readonly number[]): void {
  if (only !== undefined) {
    const named: unknown = recorded()?.pid;
    if (typeof named !== 'number' || !only.includes(named)) return;
  }
  try { unlinkSync(daemonPath()); }
  catch { /* already gone */ }
}

/**
 * The words for a record on Windows that holds no pipe, which is one an older
 * ahpd wrote: there is no signal to fall back on there, so a person is told to
 * stop the process by hand rather than left with a hard kill.
 */
const NO_PIPE = 'This daemon was started by an older ahpd, which recorded no pipe. Stop pid';

/**
 * One request to a daemon's control pipe, and the daemon closing it after the
 * line. Answers nothing: a request has no receipt of its own.
 *
 * A pipe that is not there, and one nothing is listening on, are both a daemon
 * that is not there: the error carries `ESRCH`, which is what the signal path
 * answers for a pid that is gone, so the two verbs word it the same way.
 */
const ask = async (control: Control, signal: ControlledSignal): Promise<void> => {
  await new Promise<void>((done, fail) => {
    const client = connect(control.pipe);
    client.on('error', (error: Error) => {
      fail(Object.assign(new Error(error.message), { code: 'ESRCH', pipe: control.pipe }));
    });
    client.on('connect', () => { client.end(requestLine(control, signal), () => { done(); }); });
    // The daemon closes the connection once it has read the line, which settles
    // this even when the write callback did not run.
    client.on('close', () => { done(); });
  });
};

/**
 * Send a daemon the request a signal stands for.
 *
 * On a platform whose signals reach another process this is the signal itself:
 * `process.kill`, which answers `ESRCH` for a pid that is gone. Windows has no
 * `SIGHUP` or `SIGUSR2` to send, and sends `SIGTERM` as a hard kill that runs
 * no `stopping` handler, so a record holding a `control` is reached over its
 * pipe instead, with the key the record holds.
 *
 * `platform` is a parameter so a case on Linux drives the Windows path over a
 * unix socket path, which is the same protocol at both ends.
 */
export async function deliver(
  record: Running,
  signal: ControlledSignal,
  platform: NodeJS.Platform = process.platform,
): Promise<void> {
  if (platform !== 'win32') {
    process.kill(record.pid, signal);
    return;
  }
  const control = record.control;
  if (control === undefined) throw new Error(`${NO_PIPE} ${String(record.pid)} by hand.`);
  await ask(control, signal);
}

/**
 * How long a daemon is given to answer the stop request before it is killed.
 *
 * A shutdown closes plugin connections first, and a plugin's `stopping` handler
 * may take seconds, so the request is given time rather than the process being
 * ended as soon as it stops listening. A daemon that does not go within this is
 * killed, and the line for it says so.
 */
export const STOP_WAIT_MS = 30_000;

/** How often the wait looks at the process table, between the request and the limit. */
const STOP_POLL_MS = 100;

/**
 * What a stop is done with, so a case drives the process table and the clock
 * rather than a process, as `AtTerminal` does for a restart.
 */
export interface StopSteps {
  /** Ask the daemon the record names to stop: a signal, or a request on Windows. */
  signal(record: Running): Promise<void>;
  /** End it outright, which is what a daemon that did not stop is given. */
  kill(pid: number): void;
  /** Whether that process is still there. */
  alive(pid: number): boolean;
  /** Wait one poll interval. */
  wait(): Promise<void>;
  /** How long the daemon is given to go, before it is killed. */
  waitMs: number;
  now(): number;
}

/** What a stop did: the record it stopped, and whether it had to be killed. */
export interface StopOutcome {
  record: Running;
  /** True when the daemon did not go within the limit and was killed. */
  killed: boolean;
}

/** A stop against the real process table and the real clock. */
const realStop = (): StopSteps => ({
  signal: (record) => deliver(record, 'SIGTERM'),
  // Not `deliver`: SIGKILL is not a request a daemon can answer, and on Windows
  // it is `TerminateProcess`, which is the hard kill this wants.
  kill: (pid) => { process.kill(pid, 'SIGKILL'); },
  alive,
  wait: () => new Promise((done) => { setTimeout(done, STOP_POLL_MS); }),
  waitMs: STOP_WAIT_MS,
  now: () => Date.now(),
});

/** Whether that pid went within the limit, looking once every poll interval. */
const goneWithin = async (pid: number, steps: StopSteps): Promise<boolean> => {
  const limit = steps.now() + steps.waitMs;
  for (;;) {
    if (!steps.alive(pid)) return true;
    if (steps.now() >= limit) return false;
    await steps.wait();
  }
};

/**
 * Ask it to stop, wait for it to go, and forget where it was. Answers what was
 * stopped, or nothing.
 *
 * The record goes only once the process is gone, so a stop still waiting is one
 * a second stop finds and waits on too. A process that went between the read
 * and the request is a stop, and nothing is said about it. Anything else is
 * said: a record on Windows with no pipe is one no request reaches, and
 * swallowing that would print `Stopped` for a daemon still running.
 */
export async function stop(steps: StopSteps = realStop()): Promise<StopOutcome | undefined> {
  const found = running();
  if (!found) return undefined;
  let asked = true;
  try { await steps.signal(found); }
  catch (error) {
    if ((error as { code?: unknown }).code !== 'ESRCH') throw error;
    // A pipe on Windows that does not answer reads as `ESRCH` too, so the
    // process table decides: a daemon still there is one this stop never asked.
    if (steps.alive(found.pid)) throw new Error(`pid ${String(found.pid)} is running but did not answer the stop request.`);
    // It went between the read and the request, so there is nothing to wait for.
    asked = false;
  }
  let killed = false;
  if (asked && !await goneWithin(found.pid, steps)) {
    steps.kill(found.pid);
    killed = true;
    // SIGKILL cannot be caught or ignored, so a process that is there after it
    // is one the kernel has not let go of yet: waiting again is all there is.
    if (!await goneWithin(found.pid, steps)) throw new Error(`pid ${String(found.pid)} did not go after SIGKILL.`);
  }
  // Only the record of the daemon stopped: a successor may have claimed it since.
  forget([found.pid]);
  return { record: found, killed };
}
