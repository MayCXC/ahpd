/*
 * The daemon's pseudoterminal binding on Bun.
 *
 * Bun is stubbed rather than run: the suite runs on Node, and the binding is
 * `Bun.spawn` with its `terminal` option, which a stand-in answers the way Bun
 * 1.3.13 and 1.4.4 answered by hand. `runtime()` reads the same global, so the
 * loader takes its Bun road under the stub.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { shellTerminals } from '@ahpd/sdk';
import type { SpawnPty } from '@ahpd/sdk';
import { pty } from '../src/pty.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** What Bun's `terminal` option is handed. */
interface Given {
  data(terminal: unknown, data: Uint8Array): void;
}

/** `Bun.spawn` and its terminal, as far as the binding reaches for them, saying whatever a test tells it to. */
function fakeBun(options: { terminal?: boolean; terminalRefused?: boolean; refuse?: Error; refuseSignal?: Error } = {}) {
  const spawned: { cmd: string[]; options: Record<string, unknown> }[] = [];
  const written: string[] = [];
  const resized: [number, number][] = [];
  const killed: (number | string | undefined)[] = [];
  let called: Given | undefined;
  let exited: ((code: number) => void) | undefined;
  const terminal = {
    closed: false,
    // Bun throws once its terminal is closed, as 1.3.13 and 1.4.4 did by hand.
    write: (data: string) => {
      if (terminal.closed) throw new Error('Terminal is closed');
      written.push(data);
      return data.length;
    },
    resize: (cols: number, rows: number) => {
      if (terminal.closed) throw new Error('Terminal is closed');
      resized.push([cols, rows]);
    },
    close: () => { terminal.closed = true; },
  };
  /** `Bun.Terminal`, which the loader makes and closes once; Bun 1.3.13 on Windows throws there. */
  class Terminal {
    constructor() {
      if (options.terminalRefused === true) throw new Error('PTY not supported on this platform');
    }

    close(): void {}
  }
  const Bun = {
    ...(options.terminal === false ? {} : { Terminal }),
    spawn: (cmd: string[], given: Record<string, unknown> & { terminal: Given }) => {
      if (options.refuse !== undefined) throw options.refuse;
      spawned.push({ cmd, options: given });
      called = given.terminal;
      return {
        terminal,
        exited: new Promise<number>((resolve) => { exited = resolve; }),
        // Bun throws for a signal it does not know, running or exited, as 1.3.13 and 1.4.4 did by hand.
        kill: (signal?: number | string) => {
          if (options.refuseSignal !== undefined) throw options.refuseSignal;
          killed.push(signal);
        },
      };
    },
  };
  return {
    Bun,
    spawned,
    written,
    resized,
    killed,
    closed: () => terminal.closed,
    /** Output, as the bytes Bun read. */
    say: (bytes: Uint8Array) => { called?.data(terminal, bytes); },
    /** The process going, with what Bun's `exited` resolves to. */
    exit: (code: number) => { exited?.(code); },
  };
}

/** The binding the loader hands a daemon on this system under this Bun. */
const bunBinding = async (bun: ReturnType<typeof fakeBun>, platform = 'linux'): Promise<SpawnPty> => {
  vi.stubGlobal('Bun', bun.Bun);
  const { pty: spawn } = await pty(platform);
  if (spawn === undefined) throw new Error('the loader handed no binding under Bun');
  return spawn;
};

/** One terminal from it, with everything it said and every exit it reported. */
const started = (spawn: SpawnPty) => {
  const heard: string[] = [];
  const exits: number[] = [];
  const terminal = spawn('/bin/sh', [], { cwd: '/tmp', cols: 80, rows: 24, env: { TERM: 'xterm-256color' } });
  terminal.onData((data) => { heard.push(data); });
  terminal.onExit(({ exitCode }) => { exits.push(exitCode); });
  return { terminal, heard, exits };
};

/** Whatever the binding has queued, run: a promise's callbacks and a refused start's report. */
const settled = () => new Promise<void>((resolve) => { setTimeout(resolve, 0); });

describe('a terminal under Bun', () => {
  it("is Bun's own, started with the argv, directory, size and environment the store gives", async () => {
    const bun = fakeBun();
    const spawn = await bunBinding(bun);
    spawn('/bin/bash', ['-c', 'echo hi'], { cwd: '/work', cols: 120, rows: 40, env: { TERM: 'xterm-256color', HOME: '/home/a' } });
    expect(bun.spawned).toHaveLength(1);
    expect(bun.spawned[0]?.cmd).toEqual(['/bin/bash', '-c', 'echo hi']);
    expect(bun.spawned[0]?.options).toMatchObject({
      cwd: '/work',
      env: { TERM: 'xterm-256color', HOME: '/home/a' },
      terminal: { cols: 120, rows: 40 },
    });
    // No `exit` callback: up to Bun 1.3.13 one turns a start Bun refuses into a crash.
    expect(Object.keys(bun.spawned[0]?.options.terminal as object)).toEqual(['cols', 'rows', 'data']);
  });

  it('is a pseudoterminal to the store, which reads its output, its marks and its exit code', async () => {
    const bun = fakeBun();
    const seen: Record<string, unknown>[] = [];
    const terminal = shellTerminals({ pty: await bunBinding(bun) }).create({
      uri: 'ahp-terminal:/one',
      cwd: '/tmp',
      claim: { kind: 'user' },
      emit: (_channel: string, action: Record<string, unknown>) => { seen.push(action); },
    } as never);
    expect(terminal.state()).toMatchObject({ isPty: true });
    bun.say(new TextEncoder().encode('\u001b]133;C\u0007hello\r\n'));
    // What the store reads off Bun's terminal: the shell's mark and the output after it.
    expect(terminal.state()).toMatchObject({ supportsCommandDetection: true });
    expect(seen).toContainEqual({ type: 'terminal/commandDetectionAvailable' });
    expect(seen.some((action) => action.type === 'terminal/commandExecuted')).toBe(true);
    expect(seen.filter((action) => action.type === 'terminal/data').map((action) => action.data).join('')).toContain('hello\r\n');
    bun.exit(3);
    await settled();
    expect(seen).toContainEqual({ type: 'terminal/exited', exitCode: 3 });
    expect(terminal.exitCode()).toBe(3);
  });

  it('refuses arguments as one string, as node-pty does on Unix', async () => {
    const bun = fakeBun();
    const spawn = await bunBinding(bun);
    expect(() => spawn('cmd.exe', '/d /s /c "echo hi"', { cols: 80, rows: 24, env: {} }))
      .toThrow('args as a string is not supported on unix.');
    expect(bun.spawned).toEqual([]);
  });

  it("passes cmd.exe its line verbatim on Windows, as node-pty writes a string after the file", async () => {
    const bun = fakeBun();
    const spawn = await bunBinding(bun, 'win32');
    spawn('C:\\Windows\\System32\\cmd.exe', '/d /s /c "echo hi"', { cols: 80, rows: 24, env: {} });
    expect(bun.spawned[0]?.cmd).toEqual(['C:\\Windows\\System32\\cmd.exe', '/d /s /c "echo hi"']);
    expect(bun.spawned[0]?.options).toMatchObject({ windowsVerbatimArguments: true });
  });

  it('passes an argv as it is on Windows, with Bun quoting it', async () => {
    const bun = fakeBun();
    const spawn = await bunBinding(bun, 'win32');
    spawn('pwsh.exe', ['-NoLogo', '-Command', 'echo "hi"'], { cols: 80, rows: 24, env: {} });
    expect(bun.spawned[0]?.cmd).toEqual(['pwsh.exe', '-NoLogo', '-Command', 'echo "hi"']);
    expect('windowsVerbatimArguments' in (bun.spawned[0]?.options ?? {})).toBe(false);
  });

  it('ends the process with no signal on Windows, and refuses one there, as node-pty does', async () => {
    const bun = fakeBun();
    const { terminal } = started(await bunBinding(bun, 'win32'));
    terminal.kill();
    expect(bun.killed).toEqual([undefined]);
    expect(() => { terminal.kill('SIGINT'); }).toThrow('Signals not supported on windows.');
    expect(bun.killed).toEqual([undefined]);
  });

  it('hands over a character split across two reads whole, and nothing for its first half', async () => {
    const bun = fakeBun();
    const { heard } = started(await bunBinding(bun));
    bun.say(Uint8Array.of(0xc3));
    bun.say(Uint8Array.of(0xa9, 0x41));
    expect(heard).toEqual(['éA']);
  });

  it('says the exit once the process has exited, with the code Bun gives, and closes the terminal', async () => {
    const bun = fakeBun();
    const { exits } = started(await bunBinding(bun));
    await settled();
    expect(exits).toEqual([]);
    expect(bun.closed()).toBe(false);
    bun.exit(3);
    await settled();
    expect(exits).toEqual([3]);
    expect(bun.closed()).toBe(true);
  });

  it('writes nothing once its terminal has closed, as node-pty writes nothing once its output has', async () => {
    const bun = fakeBun();
    const { terminal } = started(await bunBinding(bun));
    terminal.write('ls\r');
    bun.exit(0);
    await settled();
    expect(() => { terminal.write('pwd\r'); }).not.toThrow();
    expect(bun.written).toEqual(['ls\r']);
  });

  it('sends SIGHUP when no signal is named, and a named one as it is', async () => {
    const bun = fakeBun();
    const { terminal } = started(await bunBinding(bun));
    terminal.kill();
    terminal.kill('SIGINT');
    expect(bun.killed).toEqual(['SIGHUP', 'SIGINT']);
  });

  it('swallows a signal Bun refuses, as node-pty swallows what process.kill refuses', async () => {
    const refused = Object.assign(new TypeError("signal must be one of 'SIGHUP', 'SIGINT'"), { code: 'ERR_INVALID_ARG_TYPE' });
    const bun = fakeBun({ refuseSignal: refused });
    const { terminal } = started(await bunBinding(bun));
    expect(() => { terminal.kill('SIGFOO'); }).not.toThrow();
  });

  it("writes and resizes Bun's terminal", async () => {
    const bun = fakeBun();
    const { terminal } = started(await bunBinding(bun));
    terminal.write('ls\r');
    terminal.resize(100, 30);
    expect(bun.written).toEqual(['ls\r']);
    expect(bun.resized).toEqual([[100, 30]]);
  });

  it('says a start Bun refuses in its output, with 127, to listeners put on after the call', async () => {
    const bun = fakeBun({ refuse: new Error("ENOENT: no such file or directory, posix_spawn '/bin/sh'") });
    const { terminal, heard, exits } = started(await bunBinding(bun));
    await settled();
    expect(heard).toEqual(["ENOENT: no such file or directory, posix_spawn '/bin/sh'\r\n"]);
    expect(exits).toEqual([127]);
    terminal.write('ls\r');
    terminal.resize(100, 30);
    terminal.kill();
    expect(bun.killed).toEqual([]);
  });
});

/*
 * Which Bun gets its own terminal, and that no Bun gets `node-pty`: on Bun
 * 1.3.13 and 1.4.4 it loads and every shell it starts dies at once, so a Bun
 * without a terminal of its own gets pipes, whatever a probe would say.
 */
describe('the binding on Bun', () => {
  it("is Bun's own where Bun makes a terminal", async () => {
    vi.stubGlobal('Bun', fakeBun().Bun);
    expect((await pty('linux')).pty).toBeTypeOf('function');
  });

  it('is pipes on a Bun without Bun.Terminal', async () => {
    vi.stubGlobal('Bun', fakeBun({ terminal: false }).Bun);
    expect(await pty('linux')).toEqual({});
  });

  it("is Bun's own on Windows, where Bun 1.3.14 makes a ConPTY", async () => {
    vi.stubGlobal('Bun', fakeBun().Bun);
    expect((await pty('win32')).pty).toBeTypeOf('function');
  });

  it('is pipes where Bun cannot make a terminal, as Bun 1.3.13 cannot on Windows', async () => {
    vi.stubGlobal('Bun', fakeBun({ terminalRefused: true }).Bun);
    expect(await pty('win32')).toEqual({});
  });
});
