import { describe, expect, it, vi } from 'vitest';
import type { SpawnOptions } from 'node:child_process';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { homedir, tmpdir, userInfo } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { posix } from '../../../tools/posix.ts';
import { uriOf } from '../src/resources/fileuri.js';
import { shellOf, shellTerminals } from '../src/machines/terminals.js';
import type { SpawnShell } from '../src/machines/terminals.js';
import type { Claim, Pty, SpawnPty, Terminal } from '../src/types/terminals.js';

/*
 * A shell that says where it is and what it ran.
 *
 * Under pipes there is no shell integration: nothing knows where one command's
 * output ends and the next begins, and `isPty: false` says so. Under a
 * pseudoterminal the shell marks its own commands - in OSC 133, or in OSC 633
 * once the store has started it with VS Code's integration - and the
 * boundaries become facts. The binding is handed in, so this drives a fake one
 * rather than needing native code to have been built.
 */

/** A pseudoterminal that says whatever a test tells it to. */
function fakePty(): {
  spawn: SpawnPty;
  say: (data: string) => void;
  typed: string[];
  started: { shell: string; args: string[] | string; env: Record<string, string | undefined> }[];
} {
  let listen: ((data: string) => void) | undefined;
  const typed: string[] = [];
  const started: { shell: string; args: string[] | string; env: Record<string, string | undefined> }[] = [];
  const spawn: SpawnPty = (shell, args, options) => {
    started.push({ shell, args, env: options.env });
    return {
      onData: (to) => { listen = to; },
      onExit: () => {},
      write: (data) => { typed.push(data); },
      resize: () => {},
      kill: () => {},
    };
  };
  return { spawn, say: (data) => listen?.(data), typed, started };
}

const opened = (pty?: SpawnPty) => {
  const seen: Record<string, unknown>[] = [];
  const store = shellTerminals(pty === undefined ? {} : { pty });
  const terminal = store.create({
    uri: 'ahp-terminal:/one',
    cwd: '/tmp',
    claim: { kind: 'user' },
    emit: (_channel: string, action: Record<string, unknown>) => { seen.push(action); },
  } as never);
  return { terminal, seen };
};

/** An OSC sequence, the way a shell integration script writes one. */
const osc = (body: string) => `\u001b]${body}\u0007`;

/**
 * What a terminal said between its first `terminal/commandExecuted` and the
 * `terminal/commandFinished` after it, which the protocol calls the command's
 * output. A terminal that reported no such pair answers a text no output is.
 */
const betweenActions = (seen: Record<string, unknown>[]): string => {
  const from = seen.findIndex((one) => one.type === 'terminal/commandExecuted');
  const to = seen.findIndex((one, at) => at > from && one.type === 'terminal/commandFinished');
  if (from === -1 || to === -1) return '<no command reported>';
  return seen.slice(from + 1, to).filter((one) => one.type === 'terminal/data').map((one) => String(one.data)).join('');
};

/** The folder the shell integration scripts are in, at the package's root. */
const SCRIPTS = fileURLToPath(new URL('../shellintegration', import.meta.url));

/**
 * `/tmp`, absolute on this system: `F:\tmp` on Windows, where a path with no
 * drive is not absolute. The URIs a case sends and expects are built from it,
 * so they name a real path on either system.
 */
const tmp = resolve('/tmp');

/** What PowerShell is given for `line`: the line, then a line keeping its exit code. */
const psLine = (line: string) =>
  `${line}\nif (-not $?) { exit $(if ($LASTEXITCODE) { $LASTEXITCODE } else { 1 }) }`;

/*
 * Which shell a terminal starts when nobody named one.
 *
 * The platform, the environment and the check for a file are handed in, so a
 * case here asks what a Windows machine would answer without being one - and
 * the build runs on Linux, where the lookup itself cannot run at all.
 */
describe('the shell a terminal starts', () => {
  const win = { ProgramFiles: 'C:\\Program Files', SystemRoot: 'C:\\Windows' };
  const seven = 'C:\\Program Files\\PowerShell\\7\\pwsh.exe';
  const shipped = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';

  it('takes PowerShell 7 from where its installer put it', () => {
    expect(shellOf(undefined, 'win32', win, (at) => at === seven)).toBe(seven);
  });

  it('takes PowerShell 7 from PATH when the installer put it nowhere', () => {
    // An unpacked copy, which is a directory on `PATH` and no installer.
    const unpacked = 'D:\\tools\\pwsh\\pwsh.exe';
    const env = { SystemRoot: 'C:\\Windows', PATH: 'C:\\Windows;D:\\tools\\pwsh' };
    expect(shellOf(undefined, 'win32', env, (at) => at === unpacked)).toBe(unpacked);
  });

  it('falls back to the Windows PowerShell the system ships', () => {
    expect(shellOf(undefined, 'win32', win, (at) => at === shipped)).toBe(shipped);
  });

  it('falls back to ComSpec, and then to cmd.exe', () => {
    const env = { ...win, ComSpec: 'C:\\Windows\\system32\\cmd.exe' };
    expect(shellOf(undefined, 'win32', env, () => false)).toBe('C:\\Windows\\system32\\cmd.exe');
    // No ComSpec is an environment Windows does not make, but a machine with
    // no PowerShell at all still deserves a shell rather than a spawn failure.
    expect(shellOf(undefined, 'win32', win, () => false)).toBe('cmd.exe');
  });

  it('does not read SHELL there, which is a leftover rather than a Windows shell', () => {
    const env = { ...win, SHELL: 'C:\\Program Files\\Git\\bin\\bash.exe' };
    expect(shellOf(undefined, 'win32', env, () => false)).toBe('cmd.exe');
  });

  it('answers SHELL, then /bin/sh, off Windows, as it always has', () => {
    expect(shellOf(undefined, 'linux', { SHELL: '/bin/zsh' })).toBe('/bin/zsh');
    expect(shellOf(undefined, 'darwin', {})).toBe('/bin/sh');
  });

  it('gives the shell that was asked for, on either system', () => {
    // A connection's `defaultShell`: somebody who named a shell gets it, and
    // the answer is not second-guessed because it is not installed.
    expect(shellOf('/usr/bin/fish', 'linux', { SHELL: '/bin/zsh' })).toBe('/usr/bin/fish');
    expect(shellOf('C:\\tools\\nu.exe', 'win32', win, () => false)).toBe('C:\\tools\\nu.exe');
  });
});

/*
 * What a command reaches the shell as.
 *
 * A fake pty is where a case here can read the line: the flag and the quoting
 * are built once and handed to both paths, and `cmd.exe`'s is one string under
 * a pseudoterminal. The pipes spawn's own options - the verbatim flag among
 * them - are read in the describe below. The kind comes from the shell's file
 * name, which is the one part of a shell that says what it is; a case names
 * the file rather than a `C:\...` path, because the split is the runtime's own
 * and this runs on Linux.
 */
describe('the arguments a command reaches the shell with', () => {
  /** One terminal under a fake pty, and what it was started with. */
  const started = (shell: string, asked: { command?: string; args?: string[] }, windowsBuild?: () => number) => {
    const pty = fakePty();
    shellTerminals({ pty: pty.spawn, ...(windowsBuild !== undefined ? { windowsBuild } : {}) }).create({
      uri: 'ahp-terminal:/args',
      cwd: '/tmp',
      shell,
      claim: { kind: 'session', session: 'ahp-session:/one', chat: 'ahp-chat:/one' },
      ...asked,
      emit: () => {},
    });
    return pty.started.at(-1);
  };

  it('gives PowerShell -NoProfile -Command, and doubles a quote inside a word', () => {
    // A line arrives as it was typed: a `!` command in the composer is already
    // PowerShell, and quoting it would look for a program named after it.
    expect(started('pwsh.exe', { command: 'echo hi' })?.args)
      .toEqual(['-NoProfile', '-Command', psLine('echo hi')]);
    // An argv is quoted word by word behind the call operator, which is what
    // makes a quoted path a program to run rather than a string to print.
    expect(started('powershell.exe', { command: 'C:\\tools\\it\'s.exe', args: ['a b'] })?.args)
      .toEqual(['-NoProfile', '-Command', psLine("& 'C:\\tools\\it''s.exe' 'a b'")]);
  });

  it('escapes the words for the C runtime under Windows PowerShell, which passes them on unescaped', () => {
    // A quote, the backslashes in front of one, a trailing backslash in a word
    // the shell wraps in quotes, and an empty word it would drop.
    const args = ['say "hi"', 'a\\"b', 'C:\\some dir\\', '', 'plain'];
    expect(started('powershell.exe', { command: 'node.exe', args })?.args)
      .toEqual(['-NoProfile', '-Command', psLine(String.raw`& 'node.exe' 'say \"hi\"' 'a\\\"b' 'C:\some dir\\' '""' 'plain'`)]);
    // PowerShell 7 escapes them itself, so it is given the words as they are.
    expect(started('pwsh.exe', { command: 'node.exe', args: ['say "hi"'] })?.args)
      .toEqual(['-NoProfile', '-Command', psLine(`& 'node.exe' 'say "hi"'`)]);
  });

  it('gives cmd.exe /d /s /c, one line in the outer quotes its /s strips', () => {
    // One string rather than an argv, because `node-pty` passes a string to
    // the Windows process as it is and escapes an array for the C runtime -
    // with `\"` for a quote inside it, which `cmd.exe` does not read back.
    expect(started('cmd.exe', { command: 'echo "a"' })?.args)
      .toBe('/d /s /c "echo "a""');
    expect(started('cmd.exe', { command: 'C:\\Program Files\\tool.exe', args: ['a b'] })?.args)
      .toBe('/d /s /c ""C:\\Program Files\\tool.exe" "a b""');
  });

  it('gives a POSIX shell -c, as it always has', () => {
    expect(started('/bin/sh', { command: 'echo hi' })?.args).toEqual(['-c', 'echo hi']);
    expect(started('/bin/bash', { command: 'p', args: ["it's"] })?.args)
      .toEqual(['-c', "'p' 'it'\\''s'"]);
  });

  it('gives no flag at all when there is no command', () => {
    // A terminal somebody types into: `-NoProfile -Command` with nothing after
    // it is a shell that exits rather than one that waits. On a Windows build
    // with ConPTY PowerShell is given the shell integration's arguments
    // instead, which are read below.
    expect(started('pwsh.exe', {}, () => 0)?.args).toEqual([]);
    expect(started('cmd.exe', {})?.args).toEqual([]);
  });
});

/*
 * What the pipe spawn is given.
 *
 * Without a pseudoterminal Node starts the shell, and it turns an argv into a
 * Windows command line with backslash escapes for inner double quotes, which
 * `cmd.exe` does not read. So its line is wrapped in outer quotes and the argv
 * is passed verbatim, which is what Node's own `shell: true` does. Both are
 * options to the spawn rather than arguments, so the spawn is handed in here
 * and the case reads them.
 */
describe('the line a pipe spawn is given', () => {
  /** The spawn's own call, from one terminal this case starts. */
  const launched = (shell: string, asked: { command?: string; args?: string[] }) => {
    const calls: { shell: string; args: string[]; options: SpawnOptions }[] = [];
    const start: SpawnShell = (nextShell, args, options) => {
      calls.push({ shell: nextShell, args, options });
      return {
        stdin: { writable: false, end: () => {} },
        stdout: { on: () => {} },
        stderr: { on: () => {} },
        pid: undefined,
        on: () => {},
        kill: () => {},
      } as unknown as ReturnType<SpawnShell>;
    };
    shellTerminals({ spawn: start }).create({
      uri: 'ahp-terminal:/pipes',
      cwd: '/tmp',
      shell,
      claim: { kind: 'session', session: 'ahp-session:/one', chat: 'ahp-chat:/one' },
      ...asked,
      emit: () => {},
    });
    return calls.at(-1);
  };

  it('wraps a cmd.exe line and hands it over verbatim', () => {
    // `echo "a"` typed: the inner quotes are the ones Node would escape and
    // the ones `cmd.exe` cannot read back.
    const typed = launched('cmd.exe', { command: 'echo "a"' });
    expect(typed?.args).toEqual(['/d', '/s', '/c', '"echo "a""']);
    expect(typed?.options.windowsVerbatimArguments).toBe(true);
    // A program named with an argument: each word is quoted for `cmd.exe`, and
    // the line is wrapped once more for `/s`.
    expect(launched('cmd.exe', { command: 'C:\\Program Files\\tool.exe', args: ['a b'] })?.args)
      .toEqual(['/d', '/s', '/c', '""C:\\Program Files\\tool.exe" "a b""']);
  });

  it('leaves PowerShell and a POSIX shell to the runtime, as they were', () => {
    const powershell = launched('pwsh.exe', { command: 'echo hi' });
    expect(powershell?.args).toEqual(['-NoProfile', '-Command', psLine('echo hi')]);
    // Escaped by Node, the way it always has been: both read those escapes.
    expect(powershell?.options.windowsVerbatimArguments).toBeUndefined();
    expect(launched('/bin/sh', { command: 'echo hi' })?.args).toEqual(['-c', 'echo hi']);
  });
});

describe('a shell under a pseudoterminal', () => {
  it('says it is one, and that command detection works once the shell marks', () => {
    const { spawn, say } = fakePty();
    const { terminal, seen } = opened(spawn);
    const state = () => terminal.state() as { isPty?: boolean; supportsCommandDetection?: boolean };
    const announced = () => seen.filter((one) => one.type === 'terminal/commandDetectionAvailable');
    expect(state().isPty).toBe(true);
    // Not before: a shell with no integration of its own never marks, and
    // the protocol's action is sent when integration becomes available.
    expect(state().supportsCommandDetection).toBe(false);
    expect(announced()).toEqual([]);
    say(osc('133;A'));
    say(osc('133;A'));
    // A client MUST check this before relying on command boundaries, so it is
    // announced as well as reported, once.
    expect(state().supportsCommandDetection).toBe(true);
    expect(announced()).toHaveLength(1);
  });

  it('reads the command boundaries the shell prints', () => {
    const { spawn, say } = fakePty();
    const { terminal, seen } = opened(spawn);
    // OSC 133: `A` before the prompt, `C` where the output starts, `D;<code>`
    // when it finished. They arrive mixed into the output.
    say(osc('133;A'));
    terminal.write('ls -la');
    say(osc('133;C') + 'total 8');
    say(osc('133;D;0'));
    const ran = seen.find((one) => one.type === 'terminal/commandExecuted') as
      { commandLine?: string; commandId?: string } | undefined;
    const done = seen.find((one) => one.type === 'terminal/commandFinished') as
      { commandId?: string; exitCode?: number } | undefined;
    expect(ran?.commandLine).toBe('ls -la');
    expect(done?.exitCode).toBe(0);
    // The pair is correlated by a stable id, which is what the protocol says
    // that field is for.
    expect(done?.commandId).toBe(ran?.commandId);
  });

  it('follows the shell into another directory', () => {
    const { spawn, say } = fakePty();
    const { seen } = opened(spawn);
    const elsewhere = uriOf(join(tmp, 'elsewhere'));
    say(osc(`7;${elsewhere.replace('file://', 'file://box')}`));
    const moved = seen.find((one) => one.type === 'terminal/cwdChanged') as { cwd?: string } | undefined;
    // The host part of the URI is dropped: the path is on this machine, and
    // that is what a client opens.
    expect(moved?.cwd).toBe(elsewhere);
  });

  it('reads a directory whose name was encoded, and answers it encoded', () => {
    const { spawn, say } = fakePty();
    const { seen } = opened(spawn);
    const moved = () => seen.filter((one) => one.type === 'terminal/cwdChanged').map((one) => one.cwd);

    const mine = uriOf(join(tmp, 'my dir'));
    const elsewhere = uriOf(join(tmp, 'elsewhere'));
    say(osc(`7;${mine.replace('file://', 'file://box')}`));
    // The same directory written the other way, then a real move. The terminal
    // holds the path, so the second spelling is not a move - and that is the
    // only way to see that what is held is the path rather than the URI's text.
    say(osc(`7;${mine.replaceAll('%20', ' ')}`));
    say(osc(`7;${elsewhere}`));

    // Decoded on the way in and encoded on the way out: a client sent
    // `file:///tmp/my dir` reads a folder called `my dir` only if it decodes.
    expect(mine).toContain('my%20dir');
    expect(moved()).toEqual([mine, elsewhere]);
  });

  it('still passes the bytes through, because a client is drawing them', () => {
    const { spawn, say } = fakePty();
    const { seen } = opened(spawn);
    say(osc('133;C') + 'hello');
    const data = seen.filter((one) => one.type === 'terminal/data').map((one) => String(one.data));
    expect(data.join('')).toContain('hello');
    // A reader, not a filter: the marks reach the client too, which is drawing
    // a terminal and parses them itself.
    expect(data.join('')).toContain('133;C');
  });

  it('says a command\'s output between its two actions, though one chunk holds them all', () => {
    const { spawn, say } = fakePty();
    const { terminal, seen } = opened(spawn);
    say(`${osc('133;A')}$ `);
    terminal.write('ls');
    // The echo, the mark, the output and the next mark, as one read.
    say(`ls\r\n${osc('133;C')}total 8\r\n${osc('133;D;0')}${osc('133;A')}$ `);
    // The protocol's command output: the data between `commandExecuted` and
    // `commandFinished`. The echo is before it and the next prompt after.
    expect(betweenActions(seen)).toBe('total 8\r\n');
  });

  it('is not one when no binding was given', () => {
    const { terminal, seen } = opened();
    const state = terminal.state() as { isPty?: boolean; supportsCommandDetection?: boolean };
    expect(state.isPty).toBe(false);
    expect(state.supportsCommandDetection).toBe(false);
    expect(seen.some((one) => one.type === 'terminal/commandDetectionAvailable')).toBe(false);
    terminal.close();
  });
});

/*
 * VS Code's shell integration, as the reference host puts it into a shell.
 *
 * A shell opened to sit in under a pseudoterminal is started with the
 * arguments, variables and files VS Code's `getShellIntegrationInjection`
 * answers, and the OSC 633 marks its script writes are read the way the
 * reference's terminal manager reads them. The platform and the Windows build
 * are handed in, so each system's answer is read here on any.
 */
describe('VS Code\'s shell integration', () => {
  const session: Claim = { kind: 'session', session: 'ahp-session:/one', chat: 'ahp-chat:/one' };
  const client: Claim = { kind: 'client', clientId: 'one' };

  /** One terminal under a fake pty, started as a machine of `platform` starts it. */
  const integrated = (shell: string, asked: {
    command?: string;
    claim?: Claim;
    platform?: string;
    windowsBuild?: () => number;
  } = {}) => {
    const pty = fakePty();
    const seen: Record<string, unknown>[] = [];
    const terminal = shellTerminals({
      pty: pty.spawn,
      platform: asked.platform ?? 'linux',
      windowsBuild: asked.windowsBuild ?? (() => 0),
    }).create({
      uri: 'ahp-terminal:/integrated',
      cwd: '/tmp',
      shell,
      claim: asked.claim ?? client,
      ...(asked.command !== undefined ? { command: asked.command } : {}),
      emit: (_channel: string, action: Record<string, unknown>) => { seen.push(action); },
    });
    const start = pty.started.at(-1);
    if (start === undefined) throw new Error('the store started nothing');
    return { terminal, seen, say: pty.say, start };
  };

  it('starts bash on its init file, with the nonce the marks are checked against', () => {
    const { start } = integrated('/bin/bash');
    expect(start.args).toEqual(['--init-file', `${SCRIPTS}/shellIntegration-bash.sh`]);
    expect(existsSync(`${SCRIPTS}/shellIntegration-bash.sh`)).toBe(true);
    expect(start.env).toMatchObject({ VSCODE_INJECTION: '1', VSCODE_STABLE: '1' });
    expect(start.env.VSCODE_NONCE).toMatch(/^[0-9a-f-]{36}$/u);
  });

  it('points zsh at the scripts in a folder of its own, which send it back to the person\'s', () => {
    const { start } = integrated('/usr/bin/zsh', { claim: session });
    expect(start.args).toEqual(['-i']);
    const folder = join(realpathSync(tmpdir()), `${userInfo().username}-ahpd-zsh`);
    expect(start.env.ZDOTDIR).toBe(folder);
    // Nobody else may enter it, and only its owner may take a file out of it.
    // Windows keeps no such mode, and a Windows zsh is never given this folder.
    if (posix) expect(statSync(folder).mode & 0o7777).toBe(0o1700);
    expect(start.env.USER_ZDOTDIR).toBe(process.env.ZDOTDIR ?? homedir());
    const copies = { '.zshrc': 'rc', '.zprofile': 'profile', '.zshenv': 'env', '.zlogin': 'login' };
    for (const [file, script] of Object.entries(copies)) {
      expect(readFileSync(join(folder, file), 'utf8')).toBe(readFileSync(`${SCRIPTS}/shellIntegration-${script}.zsh`, 'utf8'));
    }
    // A session's zsh gets the reference's fixups for an agent's shell, and
    // no end-of-line mark between a command's output and its `D`.
    expect(start.env).toMatchObject({ VSCODE_AGENT_ZSH_FIXUPS: '1', PROMPT_EOL_MARK: '' });
    const own = integrated('/usr/bin/zsh').start;
    expect(own.env.VSCODE_AGENT_ZSH_FIXUPS).toBeUndefined();
    expect(own.env.PROMPT_EOL_MARK).toBeUndefined();
  });

  it('starts zsh and bash as login shells on macOS, as the reference does', () => {
    expect(integrated('/bin/zsh', { platform: 'darwin' }).start.args).toEqual(['-il']);
    const bash = integrated('/bin/bash', { platform: 'darwin' }).start;
    expect(bash.args).toEqual(['--init-file', `${SCRIPTS}/shellIntegration-bash.sh`]);
    expect(bash.env.VSCODE_SHELL_LOGIN).toBe('1');
  });

  it('starts PowerShell on its script on a Windows build with ConPTY, and as it is on one without', () => {
    const modern = integrated('pwsh.exe', { platform: 'win32', windowsBuild: () => 22631 }).start;
    expect(modern.args).toEqual(['-noexit', '-command', `try { . "${SCRIPTS}\\shellIntegration.ps1" } catch {}`]);
    expect(modern.env).toMatchObject({ VSCODE_INJECTION: '1', VSCODE_A11Y_MODE: '0', VSCODE_STABLE: '1' });
    const old = integrated('pwsh.exe', { platform: 'win32', windowsBuild: () => 17763 }).start;
    expect(old.args).toEqual([]);
    expect(old.env.VSCODE_INJECTION).toBeUndefined();
  });

  it('leaves a shell given a command, and a shell it does not know, as they were asked', () => {
    const command = integrated('/bin/bash', { command: 'echo hi' }).start;
    expect(command.args).toEqual(['-c', 'echo hi']);
    expect(command.env.VSCODE_INJECTION).toBeUndefined();
    const sh = integrated('/bin/sh').start;
    expect(sh.args).toEqual([]);
    expect(sh.env.VSCODE_INJECTION).toBeUndefined();
  });

  it('starts nothing extra on pipes, where no prompt is drawn', () => {
    const calls: { args: string[]; env: SpawnOptions['env'] }[] = [];
    const start: SpawnShell = (_shell, args, options) => {
      calls.push({ args, env: options.env });
      return {
        stdin: { writable: false, end: () => {} },
        stdout: { on: () => {} },
        stderr: { on: () => {} },
        pid: undefined,
        on: () => {},
        kill: () => {},
      } as unknown as ReturnType<SpawnShell>;
    };
    shellTerminals({ spawn: start, platform: 'linux' }).create({
      uri: 'ahp-terminal:/pipes',
      cwd: '/tmp',
      shell: '/bin/bash',
      claim: session,
      emit: () => {},
    });
    expect(calls.at(-1)?.args).toEqual([]);
    expect(calls.at(-1)?.env?.VSCODE_INJECTION).toBeUndefined();
  });

  it('reads the commands the script marks, and keeps its marks from the client', () => {
    const { terminal, seen, say, start } = integrated('/bin/bash');
    const nonce = String(start.env.VSCODE_NONCE);
    say(`${osc('633;P;HasRichCommandDetection=True')}${osc('633;A')}$ ${osc('633;B')}`);
    expect(terminal.state()).toMatchObject({ supportsCommandDetection: true });
    // A command line is escaped as the scripts escape it: `\x3b` is a `;`.
    say(`echo a; echo b\r\n${osc(`633;E;echo a\\x3b echo b;${nonce}`)}${osc('633;C')}a\r\nb\r\n${osc('633;D;0')}`);
    say(`${osc('633;P;Cwd=/tmp/elsewhere')}${osc('633;A')}$ ${osc('633;B')}`);
    const ran = seen.find((one) => one.type === 'terminal/commandExecuted');
    const done = seen.find((one) => one.type === 'terminal/commandFinished');
    expect(ran).toMatchObject({ commandLine: 'echo a; echo b' });
    expect(done).toMatchObject({ commandId: ran?.commandId, exitCode: 0 });
    expect(betweenActions(seen)).toBe('a\r\nb\r\n');
    expect(seen.find((one) => one.type === 'terminal/cwdChanged')).toMatchObject({ cwd: uriOf('/tmp/elsewhere') });
    expect(seen.filter((one) => one.type === 'terminal/commandDetectionAvailable')).toHaveLength(1);
    // The reference strips its marks from what a client draws: the actions
    // carry them, and a client would otherwise read each command twice.
    const drawn = seen.filter((one) => one.type === 'terminal/data').map((one) => String(one.data)).join('');
    expect(drawn).not.toContain('633');
    expect(drawn).toContain('a\r\nb\r\n');
  });

  it('takes a command line only with its terminal\'s nonce, as the reference does', () => {
    const { seen, say } = integrated('/bin/bash');
    say(`${osc('633;E;rm -rf /;another')}${osc('633;C')}${osc('633;D;0')}`);
    expect(seen.find((one) => one.type === 'terminal/commandExecuted')).toMatchObject({ commandLine: '' });
  });

  it('reads a mark split across two reads once its end arrives', () => {
    const { seen, say } = integrated('/bin/bash');
    say(`${osc('633;C')}out\r\n\u001b]633;D`);
    expect(seen.some((one) => one.type === 'terminal/commandFinished')).toBe(false);
    say(';3\u0007');
    expect(seen.find((one) => one.type === 'terminal/commandFinished')).toMatchObject({ exitCode: 3 });
    expect(betweenActions(seen)).toBe('out\r\n');
  });

  it('reads a command once when the shell also writes OSC 133 of its own', () => {
    const { seen, say } = integrated('/bin/bash');
    say(`${osc('633;A')}${osc('133;A')}$ `);
    say(`${osc('633;C')}${osc('133;C')}out\r\n${osc('133;D;0')}${osc('633;D;0')}`);
    expect(seen.filter((one) => one.type === 'terminal/commandExecuted')).toHaveLength(1);
    expect(seen.filter((one) => one.type === 'terminal/commandFinished')).toHaveLength(1);
  });
});

/*
 * The runtime half of a backend's terminal: what `shellTerminals` does with
 * `args`, `env` and `waitForExit`. Pipes rather than a pty, which is the
 * ordinary case and the one every backend gets without a native binding.
 */
describe('a shell opened with a command', () => {
  /** One terminal, driven through the real store. */
  const run = (asked: {
    command: string;
    args?: string[];
    env?: Record<string, string | undefined>;
  }): Terminal => shellTerminals().create({
    uri: 'ahp-terminal:/opened',
    // A folder that is there on every system: a missing one fails the spawn,
    // which Node reports as the shell not being found.
    cwd: tmpdir(),
    claim: { kind: 'session', session: 'ahp-session:/one', chat: 'ahp-chat:/one' },
    command: asked.command,
    ...(asked.args !== undefined ? { args: asked.args } : {}),
    ...(asked.env !== undefined ? { env: asked.env } : {}),
    emit: () => {},
  });

  /** Everything it printed, once it has gone. */
  const whole = async (terminal: Terminal): Promise<string> => {
    await terminal.waitForExit();
    // The protocol's own recipe for turning typed parts back into a stream.
    return terminal.state().content
      .map((part) => (part.type === 'command' ? part.output : part.value))
      .join('');
  };

  it('runs an argv, so an argument with a space arrives whole', async () => {
    // Quoted word by word, the argument is one word. Split on its space, the
    // program sees `a` and the test reads back `a`.
    const terminal = run({
      command: process.execPath,
      args: ['-e', 'process.stdout.write(process.argv[1] ?? "")', 'a b'],
    });
    expect(await whole(terminal)).toContain('a b');
  });

  it('puts the caller\'s environment over the host\'s, under the terminal\'s own', async () => {
    const terminal = run({
      command: process.execPath,
      args: ['-e', 'process.stdout.write(`${process.env.AHP_TEST_ENV}|${process.env.TERM}`)'],
      env: { AHP_TEST_ENV: 'from-the-backend', TERM: 'not-a-real-term' },
    });
    const said = await whole(terminal);
    expect(said).toContain('from-the-backend');
    // The terminal's own kind is set after the caller's, so a command cannot
    // leave it disagreeing with the size the channel reports.
    expect(said).toContain('|dumb');
  });

  it('resolves waitForExit with the code, and immediately once it has gone', async () => {
    const terminal = run({ command: process.execPath, args: ['-e', 'process.exit(7)'] });
    await expect(terminal.waitForExit()).resolves.toMatchObject({ exitCode: 7 });
    // A process that has already gone answers now rather than leaving a
    // caller waiting for an event that will never come again.
    const again = await Promise.race([
      terminal.waitForExit(),
      new Promise((resolve) => { setTimeout(() => { resolve('late'); }, 200); }),
    ]);
    expect(again).toMatchObject({ exitCode: 7 });
  });
});

