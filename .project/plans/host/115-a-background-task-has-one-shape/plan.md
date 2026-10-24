---
title: A background task has one shape
domain: host
status: built
priority: medium
created: 2026-10-22
revalidated: 2026-10-23
requires:
  - plans/host/47-p2-a-chat-lists-its-background-work/plan.md
changes: []
creates: []
decisions: []
refs:
  - "[code://.project/plans/host/47-p2-a-chat-lists-its-background-work/plan.md](../../../../.project/plans/host/47-p2-a-chat-lists-its-background-work/plan.md) - the Claude backend builds and sends its own rows today; this plan moves that built feature onto the seam"
  - "[code://packages/sdk/src/types/agent.ts#L320-L334](../../../../packages/sdk/src/types/agent.ts#L320-L334) - `Start.terminals`, a host factory left out when the host has no terminal store"
  - "[code://packages/sdk/src/types/agent.ts#L502](../../../../packages/sdk/src/types/agent.ts#L502) - `planUpdate?`, a seam where a backend brings facts and the host builds the rest"
  - "[code://packages/sdk/src/host/spawn.ts#L1093-L1107](../../../../packages/sdk/src/host/spawn.ts#L1093-L1107) - where `subagent` and `planUpdate` are handed to a backend"
  - "[code://packages/sdk/src/host/spawn.ts#L188-L200](../../../../packages/sdk/src/host/spawn.ts#L188-L200) - `absorb`, which folds a worker chat's actions into the state a subscriber reads"
  - "[code://packages/sdk/src/host/snapshots.ts#L310-L335](../../../../packages/sdk/src/host/snapshots.ts#L310-L335) - the lead chat's snapshot, where the host lays its own fields over `chatState()`"
  - "[code://packages/sdk/src/types/terminals.ts#L71-L130](../../../../packages/sdk/src/types/terminals.ts#L71-L130) - `Terminal`, which the output terminal implements"
  - "[code://packages/sdk/src/host/terminals.ts#L125-L141](../../../../packages/sdk/src/host/terminals.ts#L125-L141) - `terminalInfo`, the root list, built from every terminal in the map"
  - "[code://packages/sdk/src/host/terminals.ts#L158-L229](../../../../packages/sdk/src/host/terminals.ts#L158-L229) - `heldTerminals`, the factory pattern: URI, session claim, registration, emit"
  - "[code://packages/sdk/src/host/lifecycle.ts#L261-L277](../../../../packages/sdk/src/host/lifecycle.ts#L261-L277) - a session's close closes every terminal its claim names"
  - "[code://packages/sdk/src/machines/terminals.ts#L291-L295](../../../../packages/sdk/src/machines/terminals.ts#L291-L295) - `KEEP`, the scrollback cap"
  - "[code://packages/sdk/src/host/vscodemethods.ts#L53-L75](../../../../packages/sdk/src/host/vscodemethods.ts#L53-L75) - `VscodeMethods` and `createVscodeMethods`"
  - "[code://packages/sdk/src/host/vscodemethods.ts#L372-L381](../../../../packages/sdk/src/host/vscodemethods.ts#L372-L381) - the sibling request and its `INVALID_PARAMS` refusal"
  - "[code://packages/sdk/src/host/gate.ts#L166](../../../../packages/sdk/src/host/gate.ts#L166) - `chat/turnCancelled` needs `chat:cancel`, the grant a stop takes"
  - "[code://packages/sdk/src/host/handshake.ts#L299-L327](../../../../packages/sdk/src/host/handshake.ts#L299-L327) - the `initialize` capability flags, left as they are"
  - "[code://packages/sdk/src/sessions/nested.ts#L655-L672](../../../../packages/sdk/src/sessions/nested.ts#L655-L672) - `served`, which passes an inner host's chat actions out unchanged"
  - "[code://packages/sdk/src/sessions/nested.ts#L690-L716](../../../../packages/sdk/src/sessions/nested.ts#L690-L716) - the nested proxy reduces and re-emits each inner chat action"
  - "[code://docs/sdk/AHP.md#L295-L296](../../../../docs/sdk/AHP.md#L295-L296) - the two background-work action rows"
  - "[code://packages/agent-claude/src/session/workers.ts#L380-L399](../../../../packages/agent-claude/src/session/workers.ts#L380-L399) - `shellWork`, a row `Bag` built in a backend"
  - "[code://packages/agent-claude/src/session/workers.ts#L451](../../../../packages/agent-claude/src/session/workers.ts#L451) - `reconcileWork`, which sends `chat/backgroundWork*` itself"
  - "[code://packages/agent-claude/src/session/workers.ts#L539](../../../../packages/agent-claude/src/session/workers.ts#L539) - `backgroundWork`, read by `running`"
  - "[code://packages/agent-claude/src/session/workers.ts#L640-L659](../../../../packages/agent-claude/src/session/workers.ts#L640-L659) - `stopWorker`, which calls `stopTask` by task id"
  - "[code://packages/agent-claude/src/session.ts#L159-L169](../../../../packages/agent-claude/src/session.ts#L159-L169) - `running`, which puts `backgroundWork` on the lead chat's state"
  - "[code://packages/agent-claude/src/session/query.ts#L697-L734](../../../../packages/agent-claude/src/session/query.ts#L697-L734) - `task_started` and `task_notification`"
  - "[code://packages/agent-claude/src/session/context.ts#L292](../../../../packages/agent-claude/src/session/context.ts#L292) - `handle`, the SDK's `Query`"
  - "[code://packages/agent-claude/test/agent-claude-background-work.test.ts](../../../../packages/agent-claude/test/agent-claude-background-work.test.ts) - host/47's nine cases"
  - "[code://packages/agent-acp/src/session/handlers.ts#L274-L321](../../../../packages/agent-acp/src/session/handlers.ts#L274-L321) - `openTerminal`: an ACP agent's `terminal/create` on a host terminal, held with `handle`, `limit` and `exited`"
  - "[code://packages/agent-acp/src/session/handlers.ts#L351-L362](../../../../packages/agent-acp/src/session/handlers.ts#L351-L362) - `killTerminal` and `releaseTerminal`"
  - "[code://packages/agent-acp/src/session/handlers.ts#L185-L197](../../../../packages/agent-acp/src/session/handlers.ts#L185-L197) - where each mapped action is sent"
  - "[code://packages/agent-acp/src/mapping.ts#L284-L325](../../../../packages/agent-acp/src/mapping.ts#L284-L325) - `closed` and `drawn`: a completed or failed call becomes `chat/toolCallComplete`"
  - "[code://packages/agent-acp/src/mapping.ts#L362-L373](../../../../packages/agent-acp/src/mapping.ts#L362-L373) - `contentBlocks`: a terminal entry is a block whose `resource` is the host terminal URI"
  - "[code://packages/agent-acp/src/types.ts#L353](../../../../packages/agent-acp/src/types.ts#L353) - `AcpCall`, with `displayName`, the call's title"
  - "[code://packages/agent-acp/src/session/context.ts#L162](../../../../packages/agent-acp/src/session/context.ts#L162) - `terminals`, the held terminals by URI"
  - "[code://packages/agent-pi/src/tools.ts#L26](../../../../packages/agent-pi/src/tools.ts#L26) - pi's tools; `bash` answers within its own call"
  - "[code://UPSTREAM.md](../../../../UPSTREAM.md) - Pass 7 \"Background shells\", both boxes, and the Pass 6 box for 57b4202903e"
  - "npm://@microsoft/agent-host-protocol@1.0.0 - `BackgroundShellWork` and `BackgroundSubagentWork` (`dist/types/channels-chat/state.d.ts:201-268`); `BackgroundWorkBase.id` is unique per chat and opaque; a shell is \"a shell command continuing outside its initiating tool call\"; hosts SHOULD set `terminal` whenever they can show the output"
  - "npm://@anthropic-ai/claude-agent-sdk@0.3.301 - `stopTask` (`sdk.d.ts:3266-3270`); `get_task_output` returns the last 8 KiB, `total_bytes` and `truncated` (`sdk.d.ts:4283-4310`); `getTaskOutput` is in `sdk.mjs` and not on `Query`"
  - "https://github.com/microsoft/vscode/blob/1.143.1/src/vs/platform/agentHost/common/agent.ts#L1748 - `IAgent.stopBackgroundWork?(chat, id): Promise<boolean>`, optional per provider"
  - "https://github.com/microsoft/vscode/blob/1.143.1/src/vs/platform/agentHost/common/meta/vscode/agentHostBackgroundWorkStopMeta.ts - `vscode.stopBackgroundWork: true`, `toStoppableBackgroundWorkMeta`, `canStopBackgroundWork`"
  - "https://github.com/microsoft/vscode/blob/1.143.1/src/vs/platform/agentHost/common/agentHostExtensionProtocol.ts#L69 - `vscode/stopBackgroundWork`, params `{ chat, id }` (`#L158-L161`), result `{ stopped }`"
  - "https://github.com/microsoft/vscode/blob/1.143.1/src/vs/platform/agentHost/node/protocolServerHandler.ts#L3116-L3140 - refuses an empty id or a chat that is not an AHP chat URI"
  - "https://github.com/microsoft/vscode/blob/1.143.1/src/vs/platform/agentHost/node/agentService.ts#L2063-L2071 - an unknown chat or a provider with no stop answers false"
  - "https://github.com/microsoft/vscode/blob/1.143.1/src/vs/platform/agentHost/node/agentHostTerminalManager.ts#L855-L945 - output-only terminals: no PTY, not on the root list, append, reset, replace, finalize"
  - "https://github.com/microsoft/vscode/blob/1.143.1/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/agentHostBackgroundShells.ts - the window offers output only with `terminal`, and Stop only with the flag"
  - "https://github.com/microsoft/vscode/blob/1.143.1/src/vs/platform/agentHost/node/copilot/copilotAgentSession.ts#L2774-L2835 - only shells are flagged; subagent rows carry no flag and no terminal"
  - "https://github.com/microsoft/vscode/blob/1.143.1/src/vs/platform/agentHost/node/claude/claudeTerminalOutput.ts - VS Code's Claude agent shows no output for a background Bash"
