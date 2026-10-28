/*
 * `ahpd doctor`, at the command line: one line for each check, the count of the
 * three results, and the code the run leaves.
 *
 * A case is a machine of its own: the temporary configuration home `cli.ts`
 * gives it, an empty `PATH` so no agent command is found, and, where the check
 * needs one, a daemon answering on a socket this file holds. Doctor never starts
 * a daemon, so none is started here: the check reads the record and opens the
 * address in it.
 *
 * The cases are Linux only, because the Service check prints the systemd unit
 * under the case's own home. The launchd agent is read from the real home of the
 * user, which is no machine a case may make.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { WebSocketServer } from 'ws';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cli, freePort, home, type Said } from './cli.js';

/** The token the record carries to the daemon it names, and which no line may hold. */
const TOKEN = 'doctor-token-4f1c';

/** A folder with nothing in it, which is the whole of the `PATH` a run is given. */
const bin = (): string => join(home, 'bin');
/** The record a detached daemon writes, as doctor reads it. */
const daemonFile = (): string => join(home, 'ahpd', 'daemon.json');
/** The file a person edits, at the path doctor reads it from. */
const configFile = (): string => join(home, 'ahpd', 'config.json');
/** Where a systemd user unit goes, under the configuration home of this case. */
const unitFile = (): string => join(home, 'systemd', 'user', 'ahpd.service');

let server: WebSocketServer | undefined;

beforeEach(() => {
  mkdirSync(bin(), { recursive: true });
  mkdirSync(join(home, 'systemd', 'user'), { recursive: true });
  writeFileSync(unitFile(), '[Unit]\nDescription=ahpd\n');
});

afterEach(async () => {
  const held = server;
  server = undefined;
  if (held === undefined) return;
  await new Promise<void>((done) => { held.close(() => { done(); }); });
});

/** A daemon that answers, and the address it answers at. */
const answering = async (): Promise<string> => {
  const port = await freePort();
  const held = new WebSocketServer({ port, host: '127.0.0.1' });
  server = held;
  await new Promise<void>((done, fail) => {
    held.once('listening', () => { done(); });
    held.once('error', fail);
  });
  return `127.0.0.1:${String(port)}`;
};

/** The record `running` reads: this process, so its pid is one that is there, and the token the socket wants. */
const recordAt = (at: string): void => {
  writeFileSync(daemonFile(), JSON.stringify({
    pid: process.pid,
    url: `http://${at}`,
    connectUrl: `ws://${at}/?token=${TOKEN}`,
    paths: [],
    startedAt: new Date().toISOString(),
  }));
};

/** A machine with a daemon that answers, so the run has only the state a case asks for. */
const up = async (): Promise<string> => {
  const at = await answering();
  recordAt(at);
  return at;
};

/** The configuration a person edits, at the default path. */
const configure = (value: unknown): void => {
  writeFileSync(configFile(), `${JSON.stringify(value)}\n`);
};

/** Doctor on this case's machine, with a `PATH` holding no agent command. */
const ran = (args: readonly string[] = []): Promise<Said> =>
  cli(['doctor', ...args], { env: { PATH: bin() }, unset: ['AHPD_CONFIG'] });

/** Every check but the daemon's, which a case states for itself. */
const OTHERS = (): unknown[] => [
  { name: 'Runtime', result: 'ok', line: `Node ${process.version} runs ahpd` },
  { name: 'Config', result: 'ok', line: 'no file is there, so the defaults are used' },
  { name: 'Service', result: 'ok', line: `the systemd file is at ${unitFile()}` },
  { name: 'Plugins', result: 'ok', line: 'no plugin is configured' },
  { name: 'Agents', result: 'ok', line: 'no agent command was found on PATH' },
  { name: 'Update', result: 'ok', line: 'no newer @ahpd/server is on record' },
];