it('signals nothing when the shell never started, rather than its own process group', () => {
  /*
   * `close` used to reach `process.kill(-(child?.pid ?? 0), 'SIGKILL')`. A
   * spawn that failed leaves no pid, so that is `kill(0)` - every process in
   * the caller's group, which is the host, the tests, and the shell that
   * started them. It reads as the process being killed from outside.
   */
  const store = shellTerminals({});
  const terminal = store.create({
    uri: 'ahp-terminal:/gone',
    cwd: '/tmp',
    shell: '/nonexistent/shell',
    claim: { kind: 'user' },
    emit: () => {},
  } as never);
  expect(() => { terminal.close(); }).not.toThrow();
});

/*
 * Ending a terminal by hand.
 *
 * Windows has no process group to signal and no signal a shell there acts on,
 * so `close` and `^C` end the shell's tree with `taskkill` there. The program
 * runner and the platform are handed in, which is what lets a case here read
 * what a Windows run would do: `taskkill` is an executable this build has none
 * of, and the branch taken is the machine's.
 */
describe('a terminal ended by hand', () => {
  const claim = { kind: 'session', session: 'ahp-session:/one', chat: 'ahp-chat:/one' } as const;

  /** One terminal, on a machine the case names, with the store's own answer untouched. */
  const on = (platform: string, shell: string, run?: (program: string, argv: string[]) => void) =>
    shellTerminals({ platform, ...(run === undefined ? {} : { run }) }).create({
      uri: 'ahp-terminal:/ended',
      cwd: tmpdir(),
      shell,
      claim,
      emit: () => {},
    });

  it('ends the shell\'s tree with taskkill on Windows, since there is no group to signal', async () => {
    const ran: { program: string; argv: string[] }[] = [];
    // Node itself, which reads its standard input until it ends and so stays
    // up: a real process with a real pid, which is what `taskkill` names.
    const terminal = on('win32', process.execPath, (program, argv) => { ran.push({ program, argv }); });
    terminal.close();

    const [one] = ran;
    expect(one?.program).toBe('taskkill');
    expect(one?.argv[0]).toBe('/pid');
    expect(one?.argv.slice(2)).toEqual(['/T', '/F']);
    // The shell's own pid, and not the host's: the pid was read from the
    // child, and it is one with a process still behind it.
    expect(() => { process.kill(Number(one?.argv[1]), 0); }).not.toThrow();
    // The stand-in ran no `taskkill`, so the shell is ended here: left running in
    // the run's folder, it holds that folder against its removal on Windows.
    process.kill(Number(one?.argv[1]));
    await terminal.waitForExit();
  });

  it('runs no taskkill for a shell that never started', async () => {
    const ran: string[] = [];
    const terminal = on('win32', '/nonexistent/shell', (program) => { ran.push(program); });
    await terminal.waitForExit();
    // No pid, so no tree to name - the same guard the interrupt has, and the
    // reason a failed spawn does not take the caller's own group with it.
    expect(() => { terminal.close(); }).not.toThrow();
    expect(ran).toEqual([]);
  });

  it('sends SIGKILL to the group off Windows, as it always has', async () => {
    const killed: { pid: number; signal: string | number | undefined }[] = [];
    const spy = vi.spyOn(process, 'kill').mockImplementation((pid, signal) => {
      killed.push({ pid, signal });
      return true;
    });
    const terminal = on('linux', process.execPath);
    try {
      terminal.close();
      expect(killed).toHaveLength(1);
      // Negative, which is the group the shell was started in: a signal to the
      // shell alone leaves the command it started running.
      expect(killed[0]?.pid).toBeLessThan(0);
      expect(killed[0]?.signal).toBe('SIGKILL');
    } finally {
      spy.mockRestore();
    }
    // The signal was caught, so the shell is ended here, as the case above ends its own.
    process.kill(-Number(killed[0]?.pid));
    await terminal.waitForExit();
  });
});
