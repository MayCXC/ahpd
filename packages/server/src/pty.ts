/** The optional pseudoterminal binding, and how to find out whether it works. */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { SpawnPty } from '@ahpd/sdk';

/**
 * By name at runtime, so the type checker is not asked for a module that may
 * not be installed - which is the whole point of it being optional.
 */
const MODULE = 'node-pty' as string;

/** This file, as the child is told to run it. */
const SELF = fileURLToPath(import.meta.url);

/**
 * Whether this runtime can load it, asked of a process that is allowed to die.
 *
 * `node-pty` is native code, and native code that does not match its runtime
 * does not throw: `dlopen` aborts the process, or the module panics on a
 * function the runtime does not implement, and neither is something a
 * `try/catch` around the import can hold. Either takes the whole daemon down
 * over a feature that is marked optional.
 *
 * So the import is tried in a child of the same runtime first, and only
 * repeated here once the child has survived it. A crash is then an exit code.
 */
const loadable = (): boolean => {
  const probe = spawnSync(process.execPath, [SELF, '--probe'], { stdio: 'ignore', windowsHide: true });
  return probe.status === 0;
};

/**
 * A pseudoterminal from Bun's own `terminal` option, in the shape the store takes.
 *
 * As Bun's "Terminal (PTY) support" gives it: the output is the terminal's
 * `data`, the process is awaited with `exited`, and the terminal is closed
 * after it,
 * https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L318-L342.
 * Bun's own tests read a terminal's whole output once `exited` has resolved,
 * https://github.com/oven-sh/bun/blob/bun-v1.3.13/test/js/bun/terminal/terminal.test.ts#L959-L985,
 * so the exit is said after the output, as the store says it on pipes.
 *
 * The terminal's `exit` callback is not passed. Up to Bun 1.3.13, a terminal
 * that has one turns a start Bun refuses into a crash of Bun itself rather
 * than a throw, and the whole output has arrived by the time `exited`
 * resolves either way.
 *
 * Where Bun leaves a choice open, this makes the one `node-pty` makes, because
 * the port is `node-pty`'s shape, and `node-pty` has a terminal for Unix and
 * one for Windows,
 * https://github.com/microsoft/node-pty/blob/v1.1.0/src/index.ts#L12-L16.
 * On Unix, arguments as one string are refused, and `kill` sends `SIGHUP` when
 * it names no signal. On Windows, arguments as one string are the command line
 * after the file, which is how the store hands `cmd.exe` its line, and `kill`
 * takes no signal. On both, a write once the terminal has closed does nothing.
 */
const bunTerminal = (Bun: BunRuntime, platform: string): SpawnPty => (file, args, { cwd, cols, rows, env }) => {
  const windows = platform === 'win32';
  // `node-pty`'s own refusal on Unix:
  // https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L50-L52
  if (typeof args === 'string' && !windows) throw new Error('args as a string is not supported on unix.');
  /*
   * On Windows, a string is the command line after the file, written as it
   * is, as `node-pty` writes it there,
   * https://github.com/microsoft/node-pty/blob/v1.1.0/src/windowsPtyAgent.ts#L255-L261.
   * Bun is told the arguments are verbatim, as the store tells Node for
   * `cmd.exe` on pipes, and Bun passes that flag to libuv beside the
   * pseudoconsole,
   * https://github.com/oven-sh/bun/blob/bun-v1.3.14/src/runtime/api/bun/process.zig#L1709-L1719.
   */
  const verbatim = typeof args === 'string';
  const argv = typeof args === 'string' ? (args === '' ? [file] : [file, args]) : [file, ...args];
  const heard: ((data: string) => void)[] = [];
  const ended: ((exit: { exitCode: number }) => void)[] = [];
  const said = (data: string): void => { for (const listen of heard) listen(data); };
  const gone = (exitCode: number): void => { for (const listen of ended) listen({ exitCode }); };
  // One decoder for the whole stream, so a character split across two reads
  // arrives whole and a read holding only its start says nothing, as with
  // `node-pty`'s `setEncoding('utf8')`:
  // https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L109-L111
  const text = new TextDecoder();
  /** Starts the subprocess, and answers nothing when Bun refuses to. */
  const started = (): BunSubprocess | undefined => {
    try {
      return Bun.spawn(argv, {
        ...(cwd !== undefined ? { cwd } : {}),
        env,
        ...(verbatim ? { windowsVerbatimArguments: true } : {}),
        terminal: {
          cols,
          rows,
          data: (_terminal, bytes) => {
            const chunk = text.decode(bytes, { stream: true });
            if (chunk !== '') said(chunk);
          },
        },
      });
    }
    catch (error) {
      /*
       * A shell that fails to start, not a refusal: a directory that is not
       * there is said in the terminal's own output with the exit code `127`,
       * as the store says it on pipes, on a line ending in `\r\n` as each line
       * a pseudoterminal writes does. Queued, because the store puts its
       * listeners on after this call returns.
       */
      queueMicrotask(() => {
        said(`${error instanceof Error ? error.message : String(error)}\r\n`);
        gone(127);
      });
      return undefined;
    }
  };
  const proc = started();
  if (proc !== undefined) {
    void proc.exited.then((exitCode) => {
      proc.terminal.close();
      gone(exitCode);
    });
  }
  return {
    onData: (listen) => { heard.push(listen); },
    onExit: (listen) => { ended.push(listen); },
    // Nothing once the terminal has closed, where Bun's `write` throws:
    // `node-pty` makes its own `write` a no-op when its output closes,
    // https://github.com/microsoft/node-pty/blob/v1.1.0/src/terminal.ts#L190-L195
    write: (data) => { if (proc !== undefined && !proc.terminal.closed) proc.terminal.write(data); },
    resize: (nextCols, nextRows) => { proc?.terminal.resize(nextCols, nextRows); },
    kill: windows
      /*
       * On Windows, no signal, as `node-pty` takes none there,
       * https://github.com/microsoft/node-pty/blob/v1.1.0/src/windowsTerminal.ts#L164-L171,
       * and Bun's own `SIGTERM` ends the process, where libuv has no `SIGHUP`,
       * https://github.com/libuv/libuv/blob/v1.51.0/src/win/process.c#L1295-L1304.
       */
      ? (signal) => {
        if (signal) throw new Error('Signals not supported on windows.');
        proc?.kill();
      }
      /*
       * On Unix, `SIGHUP` when nothing is named, as `node-pty` sends: an
       * interactive shell ignores Bun's own default, `SIGTERM`, and the store's
       * close names none. A signal the runtime refuses is swallowed, as
       * `node-pty` swallows it,
       * https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L249-L253.
       */
      : (signal) => {
        try { proc?.kill(signal ?? 'SIGHUP'); }
        catch { /* a signal Bun does not know */ }
      },
  };
};

/**
 * Whether this Bun makes a terminal on this system.
 *
 * One is made and closed here, as `loadable` tries `node-pty` before the
 * binding is handed out. A Bun with no terminal on its system throws rather
 * than aborting, as 1.3.13 does on Windows, so the try needs no child:
 * https://github.com/oven-sh/bun/blob/bun-v1.3.13/src/bun.js/api/bun/Terminal.zig#L270-L278
 */
const makesTerminal = (Bun: BunRuntime): boolean => {
  if (Bun.Terminal === undefined) return false;
  try {
    new Bun.Terminal({ cols: 1, rows: 1 }).close();
    return true;
  }
  catch {
    return false;
  }
};

/**
 * The binding, if this machine has one that runs.
 *
 * With it, shells run under a real terminal and the shell's own OSC 133 marks
 * turn into command boundaries. Without it they run on pipes and the state
 * says `isPty: false`, which is what the protocol has that flag for.
 *
 * On Bun it is Bun's own, wherever Bun makes a terminal: on Linux and macOS
 * from 1.3.5, which brought `Bun.Terminal`, and on Windows, through ConPTY,
 * from 1.3.14. Any other Bun gets pipes. `node-pty` is never loaded on Bun,
 * whatever a probe says: on Bun 1.3.13 and 1.4.4 it loads, so the child below
 * survives it, and every shell it starts dies of `SIGHUP` before printing
 * anything. Everywhere else it is `node-pty`, where a child of the same
 * runtime survives loading it.
 *
 * `platform` is handed in, as the terminal store's is, so a case on Linux can
 * ask what a Windows machine would answer.
 */
export const pty = async (platform: string = process.platform): Promise<{ pty?: SpawnPty }> => {
  // Imported here rather than at the top, so the child below still loads
  // nothing but `node-pty`.
  const { runtime } = await import('@ahpd/sdk');
  if (runtime() === 'bun') {
    const Bun = (globalThis as unknown as { Bun: BunRuntime }).Bun;
    return makesTerminal(Bun) ? { pty: bunTerminal(Bun, platform) } : {};
  }
  if (!loadable()) return {};
  try {
    const found = await import(/* @vite-ignore */ MODULE) as { spawn?: unknown };
    return typeof found.spawn === 'function' ? { pty: found.spawn as SpawnPty } : {};
  }
  catch {
    return {};
  }
};

// The child `loadable` spawns. Nothing else in this file has run yet, and
// nothing else is imported, so what it exits with is about `node-pty` alone.
if (process.argv[1] === SELF && process.argv[2] === '--probe') {
  try {
    const found = await import(/* @vite-ignore */ MODULE) as { spawn?: unknown };
    process.exit(typeof found.spawn === 'function' ? 0 : 1);
  }
  catch {
    process.exit(1);
  }
}

/*
 * The shapes Bun hands back, named so the code above reads, as `Bun.spawn`
 * and its `Terminal` are declared in "Terminal (PTY) support".
 */

/** `Bun.spawn` with a terminal, and `Bun.Terminal`, which is made once to see that Bun has one here. */
interface BunRuntime {
  Terminal?: new (options: { cols: number; rows: number }) => { close(): void };
  spawn(cmd: string[], options: {
    cwd?: string;
    env: Record<string, string | undefined>;
    windowsVerbatimArguments?: boolean;
    terminal: { cols: number; rows: number; data(terminal: BunTerminal, data: Uint8Array): void };
  }): BunSubprocess;
}

/** A subprocess `Bun.spawn` answered: `exited` resolves to its exit code. */
interface BunSubprocess { terminal: BunTerminal; exited: Promise<number>; kill(signal?: number | string): void }

interface BunTerminal { readonly closed: boolean; write(data: string): number; resize(cols: number, rows: number): void; close(): void }