describe.skipIf(process.platform !== 'linux')('ahpd doctor', () => {
  it('prints every check as ok, and exits 0', async () => {
    const at = await up();
    const did = await ran();
    expect(did).toEqual({
      code: 0,
      stdout: [
        `ok Runtime: Node ${process.version} runs ahpd`,
        'ok Config: no file is there, so the defaults are used',
        `ok Daemon: a daemon answers at http://${at}`,
        `ok Service: the systemd file is at ${unitFile()}`,
        'ok Plugins: no plugin is configured',
        'ok Agents: no agent command was found on PATH',
        'ok Update: no newer @ahpd/server is on record',
        '7 ok, 0 warn, 0 fail',
        '',
      ].join('\n'),
      stderr: '',
    });
  });

  it('prints a warn with its fix, and still exits 0', async () => {
    const did = await ran();
    expect(did).toEqual({
      code: 0,
      stdout: [
        `ok Runtime: Node ${process.version} runs ahpd`,
        'ok Config: no file is there, so the defaults are used',
        'warn Daemon: no daemon is running',
        '  fix: ahpd start',
        `ok Service: the systemd file is at ${unitFile()}`,
        'ok Plugins: no plugin is configured',
        'ok Agents: no agent command was found on PATH',
        'ok Update: no newer @ahpd/server is on record',
        '6 ok, 1 warn, 0 fail',
        '',
      ].join('\n'),
      stderr: '',
    });
  });

  it('gives the warn to --json as the same array', async () => {
    const did = await ran(['--json']);
    expect({ code: did.code, stderr: did.stderr }).toEqual({ code: 0, stderr: '' });
    const [runtime, config, ...rest] = OTHERS();
    expect(JSON.parse(did.stdout)).toEqual([
      runtime,
      config,
      { name: 'Daemon', result: 'warn', line: 'no daemon is running', fix: 'ahpd start' },
      ...rest,
    ]);
  });

  it('prints a fail with its fix, and exits 1', async () => {
    const at = await up();
    configure({ plugins: ['@ahpd/not-here'] });
    const did = await ran();
    expect({ code: did.code, stderr: did.stderr }).toEqual({ code: 1, stderr: 'ahpd: 1 check failed.\n' });
    const lines = did.stdout.split('\n');
    expect(lines.slice(0, 4)).toEqual([
      `ok Runtime: Node ${process.version} runs ahpd`,
      `ok Config: read ${configFile()}`,
      `ok Daemon: a daemon answers at http://${at}`,
      `ok Service: the systemd file is at ${unitFile()}`,
    ]);
    expect(lines[4]).toMatch(/^fail Plugins: @ahpd\/not-here: .+$/u);
    expect(lines[5]).toBe('  fix: install the plugin the line names, or remove it from the configuration');
    expect(lines.slice(6)).toEqual([
      'ok Agents: no agent command was found on PATH',
      'ok Update: no newer @ahpd/server is on record',
      '6 ok, 0 warn, 1 fail',
      '',
    ]);
  });

  it('keeps the failing report on stdout when --json asked for it, and still exits 1', async () => {
    await up();
    configure({ plugins: ['@ahpd/not-here'] });
    const did = await ran(['--json']);
    expect(did.code).toBe(1);
    expect(JSON.parse(did.stderr)).toEqual({ message: '1 check failed.', kind: 'conflict', exitCode: 1 });
    const checks = JSON.parse(did.stdout) as { name: string; result: string; line: string; fix?: string }[];
    expect(checks.map((check) => `${check.name} ${check.result}`)).toEqual([
      'Runtime ok', 'Config ok', 'Daemon ok', 'Service ok', 'Plugins fail', 'Agents ok', 'Update ok',
    ]);
    expect(checks[4]?.line).toMatch(/^@ahpd\/not-here: .+$/u);
    expect(checks[4]?.fix).toBe('install the plugin the line names, or remove it from the configuration');
  });

  it('holds no token in what --json prints, with a daemon running', async () => {
    const at = await up();
    const did = await ran(['--json']);
    expect(did.code).toBe(0);
    const [runtime, config, ...rest] = OTHERS();
    expect(JSON.parse(did.stdout)).toEqual([
      runtime,
      config,
      { name: 'Daemon', result: 'ok', line: `a daemon answers at http://${at}` },
      ...rest,
    ]);
    for (const printed of [did.stdout, did.stderr]) {
      expect(printed).not.toContain(TOKEN);
      expect(printed).not.toContain('token=');
      expect(printed).not.toContain('connectUrl');
    }
  });
});
