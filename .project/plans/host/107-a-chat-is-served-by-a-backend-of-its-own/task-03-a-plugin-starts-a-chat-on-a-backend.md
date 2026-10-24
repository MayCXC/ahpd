---
title: A plugin starts a chat on a backend
status: done
depends:
  - task-01-a-chat-keeps-the-backend-that-serves-it.md
  - task-02-every-start-uses-the-chats-own-backend.md
layer: "sdk"
refs:
  - "[code://packages/sdk/src/types/host.ts#L922-L934](../../../../packages/sdk/src/types/host.ts#L922-L934) - `ToolCall.create` and `createChat`"
  - "[code://packages/sdk/src/host/tooling.ts#L1496](../../../../packages/sdk/src/host/tooling.ts#L1496) - `ToolCall.create` resolves its provider, the pattern"
  - "[code://packages/sdk/src/host/tooling.ts#L1533-L1572](../../../../packages/sdk/src/host/tooling.ts#L1533-L1572) - `ToolCall.createChat`"
  - "[code://packages/sdk/src/types/plugin.ts#L172-L192](../../../../packages/sdk/src/types/plugin.ts#L172-L192) - `PluginStarts`"
  - "[code://packages/sdk/src/types/plugin.ts#L786](../../../../packages/sdk/src/types/plugin.ts#L786) - `PluginHost.startSession`"
  - "[code://packages/sdk/src/plugins/plugins.ts#L1113-L1120](../../../../packages/sdk/src/plugins/plugins.ts#L1113-L1120) - the plugin's `startSession`"
  - "[code://packages/sdk/src/host/automations.ts#L932-L945](../../../../packages/sdk/src/host/automations.ts#L932-L945) - `beginPluginSession` and its grant checks"
  - "[code://packages/sdk/src/host/sessionconfig.ts#L325-L333](../../../../packages/sdk/src/host/sessionconfig.ts#L325-L333) - the contributed session keys"
---

## Objective

A plugin starts a chat in a session on a backend it names, with that backend's config.
It does this from a wake through `PluginHost.startChat`, or from a tool call through `ToolCall.createChat`.

## Files

- `UPDATE: packages/sdk/src/types/host.ts:934` - `createChat` options gain `provider?` and `config?`.
- `UPDATE: packages/sdk/src/types/plugin.ts:786` - `PluginHost.startChat(session, options)` beside `startSession`.
- `UPDATE: packages/sdk/src/types/plugin.ts:172-192` - `PluginStarts` gains the chat start.
- `UPDATE: packages/sdk/src/plugins/plugins.ts:1113-1120` - the plugin's `startChat`, bound like `startSession`.
- `UPDATE: packages/sdk/src/host/tooling.ts:1533-1572` - one helper, `openChat`, for both seams.
- `UPDATE: packages/sdk/src/host/automations.ts:932-945` - `startChat` asks the owner's `chat:create` first.
- `UPDATE: packages/sdk/test/sessiontools.test.ts` - `createChat` with a `provider`.
- `UPDATE: packages/sdk/test/plugin-start-session.test.ts` - `startChat` and its refusals.
- `UPDATE: docs/plugins/PLUGINS.md` - `startChat`, and `provider` and `config` on `createChat`.
- `UPDATE: CHANGELOG.md` - a plugin starts a chat on a backend of its own.

## Steps

1. Add `provider?` and `config?` to the `createChat` options, with a comment for each.
2. Add `startChat(session, { provider?, model?, config?, title?, prompt? })` to `PluginHost`, answering the chat URI.
3. Move the body of `ToolCall.createChat` into `openChat`, which both seams call.
4. In `openChat`, get the agent of `provider` from `ctx.agents`, or the session's agent when absent.
5. Refuse an unknown provider with "No provider called <name>".
6. Check `config` against that agent's session schema, and refuse a bad value.
7. Add the session's keys that no backend owns, such as `computer` and the contributed keys.
8. Spawn the chat with that agent and config, and begin it with the model and prompt.
9. Bind `startChat` in the host as `startSession` is bound.
10. Ask the session owner's `chat:create` before the start, with the refusal `startSession` words.
11. Document both seams in PLUGINS.md, and add a changelog line.
12. Add the tests, and run the sdk tests.
13. Set this task and its plan row to `implemented`.

## Validation

- `sessiontools.test.ts`: `createChat` with `provider: 'b'` spawns the chat on agent B, in a session of agent A.
- `sessiontools.test.ts`: the host refuses an unknown provider, and makes no chat.
- `plugin-start-session.test.ts`: `startChat` makes a chat on the named backend, with its config.
- `plugin-start-session.test.ts`: the host refuses `startChat` for an owner without `chat:create`.
- `plugin-start-session.test.ts`: the chat gets `computer` from the session, and not the session backend's own keys.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm test` pass.
