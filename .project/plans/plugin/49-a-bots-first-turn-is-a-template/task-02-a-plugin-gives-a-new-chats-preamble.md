---
title: A plugin gives a new chat's preamble
status: implemented
depends: []
layer: "packages/sdk, docs"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L718](../../../../packages/sdk/src/types/plugin.ts#L718) - `registerMethod`, beside which `registerChatPreamble` goes"
  - "[code://packages/sdk/src/types/plugin.ts#L902-L995](../../../../packages/sdk/src/types/plugin.ts#L902-L995) - `Contribution`, which gains `preambles`"
  - "[code://packages/sdk/src/plugins.ts#L611-L623](../../../../packages/sdk/src/plugins.ts#L611-L623) - the fold of `pluginConnects`, the pattern the preambles follow"
  - "[code://packages/sdk/src/plugins.ts#L795-L810](../../../../packages/sdk/src/plugins.ts#L795-L810) - the empty contribution each `apply` fills"
  - "[code://packages/sdk/src/plugins.ts#L1103-L1110](../../../../packages/sdk/src/plugins.ts#L1103-L1110) - `registerMethod`, the shape `registerChatPreamble` copies"
  - "[code://packages/sdk/src/types/host.ts#L578-L588](../../../../packages/sdk/src/types/host.ts#L578-L588) - `pluginConnects` in `HostOptions`, beside which `chatPreambles` goes"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1042-L1160](../../../../packages/sdk/src/host/sessionmethods.ts#L1042-L1160) - `createChat`: a fork or side chat, `session/chatAdded`, then `initialMessage`"
  - "[code://packages/sdk/src/host/tooling.ts#L1438-L1463](../../../../packages/sdk/src/host/tooling.ts#L1438-L1463) - the `createChat` tool, which begins the chat's first turn with its prompt"
  - "[code://packages/sdk/src/types/agent.ts#L353-L354](../../../../packages/sdk/src/types/agent.ts#L353-L354) - `context`, the text a first turn carries to a backend without showing it"
  - "[code://docs/PLUGINS.md#L156-L181](../../../../docs/PLUGINS.md#L156-L181) - the table of what a plugin can register"
---

## Objective

A plugin registers a chat preamble, and the host asks it for text when a person or a tool opens a chat.
The host puts that text in the hidden `context` of the chat's first turn, before `initialMessage` when the chat has one.
No turn runs until someone writes, so a chat opened with no `initialMessage` gets the text with the person's first message.
The host asks in a client's `createChat`, which makes a plain chat, a fork or a side chat, and in the `createChat` tool.
The host does not ask for a subagent worker chat or a changeset chat.
Only the bot plugin registers a preamble in this plan.

The hook, as `packages/sdk/src/types/plugin.ts` declares it:

```ts
/** A chat that a person or a tool opened, as a chat preamble is told it. */
export interface OpenedChat {
  /** The session the chat is in. */
  session: string;
  /** The new chat. */
  chat: string;
  /** What the chat was made from, when it was made from another chat. */
  origin?: ChatOrigin;
  /** The session's other chats, as its catalogue lists them. */
  chats: readonly ChatSummary[];
}

/** Text for the hidden context of a chat's first turn, or `undefined` for none. */
export type ChatPreamble = (opened: OpenedChat) => Promise<string | undefined>;
```

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts:718` - declare `OpenedChat`, `ChatPreamble` and `registerChatPreamble(preamble)` on `PluginHost`.
- `UPDATE: packages/sdk/src/types/plugin.ts:902-995` - add `preambles: ChatPreamble[]` to `Contribution`.
- `UPDATE: packages/sdk/src/types/host.ts:578-588` - add `chatPreambles?: ChatPreamble[]` to `HostOptions`.
- `UPDATE: packages/sdk/src/plugins.ts:795-810` - start each contribution with `preambles: []`.
- `UPDATE: packages/sdk/src/plugins.ts:1103-1110` - add `registerChatPreamble`, which calls `open()` and appends the preamble.
- `UPDATE: packages/sdk/src/plugins.ts:611-623` - fold every contribution's `preambles` into `options.chatPreambles`, in plugin order.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1042-1160` - ask the preambles in `createChat`, and put the text in the first turn's `context`.
- `UPDATE: packages/sdk/src/host/tooling.ts:1438-1463` - ask the preambles in the `createChat` tool, and put the text in the first turn's `context`.
- `UPDATE: packages/sdk/src/index.ts` - export the `OpenedChat` and `ChatPreamble` types.
- `CREATE: packages/sdk/test/chat-preamble.test.ts` - cases for the hook in each place the host asks it, and where it does not.
- `UPDATE: packages/sdk/test/plugin-fold.test.ts` - a case for the fold of `chatPreambles`.
- `UPDATE: docs/PLUGINS.md:181` - add the `registerChatPreamble(preamble)` row to the table.
- `UPDATE: docs/PLUGINS.md:639` - add a section `### A new chat's preamble` before `### Keeping records`.

## Steps

1. Read the plan's *Open questions*, and stop to ask Softov while one of them names task 02.
2. Write `packages/sdk/test/chat-preamble.test.ts` with the cases in *Validation*.
3. Add the fold case to `packages/sdk/test/plugin-fold.test.ts`.
4. Run `pnpm exec vitest run packages/sdk/test/chat-preamble.test.ts packages/sdk/test/plugin-fold.test.ts` and see it fail.
5. Declare `OpenedChat`, `ChatPreamble` and `registerChatPreamble` in `types/plugin.ts`, as *Objective* shows.
6. Add `preambles` to `Contribution`, and `chatPreambles` to `HostOptions`.
7. Start each contribution with `preambles: []` in `plugins.ts`.
8. Add `registerChatPreamble`, which refuses a value that is not a function and appends it.
9. Fold the preambles into `options.chatPreambles` after `pluginConnects`, and set it only when one exists.
10. In `createChat`, ask each preamble before the host spawns the chat.
11. Give each preamble the session, the chat, the origin, and the session's other chats from the catalogue.
12. Join the answers that are not empty with a blank line, in plugin order.
13. Log a preamble that throws with the plugin's name, and keep the other answers.
14. Pass the joined text to `spawn` as `context`, so the first turn carries it without showing it.
15. For a side chat, join the preamble and the side chat's own `context`, preamble first.
16. Do the same in the `createChat` tool, where the tool's prompt is the first turn.
17. Leave `changesets.ts` and `spawn.ts` as they are: the host never asks the hook for a changeset or subagent chat.
18. Export the two types from `packages/sdk/src/index.ts`.
19. Run `pnpm exec vitest run packages/sdk`, and see every case pass.
20. Add the row and the section to `docs/PLUGINS.md`.
21. Say there which chats the host asks for, and that the text is hidden context before `initialMessage`.
22. Say there that a chat with no `initialMessage` gets the text with the person's first message.
23. Run every gate in *Validation*.

## Validation

- `packages/sdk/test/chat-preamble.test.ts` opens a chat with `createChat`, and sees no turn until a message arrives.
- The same file sends the first message, and sees the preamble's text as that turn's `context`.
- The same file opens a chat with `initialMessage`, and sees that turn carry the preamble's text as `context`.
- The same file forks a chat and opens a side chat, and sees the hook told each origin.
- The same file sees a side chat's `context` hold the preamble first, then the side chat's own text.
- The same file opens a chat with the `createChat` tool, and sees its prompt carry the preamble as `context`.
- The same file starts a changeset chat and a subagent worker chat, and sees the hook not asked.
- The same file registers two preambles, and sees both texts, joined, in plugin order.
- The same file registers a preamble that throws, and sees the chat open with the other text.
- The same file registers a preamble that answers `undefined`, and sees the chat open as it does today.
- `packages/sdk/test/plugin-fold.test.ts` folds two plugins' preambles into `chatPreambles`.
- `pnpm -s typecheck` passes.
- `pnpm -s boundary` passes.
- `pnpm -s schema` passes.
- `pnpm exec vitest run packages/sdk` passes.
- `node /home/softov/.claude/skills/do-spec/scripts/lint-prose.mjs docs/PLUGINS.md` reports nothing on the lines this task wrote.

## Resume


Built in `packages/sdk`: `types/plugin.ts`, `types/host.ts`, `types/index.ts`, `plugins.ts`, `host/sessionmethods.ts`, `host/tooling.ts` and a new `host/preamble.ts`. `chat-preamble.test.ts` has 13 cases, `plugin-fold.test.ts` gained 1, and `changewords.test.ts` gained 1.

How the parts work:

- `registerChatPreamble` refuses a value that is not a function, and keeps a wrapper that names the plugin in an error the preamble throws.
- The fold sets `chatPreambles` from every contribution in plugin order, and leaves it unset when there are none.
- `preambleOf` asks every preamble at once, logs one that throws, and joins the other answers with a blank line.
- `createChat` asks after every check, then checks the session and the chat name again, because both can change while the plugins answer.
- The text goes to `spawn` as `context`. A side chat gets the preamble, a blank line, then the text of its turn.
- The `createChat` tool asks with no `origin`, and passes the text as the context of the chat it opens.
- The host asks only when a plugin registered a preamble, so a host with none opens a chat in the same tick as before.

Where the build departs from the plan:

- The types are exported from `types/index.ts`, which `index.ts` exports whole.
- `session` and each chat in `OpenedChat` are the names the host holds them under, which are not always the names a client used.
- The changeset case is in `changewords.test.ts`, whose harness opens the changeset side chat. `chat-preamble.test.ts` has the subagent case.
- `plugin-host.test.ts` gained `preambles: []` in its contributions, because the field is required.
- `chat-preamble.test.ts` has three extra cases for `registerChatPreamble` itself.
- A fork gets no preamble, because it resumes a conversation that already began with one. Softov chose this after the build.

Open questions: none.

Gates: `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass. `pnpm exec vitest run packages/sdk packages/server packages/bot packages/webhook` passes 4032 of 4032 tests.
