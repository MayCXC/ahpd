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
 * Under a pseudoterminal the store starts each shell with the reference's
 * shell integration scripts, and a command ends at the shell's own `D` mark
 * once the terminal has announced command detection. Where it has not - on
 * pipes, in a shell the scripts do not cover, or before the shell has marked
 * anything - a command ends at the reference's sentinel. The alternate screen
 * and bracketed paste are read off a headless terminal fed with what each
 * shell says, as the reference reads them.
 */

import { shellOf } from '../machines/terminals.js';
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
 * The reference's `preventShellHistory`, for the same terminal: the
 * integration scripts read it and keep a command that starts with a space out
 * of the shell's history, which is why each command is written with one.
 */
const PREVENT_SHELL_HISTORY_ENV: Record<string, string> = {
  VSCODE_PREVENT_SHELL_HISTORY: '1',
};

/**
 * How long a new shell is given to say something before its first command:
 * the reference's `WAIT_FOR_PROMPT_TIMEOUT`, which its terminal manager waits
 * on before it hands a new terminal back
 * (https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/agentHostTerminalManager.ts#L506).
 */
const WAIT_FOR_PROMPT_TIMEOUT = 10_000;

/**
 * The actions a terminal sends because its shell said something, which a
 * new shell is waited on for. The rest follow what a client or the host did.
 */
const SPOKEN = new Set([
  'terminal/data',
  'terminal/commandDetectionAvailable',
  'terminal/commandExecuted',
  'terminal/commandFinished',
  'terminal/cwdChanged',
  'terminal/exited',
]);

/**
 * The scrollback each shell's headless terminal keeps: none, as the
 * reference's `HEADLESS_TERMINAL_SCROLLBACK`. The screen is all it is asked
 * about, and the output a model reads comes from the terminal's own content.
 */
const HEADLESS_TERMINAL_SCROLLBACK = 0;

/*
 * VS Code's `removeAnsiEscapeCodes`
 * (https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/base/common/strings.ts#L847-L886),
 * the three sequence families of the xterm control sequences.
 */
const CSI_SEQUENCE = /(?:\x1b\[|\x9b)[=?>!]?[\d;:]*["$#'* ]?[a-zA-Z@^`{}|~]/;
const OSC_SEQUENCE = /(?:\x1b\]|\x9d).*?(?:\x1b\\|\x07|\x9c)/;
const ESC_SEQUENCE = /\x1b(?:[ #%\(\)\*\+\-\.\/]?[a-zA-Z0-9\|}~@])/;
const CONTROL_SEQUENCES = new RegExp(`(?:${[CSI_SEQUENCE.source, OSC_SEQUENCE.source, ESC_SEQUENCE.source].join('|')})`, 'g');

/**
 * The name a shell's terminal and its calls go by.
 *
 * The reference's `shellDisplayName`, which titles the terminal it makes
 * (copilotShellTools.ts#L204) and the terminal a call shows (#L262).
 */
const shellDisplayName = (shellType: ShellType): string => (shellType === 'bash' ? 'Bash' : 'PowerShell');

/**
 * The key a call's terminal is kept under: the session the call was made in,
 * and the call's id.
 *
 * The reference keeps a call's shell by the call's id alone
 * (copilotShellTools.ts#L57, #L259). A call id is one a backend gave, and
 * unique only among its own session's calls, so the session scopes it: the
 * lead chat and its workers are the session's, and a subagent's call is drawn
 * in a worker chat while its tool was bound to the lead.
 */
const keyOf = (session: string, toolCallId: string): string => `${session}\u0000${toolCallId}`;

/** Whether a call's content already shows this terminal. */
const shows = (content: readonly Bag[], resource: unknown): boolean =>
  content.some((one) => one.type === 'terminal' && one.resource === resource);

/**
 * A call's content with its terminal on it.
 *
 * Laid after whatever the call holds, as the reference pushes it onto the
 * call's content (copilotAgentSession.ts#L2267-L2271); where the content
 * already shows the terminal, the command's exit is set on it, as the
 * reference sets a shell's exit on the block it finds (mapSessionEvents.ts
 * #L237-L240). The content handed in is answered as it is when nothing moved.
 */
const showing = (content: Bag[], block: Bag): Bag[] => {
  if (!shows(content, block.resource)) return [...content, block];
  if (block.result === undefined) return content;
  let moved = false;
  const next = content.map((one) => {
    if (one.type !== 'terminal' || one.resource !== block.resource || one.result === block.result) return one;
    moved = true;
    return { ...one, result: block.result };
  });
  return moved ? next : content;
};

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
  /** Whether the shell has said anything yet, which a new shell is given time to do. */
  spoke: boolean;
  command?: Started;
}

/** One shell as a session holds it. */
interface Entry extends Heard {
  shell: ManagedShell;
  terminal: Terminal;
  /** The call the shell was last given to, by its `keyOf`, when that call named itself. */
  call?: string;
}

/**
 * A tool call this host gave a shell, and the terminal it shows.
 *
 * The reference's `_toolCallShells` (copilotShellTools.ts#L258-L270), from a
 * call to its shell, kept as the block the call's content carries: the
 * terminal, its title, and the command's exit once the command has one.
 */
interface Called {
  /** The session whose shells the call ran in, which forgets it. */
  session: string;
  /** The call's terminal content. */
  block: Bag;
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
  if (SPOKEN.has(String(action.type))) kept.spoke = true;
  for (const listen of [...kept.listeners]) listen(action);
};

/** Every session's shells, made the first time a session's agent asks for one. */
export interface HostShells {
  /** One session's shells, or nothing where this host has no terminal store. */
  of(session: string): Shells | undefined;
  /** Forget a session's shells, and the calls they ran for. Its terminals are closed with the session. */
  forgetSession(uri: string): void;
  /**
   * A tool call action with its call's terminal kept on its content.
   *
   * A backend writes the content of its own calls, and the terminal of a call
   * this host gave a shell is not in what it writes: a content change of that
   * call is passed on with the terminal laid after the backend's content, and
   * its completion with the terminal and the command's exit in its result, as
   * the reference keeps the terminal on the call it completes
   * (copilotAgentSession.ts#L9417-L9422). The chat may be any of the session's,
   * a worker's included: the reference completes a subagent's call on the
   * subagent's chat (#L9482-L9494), and so the call carries its terminal
   * there. Every other action, and an action of a call no shell was given to,
   * is returned as it is.
   */
  withTerminal(chat: string, action: Bag): Bag;
  /**
   * A chat's turns with each call this host gave a shell showing its
   * terminal, so a client that subscribes late reads what the wire said: a
   * live chat's, whose state is its backend's, and a worker's, whose state is
   * folded from what its backend sent before the wire carried the terminal.
   * A copy where anything moved.
   */
  stampedTerminals(chat: string, turns: Bag[]): Bag[];
}

export function createShells(ctx: HostContext): HostShells {
  const { options, terminals, dispatch, log } = ctx;
  const sessions = new Map<string, Shells & { dispose(): void }>();
  /** Every call a shell was given, by its `keyOf`. */
  const calls = new Map<string, Called>();

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
     * Tie a call to the shell it was given, and show the shell on the call.
     *
     * The reference's `_trackToolCall` (copilotShellTools.ts#L258-L265), which
     * runs whether the shell is taken again or made (#L189, #L219), and its
     * session's answer to it (copilotAgentSession.ts#L2261-L2280): the call's
     * content gains the terminal, so a client draws the call as that terminal
     * while the command runs. Written the way this host writes a worker's link
     * on the call that spawned it (spawn.ts, `openSubagent`): with what the
     * call already holds, and only while its chat has a turn open. The chat is
     * the one the tool was bound to, which is a session's own chat, as the
     * reference writes it on its session's chat (copilotAgentSession.ts
     * #L2273-L2278): a subagent's
     * call is in a worker chat, so there the write names no call, and the call
     * shows its terminal once its completion carries it (`withTerminal`). A
     * terminal on pipes says `isPty: false`, as the reference's terminals that
     * are not pseudoterminals do (copilotAgentSession.ts#L11972-L11977), and a
     * pseudoterminal says nothing, as the reference's own do.
     */
    const associate = (claim: { chat: string; toolCallId?: string }, entry: Entry): void => {
      if (claim.toolCallId === undefined) {
        delete entry.call;
        return;
      }
      const key = keyOf(session, claim.toolCallId);
      const block: Bag = {
        type: 'terminal',
        resource: entry.shell.terminalUri,
        title: shellDisplayName(entry.shell.shellType),
        ...(entry.terminal.state().isPty === true ? {} : { isPty: false }),
      };
      calls.set(key, { session, block });
      entry.call = key;
      const turnId = ctx.links.turnOf(claim.chat);
      if (turnId === undefined) return;
      const content = showing(ctx.links.contentOf(claim.chat, claim.toolCallId) ?? [], block);
      dispatch(claim.chat, { type: 'chat/toolCallContentChanged', turnId, toolCallId: claim.toolCallId, content });
    };

    /**
     * An idle shell, or a new one claimed by the call that asked.
     *
     * The reference's `getOrCreateShell`. A shell taken again keeps the claim
     * it was opened with, as the reference's does, and is shown on the call
     * that took it, as a new one is.
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
        associate(claim, entry);
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
        spoke: false,
      };
      const terminal = ctx.heldShell(shells, {
        cwd: whereOf(session),
        claim: wanted,
        name: shellDisplayName(shellType),
        env: { ...PREVENT_SHELL_HISTORY_ENV, ...NON_INTERACTIVE_ENV },
        watch: (action) => { observe(kept, action); },
      });
      const shell: ManagedShell = { id, terminalUri: terminal.uri, shellType, executable };
      const entry: Entry = Object.assign(kept, { shell, terminal });
      entries.set(id, entry);
      busy.add(id);
      log(`made the ${shellType} shell ${id} for ${session} (${terminal.uri}, ${executable})`);
      associate(claim, entry);
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
     * Wait for a new shell to say something, for at most
     * `WAIT_FOR_PROMPT_TIMEOUT`.
     *
     * The reference's terminal manager hands a new terminal back once its
     * shell has said anything, and its command execution then asks whether the
     * terminal detects commands. A shell this host opens is handed back at
     * once, so its first command waits here instead. A shell on pipes says
     * nothing until it is given a command, and is not waited on.
     */
    const spoken = (entry: Entry): Promise<void> => new Promise((resolve) => {
      if (entry.spoke || entry.terminal.state().isPty !== true) {
        resolve();
        return;
      }
      const done = (): void => {
        clearTimeout(timer);
        stop();
        resolve();
      };
      const timer = setTimeout(done, WAIT_FOR_PROMPT_TIMEOUT);
      const stop = listen(entry, () => { if (entry.spoke) done(); });
    });

    /**
     * Run one command, and answer how it ended.
     *
     * The reference's two executions. Where the terminal detects commands, the
     * command ends at the shell's `D`, with the code the mark carries, and its
     * output is what the terminal said between its `terminal/commandExecuted`
     * and its `terminal/commandFinished`, which is the command's output as the
     * protocol defines it. Where it does not, the command is followed by a
     * line echoing a sentinel with its exit code, and the output between the
     * two is the result. What else ends the wait is the reference's in both:
     * the alternate screen, the shell exiting, a client narrowing the claim to
     * the session and chat alone, which moves the command to the background,
     * and the timeout.
     */
    const run = async (shell: ManagedShell, command: string, timeoutMs: number): Promise<ShellCommandResult> => {
      const entry = entryOf(shell);
      if (entry === undefined) throw new Error(`There is no shell ${shell.id}`);
      await spoken(entry);
      // Asked once, before the command is written, as the reference asks.
      const marked = entry.terminal.state().supportsCommandDetection === true;
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
        /** Where the command's output starts, once the shell has said it started. */
        let opened: number | undefined;
        stops.push(listen(entry, (action) => {
          switch (action.type) {
            case 'terminal/commandExecuted':
              if (marked) opened = started.received;
              return;
            case 'terminal/commandFinished': {
              // A command the shell finished without having started it here
              // is not this one.
              if (!marked || opened === undefined) return;
              const code = Number(action.exitCode);
              const output = prepareOutputForModel(between(shell, started, opened));
              finish({ status: 'completed', exitCode: Number.isFinite(code) ? code : 0, output });
              return;
            }
            case 'terminal/data': {
              if (sentinel === undefined) return;
              const parsed = parseSentinel(between(shell, started, 0), sentinel);
              if (parsed.found) finish({ status: 'completed', exitCode: parsed.exitCode, output: prepareOutputForModel(parsed.before) });
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
        // A shell that exited while it was waited on sends no exit again, and
        // answers as one that exits under its command.
        const gone = entry.terminal.exitCode();
        if (gone !== undefined) {
          log(`the shell ${shell.id} exited with ${String(gone)}`);
          finish({ status: 'shellExited', exitCode: gone, output: partial() });
        }
      });
      const line = `${prefixForHistorySuppression(shell.shellType)}${command}`;
      const paste = await pasted(entry, shouldUseBracketedPasteMode(command));
      entry.terminal.write(formatted(entry, line, true, paste));
      if (sentinel !== undefined) entry.terminal.write(formatted(entry, sentinelCommand(sentinel, shell.shellType), true, false));
      const answer = await result;
      exited(entry, answer);
      return answer;
    };

    /**
     * Set a completed command's exit on the terminal its call shows.
     *
     * The protocol's `ToolResultTerminalContent.result` (`@microsoft/agent-host-protocol`
     * 1.0.0, `dist/types/channels-chat/state.d.ts#L1541-L1544`): filled in on
     * the completed result when the command exits, and the command's exit
     * rather than the terminal's, so a command that completed sets it and one
     * that timed out, went on in the background or outlived its shell does
     * not. The code is the one the call's answer names, as the reference words
     * a completed command (copilotShellTools.ts#L333).
     */
    const exited = (entry: Entry, answer: ShellCommandResult): void => {
      if (answer.status !== 'completed' || entry.call === undefined) return;
      const called = calls.get(entry.call);
      if (called === undefined) return;
      called.block = { ...called.block, result: { exitCode: answer.exitCode ?? 0 } };
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

  /**
   * The terminal a call's content should show, when a shell was given to that
   * call: looked up under the session that holds the chat, a lead's or a
   * worker's, which is the session the call was made in.
   */
  const calledIn = (chat: string, toolCallId: unknown): Called | undefined => {
    if (typeof toolCallId !== 'string') return undefined;
    const session = ctx.sessionHolding(chat);
    return session === undefined ? undefined : calls.get(keyOf(session, toolCallId));
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
      for (const [key, called] of calls) if (called.session === uri) calls.delete(key);
    },
    withTerminal: (chat, action) => {
      if (action.type !== 'chat/toolCallContentChanged' && action.type !== 'chat/toolCallComplete') return action;
      const called = calledIn(chat, action.toolCallId);
      if (called === undefined) return action;
      if (action.type === 'chat/toolCallContentChanged') {
        const content = Array.isArray(action.content) ? action.content as Bag[] : [];
        const shown = showing(content, called.block);
        return shown === content ? action : { ...action, content: shown };
      }
      const result = action.result as Bag | undefined;
      if (typeof result !== 'object' || result === null) return action;
      const content = Array.isArray(result.content) ? result.content as Bag[] : [];
      const shown = showing(content, called.block);
      return shown === content ? action : { ...action, result: { ...result, content: shown } };
    },
    stampedTerminals: (chat, turns) => {
      if (calls.size === 0) return turns;
      return turns.map((turn) => {
        const parts = Array.isArray(turn.responseParts) ? turn.responseParts as Bag[] : undefined;
        if (parts === undefined) return turn;
        let touched = false;
        const next = parts.map((part) => {
          const call = part.toolCall as Bag | undefined;
          // The states whose content a call's terminal is written into: a
          // running call's own, and the result a completed call carries, or
          // one whose result waits to be confirmed.
          if (call === undefined || (call.status !== 'running' && call.status !== 'completed'
            && call.status !== 'pending-result-confirmation')) return part;
          const called = calledIn(chat, call.toolCallId);
          if (called === undefined) return part;
          const content = Array.isArray(call.content) ? call.content as Bag[] : [];
          const shown = showing(content, called.block);
          if (shown === content) return part;
          touched = true;
          return { ...part, toolCall: { ...call, content: shown } };
        });
        return touched ? { ...turn, responseParts: next } : turn;
      });
    },
  };
}
