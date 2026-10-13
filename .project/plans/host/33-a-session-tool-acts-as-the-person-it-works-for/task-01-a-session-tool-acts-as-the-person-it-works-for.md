---
title: A session tool acts as the person it works for
status: implemented
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/types/host.ts#L701-L805](../../../../packages/sdk/src/types/host.ts#L701-L805) - `ToolCall`, what a tool sees: it carries no person"
  - "[code://packages/sdk/src/host/tooling.ts#L1048-L1217](../../../../packages/sdk/src/host/tooling.ts#L1048-L1217) - `toolContext`, the one place a `ToolCall` is made, and `send`, `create`, `createChat`, `remove`"
  - "[code://packages/sdk/src/host/tooling.ts#L1337](../../../../packages/sdk/src/host/tooling.ts#L1337) - the one caller, in `offeredTools`"
  - "[code://packages/sdk/src/host/owners.ts#L97-L116](../../../../packages/sdk/src/host/owners.ts#L97-L116) - `senders` and `sentBy`, the person and the window of each turn, by turn id"
  - "[code://packages/sdk/src/host/lifecycle.ts#L959-L1012](../../../../packages/sdk/src/host/lifecycle.ts#L959-L1012) - `beginOrRun`, where a turn's sender is recorded"
  - "[code://packages/sdk/src/host/spawn.ts#L672-L680](../../../../packages/sdk/src/host/spawn.ts#L672-L680) - the sender moved from a queued message to the turn it became"
  - "[code://packages/sdk/src/host/automations.ts#L619-L628](../../../../packages/sdk/src/host/automations.ts#L619-L628) - an automation turn records its creator in `senders`"
  - "[code://packages/sdk/src/host/wakes.ts#L79-L100](../../../../packages/sdk/src/host/wakes.ts#L79-L100) - a wake begins its turn with no sender"
  - "[code://packages/sdk/src/types/sessions.ts#L104-L109](../../../../packages/sdk/src/types/sessions.ts#L104-L109) - the stored wake, which keeps no person"
  - "[code://packages/sdk/src/host/lifecycle.ts#L441-L452](../../../../packages/sdk/src/host/lifecycle.ts#L441-L452) - `mayDispose`, which `remove` asks as the calling session's owner"
  - "[code://packages/sdk/src/types/users.ts#L53](../../../../packages/sdk/src/types/users.ts#L53) - `Principal.can(grant)`"
  - "[code://packages/sdk/src/host/gate.ts#L412](../../../../packages/sdk/src/host/gate.ts#L412) - `refusalReason`, the words a missing grant is refused with"
  - "[code://packages/sdk/src/tools/session.ts#L346-L660](../../../../packages/sdk/src/tools/session.ts#L346-L660) - the nine session tools"
---

## Objective

Under a users directory, each session tool asks the grants of its turn's person before it acts.
`list_sessions` lists only the sessions that person may read.
A turn that a session tool or a wake starts carries the person of the turn that started it.
A turn with no person gets no session tool that writes.

## Files

- `UPDATE: packages/sdk/src/types/host.ts:701-805` - `ToolCall` gains `may(grant)`, which answers whether the turn's person holds the grant here.
- `UPDATE: packages/sdk/src/host/tooling.ts:1048-1217` - `toolContext` builds `may` from the turn's sender, filters `sessions()`, and records the sender on the turns `send`, `create` and `createChat` begin.
- `UPDATE: packages/sdk/src/tools/session.ts:346-660` - each session tool asks `may` before it acts and refuses with the host's words.
- `UPDATE: packages/sdk/src/types/sessions.ts:104-109` - the stored wake keeps the `Owner` of the turn that set it.
- `UPDATE: packages/sdk/src/host/wakes.ts:79-100` - a wake begins its turn with the stored owner as its sender.
- `UPDATE: packages/sdk/src/sessions.ts:247-264` - `wakeOf` and `chatsOf` keep the wake's `sender` through a reload.
- `UPDATE: packages/sdk/test/sessiontools.test.ts` - the grant cases below.
- `UPDATE: packages/sdk/test/session-delete-owner.test.ts` - its delete cases run inside a turn now, because a call with no turn is nobody's.
- `UPDATE: docs/TOOLS.md` - what each session tool needs under a users directory.

## Steps

1. Read the plan's *Decisions locked in* rows for task 01.
2. Add `may(grant: Grant): boolean` and `refusal(grant: Grant): string` to `ToolCall`; `may` is always true with no users directory.
3. In `toolContext`, find the turn's person with `senderOf(activeTurnOf(chatUri))` and its principal with `principalFor`.
4. Answer true from `may` when `options.users` has no value, and for root, as `admit` in `admission.ts` does.
5. For a turn with no person under a users directory, answer true for `session:read` and false for `session:write`.
6. Otherwise answer `principal.can(grant)` from `may`.
7. Filter `sessions()` so it returns only the rows the person may `session:read`.
8. Require `session:read` in `get_current_session` and `get_session_context`.
9. Require `session:write` in `set_workspace`, `create_session`, `create_chat`, `rename_chat`, `send_message` and `delete_session`.
10. Leave `list_sessions` without a check, because `sessions()` is already filtered.
11. Refuse with `refusal(grant)`: `refusalReason` with the person's id, or `this turn may not <grant> here` with no person.
12. In `send`, `create` and `createChat`, record the calling turn's `Owner` in `senders` under the new turn id.
13. Record the calling turn's connection in `sentBy` too, when `sentBy` holds one for it.
14. For a message that `send` queues, record the owner under the queued id. The move in `spawn.ts` carries it to the turn.
15. Add `sender?: Owner` to the stored wake, and set it from the calling turn's owner in `scheduleWake`.
16. In `wakes.ts`, record the stored owner in `senders` for the turn the wake begins.
17. Make `remove` ask `mayDispose` as the turn's person, not as the calling session's owner.
18. Leave `schedule_wakeup` without a check, because it acts only on the calling chat.
19. Write each tool's grant in `docs/TOOLS.md`, one line per tool.

## Validation

- `sessiontools.test.ts`: under a users directory, a guest's turn lists only sessions it may read. The host refuses its `create_session` with `may not session:write here`.
- `sessiontools.test.ts`: a member's turn creates a session, and the child's turn carries the member's grants.
- `sessiontools.test.ts`: a turn with no person reads, and the host refuses it every writing tool.
- `sessiontools.test.ts`: a member's wake begins a turn that carries the member, also after a reload of the store.
- `sessiontools.test.ts`: with no users directory, every tool acts as it does today.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume

Done 2026-10-13. Every step in order; nothing skipped.

File by file:

- `packages/sdk/src/types/host.ts` - `ToolCall` gains `may(grant): boolean` and `refusal(grant): string`, both documented in place. `sessions()` says it answers only the rows the turn's person may read. Step 2.
- `packages/sdk/src/host/tooling.ts` - `personOf` reads the turn's person from `senderOf` and `principalFor`. It answers "nobody to ask" only where `options.users` has no value, and for a root turn. It answers `'nobody'` for a running turn with no person, and for one whose owner this process has not met. A call with no running turn at all is nobody too. `mayDo` is true for that first answer, `reads(grant)` for `'nobody'`, and `person.can(grant)` otherwise. `refusalOf` says `refusalReason(person.id, grant)` or `this turn may not <grant> here`. `toolContext` carries `may`, `refusal` and the filtered `sessions()`. `remember` writes the calling turn's owner and its window under the new turn id in `send`, `create` and `createChat`, queued messages included. `remove` asks `mayDispose` as the turn's person. `scheduleWake` writes that person on the record. Steps 3 to 9 and 11 to 14 and 17.
- `packages/sdk/src/tools/session.ts` - one `allowed(at, grant)` helper throwing `at.refusal(grant)`. The two read tools ask `session:read`; the six that write ask `session:write`, each before any input is read. `list_sessions` and `schedule_wakeup` ask none, each with the reason written above it. Steps 8 to 11 and 18.
- `packages/sdk/src/types/sessions.ts` - `StoredChat.wake` gains `sender?: Owner`. Step 15.
- `packages/sdk/src/host/wakes.ts` - `setWake` takes `StoredChat['wake']`. A firing wake writes the stored owner into `senders` under the turn id before `beginOrRun`, and takes it back out where the turn is refused. Step 16.
- `packages/sdk/src/sessions.ts` - `wakeOf` reads `sender` back through `ownerOf`. It keeps the person only where the file wrote one, so a wake from before there was a person keeps none. `chatsOf` needs no change of its own: it keeps the wake through `wakeOf`, so the sender comes back with it. The reload case is what proves the pair - dropping `sender` in `wakeOf` alone makes it fail.
- `packages/sdk/test/sessiontools.test.ts` - six cases in `what a session tool asks of the turn it runs in`, over one reader and one member. The reader is listed the member's session and refused `create_session` with `reader may not session:write here`. A member's `create_session` makes a child whose turn lists three sessions, may create in them, and may not delete another person's. A turn nobody sent reads and is refused each writing tool with `this turn may not session:write here`. A call with no turn running is refused the same way and still lists, which is the case a backgrounded subagent or shell would reach. A member's wake begins a turn carrying the member, after a reload of the store through `fileSessions`. A host with no users directory answers every tool as before, wake included. 17 cases before, 23 after, with `beforeEach(resetSdk)` rather than `beforeAll`, because the fake's queries accumulate.
- `packages/sdk/test/session-delete-owner.test.ts` - its three tool cases now run inside a turn. Cases 6 and 7 say a turn has begun with `saying(...)` against the session channel. The backend is paced at 40ms a word, so the turn is still running when the tool is called. The fixture principal's hand-rolled `can` gained the chat-in-session inheritance the real `holds` has, without which `chat/turnStarted` was refused and no turn began. Case 8, once a stranger owner reached through the record, now asserts `this turn may not session:write here`. A call with no turn is nobody's, and the record's owner is never consulted.
- `docs/TOOLS.md` - the Grants section rewritten. It has a table of each session tool's grant, a paragraph on a turn nobody sent, and one on turns a tool or wake begins. The `member` and `guest` sentences are corrected: `member` holds `session:read` and `session:write`, `guest` holds `session:read` and never sends a turn. The `delete_session` sentence above it changed too.

Judgement calls the plan does not decide, each visible in the file it is made in:

- A call with no turn running is nobody. It reads and may not write. The alternative was to treat no turn as nothing to ask about, and that left a window open. A window outlives the turn it sent. A backgrounded subagent or shell could reach a session tool after its turn ended, and write as the session's person. This was the review's one fix.
- "No person" includes a person this process has not met. A wake set before a restart, or a child turn of a person since removed, resolves through `principalFor` to nobody. That turn reads and may not write until they sign in again. The alternative was to name them and hand out grants this host cannot check, which the plan's own words rule out.
- Root is recognised by name and not by connection. A wake a root turn set keeps the owner and not the window. So `personOf` reads the `root:` prefix on the owner, and `sentBy`'s `root` flag where a window is still held. Step 4 asked for what `admit` does; this is that answer for a record that outlives the connection.
- `remove` no longer asks `mayDispose` as the calling session's owner. That fallback was only ever reached by a call with no turn, and a call with no turn is nobody, refused before `mayDispose` is asked. The stranger-owner case is still covered where a turn exists - no users directory, an automation, a wake - and not through this tool.

Validation:

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` all exit 0.
- Vitest: `packages/sdk` 144 files and 2817 tests pass. `packages/server` 49 files and 957 tests pass. `packages/agent-claude` 32 files and 295 tests pass. `packages/agent-acp` 15 files and 246 tests pass. Run with `--maxWorkers=2 --testTimeout=10000`, and `pnpm -s schema` first.
- Mutating `personOf` to answer `undefined` for a call with no running turn makes the new case fail with `Invalid send_message input: refusing this turn may not session:write here`; restored, it passes. Mutating `wakeOf` to drop `sender` makes the wake case fail with `this turn may not session:write here`; restored, it passes. Nothing else changed.
- `node .agents/skills/do-spec/scripts/lint-prose.mjs docs/TOOLS.md` reports 35 long sentences, 32 of them on lines this task did not touch. The file is not lint-clean before or after, and the new lines match its style. The plan directory itself lints clean. Nothing outside the lines above changed.

Left:

- `packages/sdk/test/fixtures/wire.jsonl` is modified by the suite, and I could not restore it here. `git restore` is denied in this mode. 33 lines differ, and every one is environmental. The `getNetworkDiagnosticsInfo` endpoint here answers the DeepSeek host where the file holds the Anthropic one. The session rows' paths and timestamps differ beside it, and nothing in the diff is about the tools. Softov restored the file before this rerun and the suite rewrote it again; it is left as the suite wrote it. Run `git restore packages/sdk/test/fixtures/wire.jsonl` before committing.
- Tasks 02 and 03 are untouched.