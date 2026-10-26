/**
 * The shells an agent runs commands in, one set per session.
 *
 * The reference host's agent terminal tool, carried onto this host's terminal
 * store: VS Code's `ShellManager`
 * (https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotShellTools.ts#L47-L304)
 * and the command execution its tools share
 * (https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/shared/shellCommandExecution.ts).
 * A shell is a terminal on the root list, claimed by the session, so the person
 * in the session watches the command run and can type into it or stop it.
 *
 * The reference's shell integration is a script it injects, and this host
 * injects none: a command's end is the shell's own OSC 133 mark once the
 * shell has marked a command, and the reference's sentinel until then. The
 * alternate screen and bracketed paste are read off a headless terminal fed
 * with what each shell says, as the reference reads them.
 */

import { posix, win32 } from 'node:path';
import { MARKS, shellOf } from '../machines/terminals.js';
import { localPath } from '../resources/fileuri.js';
import { ROOT } from './channels.js';
import { createHeadlessTerminal } from './headlessterminal.js';
import type { HeadlessTerminal } from './headlessterminal.js';
import type { Bag } from '../types/common.js';
import type { Claim, Terminal } from '../types/terminals.js';
import type { HeldShell, ManagedShell, ShellCommandResult, ShellType, Shells } from '../types/shells.js';
import type { HostContext } from './context.js';

/** The most output a command result hands a model, in characters. */
export const SHELL_COMMAND_MAX_OUTPUT_BYTES = 80_000;

/** How long a command is waited for when the call names no timeout: two minutes. */
export const DEFAULT_SHELL_COMMAND_TIMEOUT_MS = 120_000;

/**
 * The start of the line a shell echoes after each command.
 *
 * The reference's own spelling, `<<<COPILOT_SENTINEL_<id>_EXIT_<code>>>>`, kept
 * so a transcript of one host reads the same as the other's.
 */
const SENTINEL_PREFIX = '<<<COPILOT_SENTINEL_';

/**
 * Settings that keep a program from waiting on a pager or a prompt.
 *
 * The reference's `nonInteractive` set, for a terminal a tool runs commands in:
 * an empty pager is no pager in git, less and most tools.
 */
const NON_INTERACTIVE_ENV: Record<string, string> = {
  LC_ALL: 'C.UTF-8',
  PAGER: '',
  GIT_PAGER: '',
  GH_PAGER: '',
  GIT_TERMINAL_PROMPT: '0',
  DEBIAN_FRONTEND: 'noninteractive',
};

/**
 * The scrollback each shell's headless terminal keeps: none, as the
 * reference's `HEADLESS_TERMINAL_SCROLLBACK`. The screen is all it is asked
 * about, and the output a model reads comes from the terminal's own content.
 */
const HEADLESS_TERMINAL_SCROLLBACK = 0;

/*
 * VS Code's `removeAnsiEscapeCodes`
 * (https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/base/common/strings.ts#L846-L887),
 * the three sequence families of the xterm control sequences.
 */
const CSI_SEQUENCE = /(?:\x1b\[|\x9b)[=?>!]?[\d;:]*["$#'* ]?[a-zA-Z@^`{}|~]/;
const OSC_SEQUENCE = /(?:\x1b\]|\x9d).*?(?:\x1b\\|\x07|\x9c)/;
const ESC_SEQUENCE = /\x1b(?:[ #%\(\)\*\+\-\.\/]?[a-zA-Z0-9\|}~@])/;
const CONTROL_SEQUENCES = new RegExp(`(?:${[CSI_SEQUENCE.source, OSC_SEQUENCE.source, ESC_SEQUENCE.source].join('|')})`, 'g');

/** A string with every terminal control sequence taken out. */
export const removeAnsiEscapeCodes = (text: string): string => (text ? text.replace(CONTROL_SEQUENCES, '') : text);

/**
 * The kind of shell a program is, by its file name.
 *
 * The reference's `shellTypeForExecutable`: PowerShell by name, every POSIX
 * shell and launcher of one as `bash`, and the platform's own for a name it
 * does not know.
 */
export const shellTypeForExecutable = (shellPath: string, platform: string = process.platform): ShellType => {
  const lastSep = Math.max(shellPath.lastIndexOf('/'), shellPath.lastIndexOf('\\'));
  const base = shellPath.slice(lastSep + 1).toLowerCase().replace(/\.exe$/u, '');
  switch (base) {
    case 'pwsh':
    case 'powershell':
    case 'pwsh-preview':
      return 'powershell';
    case 'bash':
    case 'sh':
    case 'zsh':
    case 'fish':
    case 'csh':
    case 'ksh':
    case 'nu':
    case 'xonsh':
    case 'git-cmd':
    case 'wsl':
    case 'ubuntu':
    case 'ubuntu1804':
    case 'kali':
    case 'debian':
    case 'opensuse-42':
    case 'sles-12':
      return 'bash';
    default:
      return platform === 'win32' ? 'powershell' : 'bash';
  }
};

/**
 * Whether a program is zsh, by its file name.
 *
 * The reference's `isZsh` (`node/agentHostShellUtils.ts`): `zsh` or `zsh.exe`
 * in any case on Windows, `zsh` exactly elsewhere.
 */
export const isZsh = (shellPath: string, platform: string = process.platform): boolean => (platform === 'win32'
  ? /^zsh(?:\.exe)?$/iu.test(win32.basename(shellPath))
  : /^zsh$/u.test(posix.basename(shellPath)));

/**
 * The space a POSIX shell keeps a command out of its history for.
 *
 * Under `HISTCONTROL=ignorespace` or `HIST_IGNORE_SPACE`, a command that starts
 * with a space is not recorded. PowerShell keeps its history elsewhere.
 */
export const prefixForHistorySuppression = (shellType: ShellType): string => (shellType === 'powershell' ? '' : ' ');

/** A command that spans lines, by an unescaped newline. */
export const isMultilineCommand = (command: string): boolean => /(?<!\\)\n/u.test(command.replace(/\r\n|\r/gu, '\n'));

/**
 * Whether a command is typed as a paste.
 *
 * The reference's `shouldUseBracketedPasteMode`: on macOS always, and a command
 * of more than one line anywhere. It is pasted only where the shell has turned
 * bracketed paste on.
 */
const shouldUseBracketedPasteMode = (command: string, platform: string = process.platform): boolean =>
  platform === 'darwin' || isMultilineCommand(command);

/** The command a shell echoes its sentinel with, carrying the last exit code. */
const sentinelCommand = (id: string, shellType: ShellType): string => (shellType === 'powershell'
  ? `Write-Output "${SENTINEL_PREFIX}${id}_EXIT_$LASTEXITCODE>>>"`
  : `echo "${SENTINEL_PREFIX}${id}_EXIT_$?>>>"`);

/**
 * The newest complete sentinel in some output, and what came before it.
 *
 * A shell under a pseudoterminal echoes the command it was typed, so the
 * sentinel's own command line is in the output too, with `$?` where the code
 * will be: an occurrence whose code is not a number is that echo, and the scan
 * goes on to an earlier one.
 */
const parseSentinel = (content: string, id: string): { found: true; exitCode: number; before: string } | { found: false } => {
  const marker = `${SENTINEL_PREFIX}${id}_EXIT_`;
  let at = content.lastIndexOf(marker);
  while (at !== -1) {
    const after = content.substring(at + marker.length);
    const end = after.indexOf('>>>');
    if (end !== -1) {
      const code = after.substring(0, end).trim();
      if (/^-?\d+$/u.test(code)) return { found: true, exitCode: Number.parseInt(code, 10), before: content.substring(0, at) };
    }
    at = content.lastIndexOf(marker, at - 1);
  }
  return { found: false };
};

/**
 * Output as a model reads it: no control sequences, no outer whitespace, and
 * the last `SHELL_COMMAND_MAX_OUTPUT_BYTES` characters at most.
 */
export const prepareOutputForModel = (raw: string): string => {
  const text = removeAnsiEscapeCodes(raw).trim();
  return text.length > SHELL_COMMAND_MAX_OUTPUT_BYTES ? text.substring(text.length - SHELL_COMMAND_MAX_OUTPUT_BYTES) : text;
};

/**
 * The command last written to a shell.
 *
 * The reference takes the length of the terminal's content when a command
 * starts and reads the content from there, clamped once its manager has
 * trimmed it. This host's terminal keeps its last 200,000 characters and,
 * once it holds that many, drops one for each it takes, so a length taken at
 * the start stops naming the place the command began. The place is counted
 * back from the end instead, by what the terminal has said since: while
 * nothing has been dropped that is the reference's offset, and once something
 * has it is the reference's clamp.
 */
interface Started {
  /** How many characters the terminal has said since the command was written. */
  received: number;
  /** The sentinel that ends it, when the shell marks no commands. */
  sentinel?: string;
}

/** What a session keeps of one shell before its terminal is open. */
interface Heard {
  listeners: Set<(action: Bag) => void>;
  /** The shell's screen, fed with what it says. */
  screen: HeadlessTerminal;
  /**
   * Whether the shell marks its own commands.
   *
   * Set the first time it marks one in OSC 133, as the reference turns to its
   * shell integration once the first of its marks arrives: from then on a
   * command ends at the shell's own mark rather than at a sentinel.
   */
  marks: boolean;
  command?: Started;
}

/** One shell as a session holds it. */
interface Entry extends Heard {
  shell: ManagedShell;
  terminal: Terminal;
}

/**
 * Fold one action of a shell's terminal into what is kept of it, then tell
 * whoever is waiting. The screen is fed what the terminal says, resized with
 * it and wiped with it, as the reference's manager feeds its own.
 */
const observe = (kept: Heard, action: Bag): void => {
  if (action.type === 'terminal/data') {
    const data = String(action.data ?? '');
    void kept.screen.writePtyData(data);
    if (kept.command !== undefined) kept.command.received += data.length;
  }
  else if (action.type === 'terminal/resized') kept.screen.resize(Number(action.cols), Number(action.rows));
  else if (action.type === 'terminal/cleared') kept.screen.clear();
  else if (action.type === 'terminal/commandExecuted' || action.type === 'terminal/commandFinished') kept.marks = true;
  for (const listen of [...kept.listeners]) listen(action);
};

/** Every session's shells, made the first time a session's agent asks for one. */
export interface HostShells {
  /** One session's shells, or nothing where this host has no terminal store. */
  of(session: string): Shells | undefined;
  /** Forget a session's shells. Its terminals are closed with the session. */
  forgetSession(uri: string): void;
}

export function createShells(ctx: HostContext): HostShells {
  const { options, terminals, dispatch, log } = ctx;
  const sessions = new Map<string, Shells & { dispose(): void }>();

  /**
   * The directory a new shell starts in: the session's first working
   * directory, which is where a `!` command runs, or the host's own.
   */
  const whereOf = (session: string): string => {
    const held = ctx.sessions.get(session);
    const first = held?.chats.get(held.defaultChat)?.workingDirectories()[0];
    return first === undefined ? options.path : localPath(first);
  };

  const sessionShells = (session: string): Shells & { dispose(): void } => {
    const entries = new Map<string, Entry>();
    /** The shells running a command, which no other command may use. */
    const busy = new Set<string>();
    /** The shells kept busy after their call, until the command in them ends. */
    const held = new Map<string, () => void>();
    // `shellOf` with nothing asked is the program the store runs when a
    // terminal names no shell, which `heldShell` does not.
    const executable = shellOf();
    const shellType = shellTypeForExecutable(executable);

    const entryOf = (shell: ManagedShell): Entry | undefined => entries.get(shell.id);
    const alive = (entry: Entry): boolean => terminals.get(entry.shell.terminalUri) === entry.terminal;

    /** The terminal's scrollback, or nothing once its terminal is gone, as the reference's `getContent` answers. */
    const content = (shell: ManagedShell): string => {
      const entry = entryOf(shell);
      if (entry === undefined || !alive(entry)) return '';
      // The protocol's recipe for the stream behind the typed parts.
      return entry.terminal.state().content
        .map((part) => (part.type === 'command' ? part.output : part.value))
        .join('');
    };

    /**
     * What the terminal's content holds between two points of a command, each
     * a count of what the terminal had said since the command was written, or
     * to the end. A point the terminal has dropped reads as the content's start.
     */
    const between = (shell: ManagedShell, started: Started, from: number, to: number = started.received): string => {
      const full = content(shell);
      const at = (point: number): number => Math.max(0, full.length - (started.received - point));
      return full.substring(at(from), at(to));
    };

    /**
     * Whether a command is written inside the bracketed paste marks.
     *
     * The reference's `sendText`: only when the command asks for it, and only
     * once the screen has caught up with what the shell said and shows the
     * mode on.
     */
    const pasted = async (entry: Entry, asked: boolean): Promise<boolean> => {
      if (!asked) return false;
      await entry.screen.whenPtyDataFlushed();
      return entry.screen.isBracketedPasteMode();
    };

    /**
     * Text as a shell reads it.
     *
     * The reference's `formatTerminalText`. Under a pseudoterminal a line ends
     * in a carriage return, which is what the line discipline reads as Enter;
     * a shell on pipes reads a newline, so on pipes the newline stays.
     */
    const formatted = (entry: Entry, text: string, execute: boolean, paste: boolean): string => {
      const end = entry.terminal.state().isPty === true ? '\r' : '\n';
      const wrapped = paste ? `\x1b[200~${text}\x1b[201~` : text;
      const body = wrapped.replace(/\r?\n/gu, end);
      return execute && !body.endsWith(end) ? `${body}${end}` : body;
    };

    /**
     * An idle shell, or a new one claimed by the call that asked.
     *
     * The reference's `getOrCreateShell`. A shell taken again keeps the claim
     * it was opened with, as the reference's does.
     */
    const acquire = (claim: { chat: string; turnId?: string; toolCallId?: string }): HeldShell => {
      for (const entry of entries.values()) {
        if (!alive(entry)) continue;
        if (entry.terminal.lifecycle().status === 'exited') {
          entries.delete(entry.shell.id);
          continue;
        }
        // A command is already running there, and sharing it would interleave both.
        if (busy.has(entry.shell.id)) continue;
        busy.add(entry.shell.id);
        return reference(entry.shell);
      }
      const shells = options.terminals;
      if (shells === undefined) throw new Error('There is no shell here to run it in');
      const id = crypto.randomUUID();
      const wanted: Claim = {
        kind: 'session',
        session,
        chat: claim.chat,
        ...(claim.turnId !== undefined ? { turnId: claim.turnId } : {}),
        ...(claim.toolCallId !== undefined ? { toolCallId: claim.toolCallId } : {}),
      };
      // The store's own size for a terminal that names none, which `heldShell`
      // does not; a resize reaches the screen with the terminal's.
      const kept: Heard = {
        listeners: new Set(),
        screen: createHeadlessTerminal({ cols: 80, rows: 24, scrollback: HEADLESS_TERMINAL_SCROLLBACK }),
        marks: false,
      };
      const terminal = ctx.heldShell(shells, {
        cwd: whereOf(session),
        claim: wanted,
        name: shellType === 'bash' ? 'Bash' : 'PowerShell',
        env: NON_INTERACTIVE_ENV,
        watch: (action) => { observe(kept, action); },
      });
      const shell: ManagedShell = { id, terminalUri: terminal.uri, shellType, executable };
      entries.set(id, Object.assign(kept, { shell, terminal }));
      busy.add(id);
      log(`made the ${shellType} shell ${id} for ${session} (${terminal.uri}, ${executable})`);
      return reference(shell);
    };

    /** A hold on one shell, released once, as the reference's `IReference` is. */
    const reference = (shell: ManagedShell): HeldShell => {
      let released = false;
      return {
        shell,
        release: () => {
          if (released) return;
          released = true;
          busy.delete(shell.id);
        },
      };
    };

    const listen = (entry: Entry, listener: (action: Bag) => void): () => void => {
      entry.listeners.add(listener);
      return () => { entry.listeners.delete(listener); };
    };

    /**
     * Run one command, and answer how it ended.
     *
     * The reference's two executions. Where the shell marks its own commands,
     * the command ends at its `D` mark, with the code the mark carries and the
     * output between its `C` and its `D`. Where it marks none, the command is
     * followed by a line echoing a sentinel with its exit code, and the output
     * between the two is the result. What else ends the wait is the
     * reference's in both: the alternate screen, the shell exiting, a client
     * narrowing the claim to the session and chat alone, which moves the
     * command to the background, and the timeout.
     */
    const run = async (shell: ManagedShell, command: string, timeoutMs: number): Promise<ShellCommandResult> => {
      const entry = entryOf(shell);
      if (entry === undefined) throw new Error(`There is no shell ${shell.id}`);
      // Asked once, before the command is written, as the reference asks.
      const marked = entry.marks;
      const sentinel = marked ? undefined : crypto.randomUUID().replaceAll('-', '');
      const started: Started = { received: 0, ...(sentinel !== undefined ? { sentinel } : {}) };
      entry.command = started;
      /** The output a timeout or an exit hands back: the content where the shell marks, the command's own otherwise. */
      const partial = (): string => prepareOutputForModel(marked ? content(shell) : between(shell, started, 0));
      const result = new Promise<ShellCommandResult>((resolve) => {
        let done = false;
        const stops: (() => void)[] = [];
        const finish = (answer: ShellCommandResult): void => {
          if (done) return;
          done = true;
          for (const stop of stops) stop();
          resolve(answer);
        };
        /** A `C` the shell announced and the chunk carrying it has not yet arrived. */
        let starting = false;
        /** Where the command's output starts, after its `C`. */
        let opened: number | undefined;
        /** What the shell's `D` said, once it has said it. */
        let ended: { exitCode?: number } | undefined;
        stops.push(listen(entry, (action) => {
          switch (action.type) {
            case 'terminal/commandExecuted':
              if (marked) starting = true;
              return;
            case 'terminal/commandFinished': {
              const code = Number(action.exitCode);
              if (marked) ended = Number.isFinite(code) ? { exitCode: code } : {};
              return;
            }
            case 'terminal/data': {
              if (sentinel !== undefined) {
                const parsed = parseSentinel(between(shell, started, 0), sentinel);
                if (parsed.found) finish({ status: 'completed', exitCode: parsed.exitCode, output: prepareOutputForModel(parsed.before) });
                return;
              }
              if (!starting && ended === undefined) return;
              const data = String(action.data ?? '');
              const chunkAt = started.received - data.length;
              // The marks the terminal announced are in this chunk: it reads
              // a chunk for its marks before it says the chunk.
              for (const found of data.matchAll(MARKS)) {
                if (found[1] !== '133') continue;
                const mark = (found[2] ?? '').split(';')[0];
                if (mark === 'C' && starting) {
                  starting = false;
                  opened = chunkAt + found.index + found[0].length;
                }
                else if (mark === 'D' && ended !== undefined && !starting) {
                  const output = between(shell, started, opened ?? 0, chunkAt + found.index);
                  finish({ status: 'completed', exitCode: ended.exitCode ?? 0, output: prepareOutputForModel(output) });
                  return;
                }
              }
              return;
            }
            case 'terminal/exited': {
              const code = Number(action.exitCode);
              log(`the shell ${shell.id} exited with ${String(action.exitCode)}`);
              finish({ status: 'shellExited', ...(Number.isFinite(code) ? { exitCode: code } : {}), output: partial() });
              return;
            }
            case 'terminal/claimed': {
              const claim = action.claim as Bag | undefined;
              if (claim?.kind === 'session' && claim.toolCallId === undefined) {
                log(`the command in ${shell.id} goes on in the background`);
                finish({ status: 'background', output: '' });
              }
              return;
            }
            default:
          }
        }));
        const timer = setTimeout(() => {
          log(`the command in ${shell.id} ran past ${String(timeoutMs)} ms`);
          finish({ status: 'timeout', output: partial() });
        }, timeoutMs);
        stops.push(() => { clearTimeout(timer); });
        // The reference's `registerAltBufferHandler`, which settles at once
        // on a screen already showing the alternate one.
        void entry.screen.createAltBufferPromise(stops).then(() => {
          if (done) return;
          log(`the command in ${shell.id} entered the alternate screen`);
          finish({ status: 'altBuffer', output: '' });
        });
      });
      const line = `${prefixForHistorySuppression(shell.shellType)}${command}`;
      const paste = await pasted(entry, shouldUseBracketedPasteMode(command));
      entry.terminal.write(formatted(entry, line, true, paste));
      if (sentinel !== undefined) entry.terminal.write(formatted(entry, sentinelCommand(sentinel, shell.shellType), true, false));
      return await result;
    };

    /**
     * Keep a shell held until the command in it ends.
     *
     * The reference waits for the shell's own end-of-command mark, or its exit.
     * A command that ran without marks ends at its sentinel, which is already
     * written after it and which the shell echoes once the command returns.
     */
    const hold = (shell: ManagedShell): void => {
      const entry = entryOf(shell);
      if (entry === undefined || held.has(shell.id)) return;
      const command = entry.command;
      const free = (): void => {
        stop();
        held.delete(shell.id);
        busy.delete(shell.id);
      };
      const ended = (): boolean => command?.sentinel !== undefined
        && parseSentinel(between(shell, command, 0), command.sentinel).found;
      const stop = listen(entry, (action) => {
        if (action.type === 'terminal/exited') free();
        else if (command?.sentinel === undefined) {
          if (action.type === 'terminal/commandFinished') free();
        }
        else if (action.type === 'terminal/data' && ended()) free();
      });
      held.set(shell.id, free);
      // Already over, between the call's answer and this.
      if (entry.terminal.exitCode() !== undefined || ended()) free();
    };

    const shutdown = (id: string): boolean => {
      const entry = entries.get(id);
      if (entry === undefined) return false;
      held.get(id)?.();
      held.delete(id);
      entries.delete(id);
      busy.delete(id);
      entry.screen.dispose();
      // The reference's `disposeTerminal`: the process ends and the row goes.
      if (entry.terminal.exitCode() === undefined) entry.terminal.close();
      if (terminals.get(entry.shell.terminalUri) === entry.terminal) {
        terminals.delete(entry.shell.terminalUri);
        dispatch(ROOT, { type: 'root/terminalsChanged', terminals: ctx.terminalInfo() });
      }
      log(`shut down the shell ${id}`);
      return true;
    };

    return {
      executable: () => executable,
      shellType: () => shellType,
      acquire,
      run,
      hold,
      get: (id) => entries.get(id)?.shell,
      list: () => [...entries.values()].filter(alive).map((entry) => entry.shell),
      content,
      lifecycle: (shell) => {
        const entry = entryOf(shell);
        const state = entry?.terminal.lifecycle();
        if (state === undefined || state.status === 'running') return { status: 'running' };
        return { status: 'exited', ...('exitCode' in state && typeof state.exitCode === 'number' ? { exitCode: state.exitCode } : {}) };
      },
      send: (shell, text) => {
        const entry = entryOf(shell);
        if (entry !== undefined) entry.terminal.write(formatted(entry, text, false, false));
      },
      shutdown,
      // The screens go with the session; its terminals are closed by its teardown.
      dispose: () => {
        for (const entry of entries.values()) entry.screen.dispose();
        entries.clear();
      },
    };
  };

  return {
    of: (session) => {
      if (options.terminals === undefined) return undefined;
      let found = sessions.get(session);
      if (found === undefined) {
        found = sessionShells(session);
        sessions.set(session, found);
      }
      return found;
    },
    forgetSession: (uri) => {
      sessions.get(uri)?.dispose();
      sessions.delete(uri);
    },
  };
}
