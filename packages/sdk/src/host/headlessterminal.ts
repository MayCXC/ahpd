/**
 * A terminal's screen, as an emulator keeps it from what the terminal said.
 *
 * The reference host's `AgentHostHeadlessTerminal`
 * (https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/agentHostHeadlessTerminal.ts),
 * over the same `@xterm/headless`. Its tools ask it two things before and
 * while a command runs: whether the shell has bracketed paste on, and whether
 * the alternate screen is showing.
 *
 * The reference also answers a program's cursor position queries from it and
 * writes the answer back to the terminal. This host's terminals answer none,
 * so nothing here writes to the terminal.
 */

import pkg from '@xterm/headless';

const { Terminal } = pkg;

/** One terminal's emulated screen. */
export interface HeadlessTerminal {
  /** Feed it what the terminal said, in order. */
  writePtyData(data: string): Promise<void>;
  /** Settles once everything fed so far has been parsed. */
  whenPtyDataFlushed(): Promise<void>;
  resize(cols: number, rows: number): void;
  /** Whether the program reading the terminal has turned bracketed paste on. */
  isBracketedPasteMode(): boolean;
  /** Whether the alternate screen is the one showing. */
  isInAltBuffer(): boolean;
  /**
   * Settles when the alternate screen shows, or at once when it already is.
   *
   * The listener it adds is taken away by the function it pushes to `stops`.
   */
  createAltBufferPromise(stops: (() => void)[]): Promise<void>;
  /** Wipe the screen, as a client's clear wipes the terminal's. */
  clear(): void;
  dispose(): void;
}

export function createHeadlessTerminal(options: { cols: number; rows: number; scrollback: number }): HeadlessTerminal {
  const terminal = new Terminal({
    cols: options.cols,
    rows: options.rows,
    scrollback: options.scrollback,
    allowProposedApi: true,
  });
  let writeBarrier: Promise<void> = Promise.resolve();
  let isDisposed = false;

  const writePtyData = (data: string): Promise<void> => {
    writeBarrier = writeBarrier.catch(() => undefined).then(() => {
      if (isDisposed) return undefined;
      return new Promise<void>((resolve) => {
        try {
          terminal.write(data, resolve);
        }
        catch {
          resolve();
        }
      });
    });
    return writeBarrier;
  };

  const isInAltBuffer = (): boolean => terminal.buffer.active === terminal.buffer.alternate;

  return {
    writePtyData,
    whenPtyDataFlushed: () => writeBarrier.catch(() => undefined),
    resize: (cols, rows) => { terminal.resize(cols, rows); },
    isBracketedPasteMode: () => terminal.modes.bracketedPasteMode,
    isInAltBuffer,
    createAltBufferPromise: (stops) => new Promise<void>((resolve) => {
      if (isInAltBuffer()) {
        resolve();
        return;
      }
      const listener = terminal.buffer.onBufferChange(() => {
        if (isInAltBuffer()) resolve();
      });
      stops.push(() => { listener.dispose(); });
    }),
    // `clear()` keeps the visible lines, so the sequences a clear writes are
    // fed instead, as the reference feeds them.
    clear: () => { void writePtyData('\x1b[2J\x1b[3J\x1b[H'); },
    dispose: () => {
      isDisposed = true;
      terminal.dispose();
    },
  };
}
