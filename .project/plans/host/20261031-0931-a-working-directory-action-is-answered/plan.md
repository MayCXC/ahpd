---
title: A working directory action is answered as the protocol says
domain: host
status: built
priority: medium
created: 2026-10-31
revalidated: 2026-10-31
refs:
  - git://27bfa9b4 - the commit of ahpd this plan was checked at
  - "[code://packages/sdk/src/host/chatactions.ts#L583-L662](../../../../packages/sdk/src/host/chatactions.ts#L583-L662) - the session's three working directory actions"
  - "[code://packages/sdk/src/host/chatactions.ts#L1040-L1080](../../../../packages/sdk/src/host/chatactions.ts#L1040-L1080) - the chat's two"
  - "[code://packages/sdk/src/host/lifecycle.ts#L893-L903](../../../../packages/sdk/src/host/lifecycle.ts#L893-L903) - a restart that moves the first folder says it with `directory` alone"
  - "[code://packages/sdk/src/host.ts#L986-L1012](../../../../packages/sdk/src/host.ts#L986-L1012) - `echoTo`, an action that changes nothing answered to its sender alone"
  - "[code://docs/sdk/AHP.md#L727-L755](../../../../docs/sdk/AHP.md#L727-L755) - \"An action that changes nothing is not a change\""
  - "https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/types/channels-session/actions.ts - `session/workingDirectorySet`, `Removed` and `Replaced`: membership, idempotent removal, and a compare-and-swap of `directory` for `replacement`"
  - "https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/types/channels-chat/actions.ts - `chat/workingDirectorySet` and `Removed`, a no-op when the folder is held or absent"
  - "https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/docs/guide/reconciliation.md#L23-L30 - a client holds its action until an envelope with its own origin, or a rejection, answers it"
---

## Goal

Each working directory action does what the protocol's reducer does with it, and every one is answered.
A replacement puts the folder `replacement` names where the entry `directory` names was, and a move of the first folder is said the same way.
An action that changes nothing is answered to its sender alone, and one that names no folder is refused.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "workingDirectoryReplaced" packages/sdk/src` - the host reads `directory` as the new first folder, and says a move with `directory` alone.
- `rg "replacement" packages/sdk/src/host` - nothing in the host reads or writes `replacement`.
- `rg "workingDirectory" packages/sdk/test` - the move cases read the announcement's `directory` as the folder moved to.

### Gaps

- A set of a folder the session holds, a removal of one it does not, and a replacement of one it does not are dropped in silence; so is the chat's set of a folder it holds and removal of one it does not.
- A replacement as the protocol spells it, `{ directory: <held>, replacement: <new> }`, is read as a move to `directory`: of the first folder, nothing happens; of another, the session moves its first folder there.
- A move made by `set_workspace` is said as `{ directory: <new> }`, which every client's reducer takes as a replacement of a folder it does not hold, and so ignores.
- An action naming no folder is dropped, or refused with a sentence about an empty path.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A set appends a folder the set lacks; a removal takes out one it holds; a replacement swaps `directory` for `replacement`, a replacement held later moving into the entry's place and one held earlier keeping its place with the entry gone | [channels-session/actions.ts](https://github.com/microsoft/agent-host-protocol/blob/v1.0.0/types/channels-session/actions.ts) | 01 |
| An action that changes nothing is answered with `echoTo` | [code://docs/sdk/AHP.md#L727-L755](../../../../docs/sdk/AHP.md#L727-L755) | 01 |
| A removal of the first folder is refused | the protocol's MUST, kept | 01 |
| A new first folder is a move, made by the restart a move makes, which says it from the folder clients hold to the folder it went to, before the client's own action answers it | `moveSession`, [code://packages/sdk/src/host/lifecycle.ts#L893-L903](../../../../packages/sdk/src/host/lifecycle.ts#L893-L903) | 01 |
| The folder clients hold first is the one the session's backend reports, which a session with no folder of its own still has | `Session.workingDirectories` | 01 |
| An action that names no folder is refused | (defaulted: a missing required field is malformed) | 01 |

## Proposed architecture

- **Data flow** - the session's folders as one list, the first folder and the rest, put through the action as the reducer would; the restart is handed the rest, and the first when it moved.
- **Event flow** - unchanged is `echoTo`; changed is the restart, then the client's action as its echo; a moved first folder is said by the restart as `{ directory, replacement }`.
- **Layer responsibilities** - chatactions: the five actions; lifecycle: the restart's announcement of a move.
- **Source-of-truth files** - [`code://packages/sdk/src/host/chatactions.ts`](../../../../packages/sdk/src/host/chatactions.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A working directory action is answered as the protocol says](task-01-a-working-directory-action-is-answered.md) | done | - |

## Risks and tradeoffs

- A replacement of the first folder is said twice to every client: the move as this host made it, then the client's action, which by then replaces a folder nobody holds and changes nothing.
  The order is what keeps a session isolated in a worktree right, since the move it says is to the worktree and the client's action named the folder.

## Resume state

- **Done so far:** planned and built 2026-10-31. See [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a chat's own folders are left as they are when its session's set narrows (the audit's A-D7, which a decided row of host/47-p1 sets).

## Final verification checklist

- [x] Each new case fails on `27bfa9b4` for the reason it names, and passes after the change.
- [x] The touched suites pass.
- [x] `pnpm run typecheck` and `pnpm run boundary` report no errors.