---

## Goal

Every background task has one shape in ahpd, whichever backend started it.
A backend reports a task to the host, and the host builds every protocol row from it.
A client sees a shell's output and can stop it, the same way for Claude, ACP and any later backend.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "backgroundWork" packages/*/src` - only agent-claude builds rows and sends the actions; the SDK passes them through.
- `rg -n "terminals.set|terminalInfo" packages/sdk/src/host` - every terminal in the map runs a process and is on the root list.
- `rg -n "chatReducer" packages/sdk/src` - `spawn.ts` folds worker chat actions; `nested.ts` folds an inner host's.
- `rg -n "getTaskOutput|stopTask" packages/agent-claude/src node_modules/@anthropic-ai/claude-agent-sdk` - `stopTask` is used; `getTaskOutput` is undeclared.
- `rg -n "terminalId|terminal/create|openTerminal" packages/agent-acp/src` - an ACP terminal is a host terminal, and a call's content names it by its URI.
- `rg -n -i "background|run_in_background|detach" packages/agent-pi/src` - nothing; pi runs `bash` in the foreground.
- `rg -n "stopBackgroundWork|vscode.stopBackgroundWork" packages docs` - nothing in ahpd.
- `git show 1.143.1:<path>` in the VS Code clone for each upstream file, because the clone's HEAD is not that tag.

### Runtime path

```
backend -> Start.backgroundTasks.set(chat, task) / remove(chat, id)
  -> host record per chat -> unchanged? nothing : chat/backgroundWorkSet (a worker chat through absorb)
  -> chat/backgroundWorkRemoved on remove; snapshot backgroundWork from the records
backend emits chat/backgroundWork* itself -> dropped, one log line
Start.outputTerminals.create({ title, chat }) -> ahp-terminal:/<uuid>, isPty false, off the root list
vscode/stopBackgroundWork { chat, id } -> gate chat:cancel -> task.stop() -> { stopped }

Claude: task_started / task_notification -> reconcileWork -> set | remove
  shell -> output terminal <- getTaskOutput(taskId) once a second; stop -> stopTask(taskId)
ACP: chat/toolCallComplete or turn end, terminal still running -> set; exit | release -> remove; stop -> handle.kill()
nested: inner chat/backgroundWork* -> outer set | remove, stop forwards the request
```

### Gaps

- `Not found: a background task type in packages/sdk/src/types`.
- `Not found: an output-only terminal - searched createOutputTerminal, isPty, terminals.set in packages/sdk/src`.
- The host serves no `vscode/stopBackgroundWork`.
- The row shape lives in the Claude backend, and no row names a terminal or can stop.
- `Not found: getTaskOutput in sdk.d.ts` - the call needs a local type, and the task notification carries no exit code.
- An ACP terminal that runs on after its call is listed only on the root terminal list.
- The held ACP terminal keeps no open time and no command line.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A background task has one representation, whichever backend it comes from | Softov, 2026-10-22: "A background task should have a common representation regardless of whether it originates from Claude, Pi, ACP, or an ahpd-managed shell." | all |
| One plan and one build for the sdk, Claude and ACP work | Softov, 2026-10-22: "Merge 115, audit the rest" | - |
| The record is `BackgroundTask { id, kind: 'shell' \| 'subagent', label, startedAt, command?, chat?, terminal?, stop? }` | Softov, 2026-10-22, through the coordinator, for the fields; AHP 1.0.0 `BackgroundSubagentWork.chat` is required, so a subagent task carries `chat` | 01 |
| The seam is `Start.backgroundTasks: BackgroundTasks { set(chat, task), remove(chat, id) }`, named after the two protocol actions | Softov, 2026-10-22, through the coordinator; AHP `chat/backgroundWorkSet` and `chat/backgroundWorkRemoved` | 01 |
| A row's `id` is the record's `id`, and the backend keeps it unique in its chat | AHP 1.0.0 `BackgroundWorkBase.id`: unique per chat, opaque to clients | 01 |
| `stop` is `() => Promise<boolean>`: true when it stopped live work | VS Code `stopBackgroundWork?(chat, id): Promise<boolean>` | 01, 03 |
| The host builds every row; a row has `_meta['vscode.stopBackgroundWork']: true` exactly when its task has a `stop` | Softov, 2026-10-22, through the coordinator; VS Code `toStoppableBackgroundWorkMeta` | 01 |
| A `set` that changes nothing in the row sends nothing | [`code://docs/sdk/AHP.md#L295`](../../../../docs/sdk/AHP.md#L295): one task is said once, and again only when it changes | 01 |
| A row on a worker chat goes through `absorb`, so the worker's state holds it | [`code://packages/sdk/src/host/spawn.ts#L188-L200`](../../../../packages/sdk/src/host/spawn.ts#L188-L200) | 01 |
| The lead chat's snapshot gets `backgroundWork` from the records, absent when there are none | [`code://packages/sdk/src/host/snapshots.ts#L310-L335`](../../../../packages/sdk/src/host/snapshots.ts#L310-L335); host/47: absent rather than empty | 01 |
| A session's close drops its records and sends nothing | host/47: `close()` emits nothing | 01 |
| The host refuses a `chat/backgroundWork*` action that a backend emits: it drops the action and logs one line; every backend in this repo moves to the seam in this plan | Softov, 2026-10-22: "plugin that send direct is refused" | 01, 05 |
| The host offers `Start.outputTerminals`, with VS Code's verbs: `create`, then `append`, `reset`, `replace`, `finalize(exitCode?)` and `dispose` | VS Code `agentHostTerminalManager.ts#L855-L945`; the factory pattern of [`code://packages/sdk/src/host/terminals.ts#L158-L229`](../../../../packages/sdk/src/host/terminals.ts#L158-L229) | 02 |
| An output terminal says `isPty: false`, ignores input and resize, and is not on the root terminal list | VS Code: "The channel is not announced on the root terminal list"; AHP: `isPty` says plain text | 02 |
| An output terminal is `ahp-terminal:/<uuid>` in the host's map with the session claim, and the session's close removes it | [`code://packages/sdk/src/host/lifecycle.ts#L261-L277`](../../../../packages/sdk/src/host/lifecycle.ts#L261-L277); VS Code 8cfec5873bc keeps it until the chat closes | 02 |
| `Start.outputTerminals` is offered whether or not the host holds a terminal store | (defaulted: an output terminal runs no process and needs no store) | 02 |
| An output terminal keeps at most `KEEP` characters of scrollback | (defaulted: [`code://packages/sdk/src/machines/terminals.ts#L291-L295`](../../../../packages/sdk/src/machines/terminals.ts#L291-L295), the cap a process terminal has) | 02 |
| `vscode/stopBackgroundWork` takes `{ chat, id }` and answers `{ stopped }`; an empty id, or a chat that is not `ahp-chat:`, is `INVALID_PARAMS` | VS Code `agentHostExtensionProtocol.ts#L158-L161`, `protocolServerHandler.ts#L3116-L3140` | 03 |
| An unknown chat, an unknown id and a task with no `stop` answer `{ stopped: false }` | VS Code `agentService.ts#L2063-L2071` | 03 |
| The request needs `chat:cancel` | [`code://packages/sdk/src/host/gate.ts#L166`](../../../../packages/sdk/src/host/gate.ts#L166), the sibling stop | 03 |
| `initialize` advertises nothing new | VS Code: the row's flag is the advertisement | 03 |
| A nested host reports its inner host's tasks through the seam, with no terminal, and a stop that forwards the request | Softov, 2026-10-22: "Through the seam" | 04 |
| `reconcileWork` calls `set` and `remove`, and `running` goes; `told` stays only to know what to remove | Softov, 2026-10-22, through the coordinator | 05 |
| The Claude ids stay `shell:<task id>` and `subagent:<task id>` | [`code://packages/agent-claude/src/session/workers.ts#L380-L399`](../../../../packages/agent-claude/src/session/workers.ts#L380-L399) | 05 |
| A Claude shell's stop is `stopTask(taskId)`, and answers true when the task was live and `stopTask` resolved | Softov, 2026-10-22: ahpd answers `vscode/stopBackgroundWork`; SDK `stopTask` | 05 |
| A Claude subagent task has no stop | VS Code `copilotAgentSession.ts#L2774-L2835` flags only shells | 05 |
| Claude reads a shell's output by polling `getTaskOutput(taskId)`, with a local type and a test that fails if the SDK drops it | Softov, 2026-10-22 | 06 |
| Claude reads once a second while the task is live, whether or not anyone watches, plus one read after it ends | Softov, 2026-10-22 | 06 |
| Append the growth that `total_bytes` shows; when more was written between two reads than the tail holds, replace the content with the tail | Softov, 2026-10-22 | 06 |
| A Claude shell's terminal is created at the task's first listing, titled with the label | (defaulted: the row carries `terminal` from its first set) | 06 |
| A Claude shell's terminal is finalized with no exit code, and stays until the session closes | SDK: the notification has no exit code; VS Code 8cfec5873bc keeps the terminal until the chat closes | 06 |
| An ACP terminal becomes a shell row once the call that started it has ended and the process still runs | Softov, 2026-10-22: "Once its call ends" | 07 |
| A call ends with its `chat/toolCallComplete`, or when the turn ends with the call still open | (defaulted: the protocol's reducer ends an open call when its turn ends) | 07 |
| An ACP row's `id` and `terminal` are the host terminal's URI | AHP: unique per chat, and a host SHOULD set `terminal` whenever it can show the output | 07 |
| An ACP row's `label` is the call's title, and its `command` is the request's command and args joined with spaces | Softov, 2026-10-22: "Call title + command" | 07 |
| A terminal that no call's content names and that still runs at turn end becomes a row then, with the command line as its `label` | Softov, 2026-10-22: "Row at turn end" | 07 |
| An ACP row's `startedAt` is when `openTerminal` ran | AHP: `startedAt` is when the work started | 07 |
| An ACP stop is `handle.kill()`, and answers true when the process was still running | Softov, 2026-10-22, through the coordinator: "its stop kills the process" | 07 |
| An ACP row is removed when the process exits or the agent releases the terminal | AHP: a row lists running work | 07 |
| Pi has no background tasks: its `bash` answers within its call, so pi reports nothing | [`code://packages/agent-pi/src/tools.ts#L26`](../../../../packages/agent-pi/src/tools.ts#L26) and the search above | - |
| A host shell tool that any backend can start is out of scope; it gets its own plan, from Softov's spec | Softov, 2026-10-22, through the coordinator | - |

## Proposed architecture

- **Data flow** - a backend calls `set` and `remove`. The host keeps `chat -> id -> record`, builds the row and emits only a change.
- **Event flow** - only the host emits `chat/backgroundWorkSet` and `chat/backgroundWorkRemoved`, by its own `dispatch` for a lead chat, and `absorb` plus `dispatch` for a worker chat. An output terminal emits `terminal/*` on its own channel.
- **State flow** - the host keeps the records and lays `backgroundWork` on a chat's snapshot. A backend keeps only what it needs to know a task ended.
- **Layer responsibilities** - sdk: the record, the seam, rows, output terminals, the request and inner tasks.
  agent-claude `session/workers.ts` and `session/taskoutput.ts` (new): Claude tasks and output.
  agent-acp `session/handlers.ts`: a terminal that outlives its call.
- **Source-of-truth files** - `packages/sdk/src/types/background.ts` (new), `packages/sdk/src/host/background.ts` (new).

## Tasks

| Task | Package | Status | Depends on |
| --- | --- | --- | --- |
| [01 - A backend reports a task and the host draws it](task-01-a-backend-reports-a-task-the-host-draws.md) | sdk | done | - |
| [02 - A backend feeds an output terminal](task-02-a-backend-feeds-an-output-terminal.md) | sdk | done | - |
| [03 - The host answers vscode/stopBackgroundWork](task-03-the-host-answers-stop-background-work.md) | sdk | done | 01 |
| [04 - A nested host reports its inner tasks](task-04-a-nested-host-reports-its-inner-tasks.md) | sdk | done | 01, 03 |
| [05 - Claude reports tasks through the seam](task-05-claude-reports-tasks-through-the-seam.md) | agent-claude | done | 01, 03 |
| [06 - A Claude shell shows its output](task-06-a-claude-shell-shows-its-output.md) | agent-claude | done | 02, 05 |
| [07 - A running terminal is listed when its call ends](task-07-a-running-terminal-is-listed-at-call-end.md) | agent-acp | done | 01, 03 |

## Risks and tradeoffs

- Moving the Claude rows to the host changes a built feature - task 05 keeps host/47's nine cases and adds the seam's cases.
- A plugin from outside this repo that still emits the actions loses its rows until it moves to the seam.
- A worker chat row that skips `absorb` vanishes from a late snapshot - task 01 tests a late subscriber on a worker chat.
- An output terminal is in `terminals` but off the root list - `terminalInfo` skips it, and a test checks the list.
- A `stop` that never resolves holds the request - the request has the host's usual request timeout.
- `getTaskOutput` is undeclared, so an SDK update can drop it - task 06's test fails then.
- A poll each second per Claude shell costs a control request - the poll stops when the task ends.
- An ACP agent that kills its own terminal removes the row through the exit, and a session's close drops the rows with no remove sent.

## Resume state

- **Done so far:** drafted 2026-10-22; merged the same day from three child plans into one. Task 01 is built: the seam, the host's records and rows, the snapshot, and the drop of a backend-emitted action, with its seven cases. Task 02 is built: an output terminal with no process behind it, off the root list, with its four cases. It is fed by `append`, `reset` and `replace`, and ended by `finalize`. Task 03 is built: `vscode/stopBackgroundWork` behind `chat:cancel`, one `false` for every task the host cannot stop, with its seven cases. The record's `stop` is now the plan's function, where task 01 had typed it `boolean`. Task 04 is built: a nested host reports its inner rows through the seam, on the outer chat, with no terminal. Its stop asks the host inside. It has three cases. Task 05 is built: Claude's shell and subagent tasks are reported through the seam. A shell carries a stop that calls `stopTask`, and the backend emits no `chat/backgroundWork*` action. host/47's nine cases and the two stop cases pass. Task 06 is built: each Claude shell has an output terminal, polled once a second and once more when the task ends. The growth comes from `total_bytes`. It has seven poll cases and the SDK guard. Task 07 is built: an ACP terminal that still runs when its call ends is listed as a shell row. Its label is the call's title, and its id and terminal are the host terminal's URI. One no call named is listed at turn end with its command line. The row goes on the process's exit or the agent's release, and its stop kills the process. It has five cases.
- **Next action:** none. The plan is built.
- **Open questions:** none.
- **Watch out for:** a row must carry `terminal` on its first set, or the second set looks like a change.
  An ACP machine terminal runs the descriptor's argv, and `command` is what the agent asked.
  An ACP terminal a call names but never completes is listed at turn end with its command line. The mapping keeps no content for an open call.
  An output terminal keeps `KEEP` characters. A `replace` of more than that shows a live client only the tail that is also kept for a late one.
  `conformance.test.ts` is green: both backends now report through the seam.

## Final verification checklist

- [ ] A fake backend's `set` and `remove` reach a live client and a late snapshot, on a lead chat and a worker chat.
- [ ] A task with `stop` carries the flag, and `vscode/stopBackgroundWork` calls it.
- [ ] An output terminal is readable by subscription and absent from the root list.
- [ ] No backend source sends `chat/backgroundWorkSet` or `chat/backgroundWorkRemoved`.
- [ ] host/47's nine cases pass.
- [ ] A Claude shell and an ACP shell each show their output and stop from VS Code.
- [ ] An ACP terminal that exits inside its call is never listed.
- [ ] Both Pass 7 "Background shells" boxes and the Pass 6 box for 57b4202903e are ticked in `UPSTREAM.md`.
- [ ] `pnpm exec tsc --noEmit`, `pnpm boundary`, `pnpm test` pass.
- [ ] `plans/index.md` updated.
