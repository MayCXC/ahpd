---
title: Claude switches a built-in plugin
status: todo
depends: []
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/session/servers.ts#L240-L282](../../../../packages/agent-claude/src/session/servers.ts#L240-L282) - `setCustomizationEnabled`"
  - "[code://packages/agent-claude/src/session/servers.ts#L205](../../../../packages/agent-claude/src/session/servers.ts#L205) - the session reads the plugin list from `reloadPlugins`"
  - "[code://packages/agent-claude/src/session/customizations.ts#L96-L119](../../../../packages/agent-claude/src/session/customizations.ts#L96-L119) - `rootOf` and the plugin containers"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.278/sdk.d.ts#L6966 - `enabledPlugins`
---

## Objective

`setCustomizationEnabled` switches a plugin that the CLI reported, built-in plugins included.
It sets `enabledPlugins` for the plugin's source through `applyFlagSettings`, and reloads the plugins.
The session's customizations report the plugin with its new state.

## Files

- `UPDATE: packages/agent-claude/src/session/servers.ts:240-282` - a plugin id goes to `enabledPlugins`, and the answer is `true` when the switch took.
- `UPDATE: packages/agent-claude/src/session/customizations.ts:96-119` - a plugin container carries `enabled: false` when the session switched it off.
- `UPDATE: packages/agent-claude/test` - the switch on a fake handle.

## Steps

1. Read what `reloadPlugins` answers after `applyFlagSettings` sets a built-in to `false`, and record it in Resume.
2. Read whether `applyFlagSettings` merges with the flag settings from the start, and record it in Resume.
3. Find the plugin container by its id in `ctx.customizations`.
4. Call `applyFlagSettings` with `enabledPlugins` for the container's `source`, and keep the other flag settings.
5. Call `reloadPlugins`, and build the customizations again from its answer.
6. Answer `true` when the plugin's state matches the switch, and `false` when it does not.
7. Keep the MCP path as it is.
8. Write the tests.
9. Set this task and the plan row to `implemented`.

## Validation

- A test: switching `plugin:<name>` off sends `enabledPlugins: { '<name>@builtin': false }` and then `reloadPlugins`.
- A test: the answer is `true`, and the container reports `enabled: false`.
- A test: switching it on again sends `true`.
- A test: a skill id still answers `false`.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume
