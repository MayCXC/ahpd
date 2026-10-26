/**
 * The shells an agent runs commands in, one set per session.
 *
 * The reference host's agent terminal tool, as this host holds it: VS Code's
 * `ShellManager` and its shared command execution
 * (https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/copilot/copilotShellTools.ts,
 * https://github.com/microsoft/vscode/blob/122ec4fe4431e8435c42e9b609e3a43a60877383/src/vs/platform/agentHost/node/shared/shellCommandExecution.ts),
 * on this host's terminal store. Each shell is a terminal on the root list,
 * so the person in the session sees what the agent runs and can type into it
 * or stop it.
 */

/** The kind of shell a command runs in, which decides the sentinel's syntax. */
export type ShellType = 'bash' | 'powershell';

/** One persistent shell, backed by a terminal this host lists. */
export interface ManagedShell {
  /** The shell's own id, which the tools name it by. */
  readonly id: string;
  /** The terminal channel it runs in. */
  readonly terminalUri: string;
  readonly shellType: ShellType;
  /** The shell program, as the terminal store resolves it. */
  readonly executable: string;
}

/**
 * How one command ended.
 *
 * `completed` carries the command's exit code; `timeout` is a command still
 * running when the wait ended, with the output so far; `background` is a
 * client that narrowed the terminal's claim, so the command goes on without
 * the call; `altBuffer` is a command that switched to the alternate screen,
 * which is an interactive program; `shellExited` is the shell itself gone.
 */
export type ShellCommandStatus = 'completed' | 'timeout' | 'background' | 'altBuffer' | 'shellExited';

/** One command's result, before a tool words it for the model. */
export interface ShellCommandResult {
  readonly status: ShellCommandStatus;
  /** The exit code, for `completed` and `shellExited`. */
  readonly exitCode?: number;
  /** The output, cleaned for a model, and empty for `background` and `altBuffer`. */
  readonly output: string;
}

/** A shell held for one command, given back by `release`. */
export interface HeldShell {
  readonly shell: ManagedShell;
  /** Give the shell back, so the next command may use it. */
  release(): void;
}

/**
 * One session's shells.
 *
 * A shell is held by one command at a time: two commands written to one
 * shell would interleave their input and their output. A command that is
 * still running when its call ends keeps its shell until the command does.
 */
export interface Shells {
  /** The shell program every shell of this session runs. */
  executable(): string;
  /** The kind of that program. */
  shellType(): ShellType;
  /**
   * An idle shell of this session, or a new one.
   *
   * A new one is claimed by the chat, the turn and the tool call that asked
   * for it, which is how a client draws it under that call.
   */
  acquire(claim: { chat: string; turnId?: string; toolCallId?: string }): HeldShell;
  /** Run one command in a held shell, and answer how it ended. */
  run(shell: ManagedShell, command: string, timeoutMs: number): Promise<ShellCommandResult>;
  /** Keep a shell held until the command running in it finishes, or the shell exits. */
  hold(shell: ManagedShell): void;
  /** One shell by its id. */
  get(id: string): ManagedShell | undefined;
  /** Every shell this session still has, oldest first. */
  list(): ManagedShell[];
  /** What a shell's terminal has written, as text. */
  content(shell: ManagedShell): string;
  /** Running, or exited and with what. */
  lifecycle(shell: ManagedShell): { status: 'running' } | { status: 'exited'; exitCode?: number };
  /** Write text to a shell's input, as typed, without running it. */
  send(shell: ManagedShell, text: string): void;
  /** End one shell and take its terminal off the list. Answers whether there was one. */
  shutdown(id: string): boolean;
}
