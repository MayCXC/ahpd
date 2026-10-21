---
title: VS Code's limits on spawning and messaging
status: done
depends: []
layer: sdk
refs:
  - "git://ac05bdfe1e1 - VS Code `src/vs/platform/agentHost/node/shared/sessionServerTools.ts`: the constants at :32-39, the depth check at :926-969, the counters at :1634-1636"
  - "[code://packages/sdk/src/host/tooling.ts#L1086-L1157](../../../../packages/sdk/src/host/tooling.ts#L1086-L1157) - `send`, `create` and `createChat`, where the limits are asked"
  - "[code://packages/sdk/src/host/tooling.ts#L1131](../../../../packages/sdk/src/host/tooling.ts#L1131) - `kept.setParent`, the only parent link a created session records"
  - "[code://packages/sdk/src/types/sessions.ts#L144-L218](../../../../packages/sdk/src/types/sessions.ts#L144-L218) - `SessionStore` and `setParent`"
  - "[code://packages/sdk/src/sessions/sessions.ts#L309-L348](../../../../packages/sdk/src/sessions/sessions.ts#L309-L348) - `Row.parent` and the saved record"
---

## Objective

A session made by `create_session` is refused past spawn depth 3.
Through the session tools, each session tree may make at most 50 sessions and 50 chats, and send at most 100 messages.
Each refusal uses VS Code's words.

## Files

- `UPDATE: packages/sdk/src/host/tooling.ts:1086-1157` - `send`, `create` and `createChat` ask the depth and the counts, and count after success.
- `UPDATE: packages/sdk/src/types/sessions.ts:144-218` - the store answers a session's root through its parent links.
- `UPDATE: packages/sdk/src/sessions/sessions.ts:309-348` - `memorySessions` and `fileSessions` answer the root and the depth from `Row.parent`.
- `UPDATE: packages/sdk/test/sessiontools.test.ts` - the limit cases below.
- `UPDATE: docs/sdk/TOOLS.md` - the limits and their words.

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
13. Write the limits and their words in `docs/sdk/TOOLS.md`.

## Validation

- `sessiontools.test.ts`: a chain of `create_session` calls stops at depth 3 with the recursion words.
- `sessiontools.test.ts`: the host refuses the 51st session in one tree, and still makes a session in a second tree.
- `sessiontools.test.ts`: the host refuses the 51st chat and the 101st message with their words.
- `sessiontools.test.ts`: the host refuses the 101st message of an agent that sends to two independent sessions.
- `sessiontools.test.ts`: a failed send does not count.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume

Done 2026-10-13. Every step in order; nothing skipped. Reviewed the same day, and the review's one fix - every count charged to the calling session's tree - is applied and written up below.

The reference is the checkout at `/github/externals/vscode`, which is commit `32bbe1b8cba` rather than the `ac05bdfe1e1` the ref names. The four constants there are the ones the task writes: `maxSessionSpawnDepth = 3`, `maxCreatedSessions = 50`, `maxCreatedChats = 50` and `maxSentMessages = 100`. The refusal words are word for word what the task quotes. So nothing drifted but the line numbers. The counters are at `:1838-1848` now, not the `:1634-1636` the ref names. The depth check is at `:937-940`, not `:926-969`. No step disagreed with the code.

File by file:

- `packages/sdk/src/host/tooling.ts` - four constants at the top of the file, each documented with VS Code's own name. `TREE_LIMITS` holds each count's limit and its refusal sentence. Inside `createTooling`, `counted` is a map from a tree's root id to its three numbers, with `treeOf`, `countsIn`, `room` and `countUp` over it. `create` asks the count and the depth before it makes anything. It counts after the session has started and its first turn has begun. `createChat` asks and counts around the chat it opens. `send` asks before anything, and counts on both the queued and the sent path. All three ask `treeOf(idOf(uri))`, the tree of the session the tool runs in. Steps 2 and 5 to 12, and the review's one fix.
- `packages/sdk/src/types/sessions.ts` - `SessionStore` gains `rootOf?(id): string` and `depthOf?(id): number`, beside `parent?`/`setParent?` and documented the same way. Steps 3 and 4.
- `packages/sdk/src/sessions/sessions.ts` - `Held` gains both, `memorySessions` answers them from one `treeOf` walk up the `parent` links, and `fileSessions` passes the inner store's answers through. Steps 3 and 4.
- `packages/sdk/test/sessiontools.test.ts` - a new describe, `VS Code's limits on spawning and messaging`, with six cases. A chain stops at depth 3 in the reference host's words. The 51st session in one tree is refused, while a second tree still makes one. The 51st chat is refused by either tool that makes one, and so is the 101st message. A send that failed is not counted. An agent that sends to two independent sessions is refused the 101st message in total, which is the review's case. 23 cases before, 29 after. These are the cases the Validation asks for. They run in the file's own style: no users directory, so no grant is asked and only the limits are under test.
- `docs/sdk/TOOLS.md` - a `Limits` section after `Grants`, holding a table of the four bounds and the refusal each answers with. The paragraphs after it cover depth, what a tree is, and which tree a count is spent in. Then that a count is taken once the thing it counts has happened, and that clients are unbounded. The last says the counters are in memory, as the reference host's are. Step 13.

Judgement calls the plan does not decide, each visible in the file it is made in:

- Which tree spends a count, and the review's one fix to it. The first cut counted a message in the tree of the session it was sent to. The review is right that this leaves the bound open. An agent in one session could send a hundred messages into each of any number of independent sessions. It could make fifty chats in each of them and never meet a limit. Every count is now taken against `treeOf(idOf(uri))`, the tree of the session the tool runs in. `create` already did, and `send` and `createChat` now do. That is what step 11 asks for, and what the plan's decision says: the counts are kept from the session the first spawn came from.
- `rootOf` and `depthOf` are optional on the port, as `parent` and `setParent` are. A store outside this repo keeps no links and would break on a required method. The host reads `kept.rootOf?.(id) ?? id` and `kept.depthOf?.(id) ?? 0`, so such a store holds no tree. Every session in it is a root at depth 0, which is the same answer `memorySessions` gives for a session nothing started.
- The walk up the parent links carries a `seen` set. A store is a file a person can edit. A record naming its own ancestor would otherwise hang the host on a tool call rather than answer one.
- The counters are keyed by the root's id and never pruned. A tree whose root is deleted keeps its numbers until the daemon restarts, where VS Code's counters also end.

Validation:

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` all exit 0.
- Vitest: `packages/sdk` 144 files and 2823 tests pass (2817 before, the six cases above added). `packages/server` 49 files and 957 tests pass. `packages/agent-claude` 32 files and 295 tests pass. `packages/agent-acp` 15 files and 246 tests pass. Run with `--maxWorkers=2 --testTimeout=10000`, and `pnpm -s schema` first.
- The sdk suite flaked on this box while these runs were made. Of four full runs, two passed clean and two lost one test. Both times it was `packages/sdk/test/nested-proxy.test.ts`, once `a nested session whose profile says record is deleted here, and its copy inside stays`. That file passes on its own, 49 tests in 12.2s with two of them at 4.0s and 4.1s. So it is the ten-second budget under contention and not this task's work. Nothing in it touches the limits.
- Mutating the depth guard to `depth >= MAX_SPAWN_DEPTH + 99` makes the chain case fail on `New session created (...)` where the recursion words were expected; restored, it passes. Counting a message before the send rather than after it makes the failed-send case refuse the 51st of the hundred successful sends; restored, it passes. Charging a message to the target session again, `treeOf(idOf(at))`, makes the two-target case answer `Message queued` where the refusal was expected; restored, it passes. Nothing else changed.
- `node .agents/skills/do-spec/scripts/lint-prose.mjs docs/sdk/TOOLS.md` reports 42 long sentences, 36 of them on lines this task did not touch. The file is not lint-clean before or after, and the new lines match its style. The plan directory itself lints clean.

Left:

- `packages/sdk/test/fixtures/wire.jsonl` is modified by the suite again, and I could not restore it here; `git restore` is denied in this mode. Softov restored it to HEAD before these runs, which is md5 `36f8a25c006cb35157164ce235f964ad`. The sdk runs rewrote it to `b2aafb328d13c4e17773d688002b83d2`: 33 lines changed, none of them about the tools. Run `git restore packages/sdk/test/fixtures/wire.jsonl` before committing.
- Task 03 is untouched, and task 01 is as the review left it.
