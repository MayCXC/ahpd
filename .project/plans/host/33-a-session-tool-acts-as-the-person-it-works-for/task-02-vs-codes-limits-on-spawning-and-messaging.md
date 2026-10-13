---
title: VS Code's limits on spawning and messaging
status: todo
depends: []
layer: sdk
refs:
  - "git://ac05bdfe1e1 - VS Code `src/vs/platform/agentHost/node/shared/sessionServerTools.ts`: the constants at :32-39, the depth check at :926-969, the counters at :1634-1636"
  - "[code://packages/sdk/src/host/tooling.ts#L1086-L1157](../../../../packages/sdk/src/host/tooling.ts#L1086-L1157) - `send`, `create` and `createChat`, where the limits are asked"
  - "[code://packages/sdk/src/host/tooling.ts#L1131](../../../../packages/sdk/src/host/tooling.ts#L1131) - `kept.setParent`, the only parent link a created session records"
  - "[code://packages/sdk/src/types/sessions.ts#L144-L218](../../../../packages/sdk/src/types/sessions.ts#L144-L218) - `SessionStore` and `setParent`"
  - "[code://packages/sdk/src/sessions.ts#L309-L348](../../../../packages/sdk/src/sessions.ts#L309-L348) - `Row.parent` and the saved record"
---

## Objective

A session made by `create_session` is refused past spawn depth 3.
Through the session tools, each session tree may make at most 50 sessions and 50 chats, and send at most 100 messages.
Each refusal uses VS Code's words.

## Files

- `UPDATE: packages/sdk/src/host/tooling.ts:1086-1157` - `send`, `create` and `createChat` ask the depth and the counts, and count after success.
- `UPDATE: packages/sdk/src/types/sessions.ts:144-218` - the store answers a session's root through its parent links.
- `UPDATE: packages/sdk/src/sessions.ts:309-348` - `memorySessions` and `fileSessions` answer the root and the depth from `Row.parent`.
- `UPDATE: packages/sdk/test/sessiontools.test.ts` - the limit cases below.
- `UPDATE: docs/TOOLS.md` - the limits and their words.

## Steps

1. Read the plan's *Decisions locked in* rows for task 02.
2. Add the constants `MAX_SPAWN_DEPTH = 3`, `MAX_CREATED_SESSIONS = 50`, `MAX_CREATED_CHATS = 50` and `MAX_SENT_MESSAGES = 100`, with VS Code's names in their comments.
3. Add `rootOf(id)` and `depthOf(id)` to `SessionStore`, both read from the parent links.
4. Give a session with no parent depth 0 and itself as its root.
5. In `create`, refuse when the calling session's depth is 3 or more.
6. Use the words: `Refusing to create a session: recursion limit reached (max spawn depth 3). This session was itself created <depth> level(s) deep.`
7. Keep three counters in memory, by root session id: sessions created, chats created, messages sent.
8. Before `create`, refuse at 50 with: `Refusing to create more than 50 sessions from server tools in this session tree.`
9. Before `createChat`, refuse at 50 with: `Refusing to create more than 50 chats from server tools in this session tree.`
10. Before `send`, refuse at 100 with: `Refusing to send more than 100 messages from server tools in this session tree.`
11. Find the root of a chat from its session, so that a new chat counts in its session's tree.
12. Increment each counter only after its action succeeds, as VS Code does.
13. Write the limits and their words in `docs/TOOLS.md`.

## Validation

- `sessiontools.test.ts`: a chain of `create_session` calls stops at depth 3 with the recursion words.
- `sessiontools.test.ts`: the host refuses the 51st session in one tree, and still makes a session in a second tree.
- `sessiontools.test.ts`: the host refuses the 51st chat and the 101st message with their words.
- `sessiontools.test.ts`: a failed send does not count.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume
