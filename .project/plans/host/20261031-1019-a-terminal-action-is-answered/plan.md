---
title: A terminal action is answered
domain: host
status: planned
priority: medium
created: 2026-10-31
revalidated: 2026-10-31
refs:
  - git://27bfa9b4 - the commit of ahpd this plan was checked at
  - "[code://packages/sdk/src/host/actions.ts#L754-L790](../../../../packages/sdk/src/host/actions.ts#L754-L790) - a client's terminal actions, input written and answered with nothing, a malformed claim dropped"
  - "[code://packages/sdk/src/machines/terminals.ts#L669-L750](../../../../packages/sdk/src/machines/terminals.ts#L669-L750) - a shell's `write`, ignored once it has exited, and its `setTitle`, silent for the title it has"
  - "[code://packages/sdk/src/host/terminals.ts#L293-L358](../../../../packages/sdk/src/host/terminals.ts#L293-L358) - an output terminal, whose `write` and `resize` do nothing and whose size is fixed at 80 by 24"
  - "[code://packages/sdk/src/types/terminals.ts#L72-L131](../../../../packages/sdk/src/types/terminals.ts#L72-L131) - `Terminal`"
  - "[code://packages/sdk/src/host.ts#L986-L1012](../../../../packages/sdk/src/host.ts#L986-L1012) - `echoTo`, an action that changes nothing answered to its sender alone"
  - "https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/guide/reconciliation.md#L23-L30 - a client holds its action until an envelope with its own origin, or a rejection, answers it"
  - "https://github.com/microsoft/vscode/blob/97d01924531421f671b69342f629ba0f9f0f1e2e/src/vs/platform/agentHost/node/agentHostTerminalManager.ts - the reference host: every client terminal action goes out through its state manager, its own action said back, before the terminal acts on it"
  - "https://github.com/microsoft/vscode/blob/97d01924531421f671b69342f629ba0f9f0f1e2e/src/vs/platform/agentHost/common/state/protocol/channels-terminal/reducer.ts - `terminal/input` is side-effect only: the reducer changes nothing on it"
---

## Goal

Every terminal action a client sends is answered, its echo or its refusal.
Input that reaches a process is answered to the client that sent it alone, since it changes no state; input with no process to reach is refused.
A title set to the one the terminal has is answered to its sender alone, a claim that names nobody is refused, and a command's output terminal keeps the size a client gives it.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "terminal/" packages/sdk/src/host/actions.ts` - the five client terminal actions are handled in one switch.
- `rg "setClaim" packages/*/src` - two implementations of `Terminal`: a shell and an output terminal.
- `rg "terminal/input" packages/sdk/test` - the conformance case waits for the marker in any action, which the input's own answer carries.

### Gaps

- Input is written and never answered, so the client that typed it holds it as pending.
- Input to a shell that has exited, or to an output terminal, is dropped in silence.
- A title set to the one a terminal has is dropped in silence.
- A claim that names nobody is dropped in silence.
- An output terminal takes no size: a resize is dropped, and the state reports 80 by 24 whatever a client asked for.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Input changes no state, so it is answered with `echoTo`, to its sender alone | the protocol's reducer; [code://packages/sdk/src/host.ts#L986-L1012](../../../../packages/sdk/src/host.ts#L986-L1012) | 01 |
| The reason input went unanswered, a keystroke printed twice, holds for a broadcast and for a client that prints input: the sender alone hears it, and its reducer prints nothing | the comment at [code://packages/sdk/src/host/actions.ts#L757-L764](../../../../packages/sdk/src/host/actions.ts#L757-L764) | 01 |
| `Terminal.write` says whether the input reached a process, with the sentence that says why when it did not, as `Session.setConfig` answers `true` or a sentence | `Session.setConfig` | 01 |
| `Terminal.setTitle` says whether the title moved | the flags' `sessionFlag` and `chatFlag` | 01 |
| A malformed claim is refused, and the terminal's own claim stays | the comment on `terminal/claimed`, whose reason (never set `{}`) is kept | 01 |
| An output terminal keeps the size a client gives it, says it, and reports it | the reducer sets the size; the shell keeps one without a pseudoterminal for the same reason | 01 |

## Proposed architecture

- **Event flow** - input: written, then `echoTo`, or refused with the terminal's sentence; title: `echoTo` when it did not move; claim: refused when it names nobody; output resize: kept and said.
- **Layer responsibilities** - `Terminal`: `write` and `setTitle` answer; the shell and the output terminal implement them; actions: answers the client.
- **Source-of-truth files** - [`code://packages/sdk/src/host/actions.ts`](../../../../packages/sdk/src/host/actions.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A terminal action is answered](task-01-a-terminal-action-is-answered.md) | todo | - |

## Risks and tradeoffs

- Every keystroke is answered: one envelope back to the client that typed it, at the `serverSeq` the host is already at, which the reference host also sends, there to every subscriber.

## Resume state

- **Done so far:** planned 2026-10-31.
- **Next action:** [task-01-a-terminal-action-is-answered.md](task-01-a-terminal-action-is-answered.md).
- **Open questions:** none.
- **Watch out for:** claims are never refused when a client claims a terminal another holds (the audit's C7, a SHOULD).

## Final verification checklist

- [ ] Each new case fails on `27bfa9b4` for the reason it names, and passes after the change.
- [ ] The touched suites pass.
- [ ] `pnpm run typecheck` and `pnpm run boundary` report no errors.
