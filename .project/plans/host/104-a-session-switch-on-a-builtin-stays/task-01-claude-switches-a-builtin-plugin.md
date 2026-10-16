---
title: Claude switches a built-in plugin
status: done
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

Implemented 2026-10-16.

**Step 1: what `reloadPlugins` answers after a built-in is set to `false`.** The plugin is *absent* from the answer, not present with a state. `reload_plugins` builds its `plugins` out of the loader's own `enabled` set, so a plugin that stopped being loaded has no row at all. The consequence for this task is the whole shape of the switch: the CLI's answer cannot be used to publish the row the person just moved, so agent-claude keeps what each switched-off plugin was and builds the row again from that.

**Step 2: whether `applyFlagSettings` merges with the flag settings from the start.** It merges, and only at the top level: the CLI holds the layer and assigns `{...layer, ...settings}`. So a key the settings name is replaced whole, which for `enabledPlugins` means the map sent on a switch has to carry every plugin this session has decided about, and not only the one being moved - a one-entry map would take the earlier decisions out of the layer and the CLI would load those plugins again. Both readings are from the CLI's own code in the bundled binary (`@anthropic-ai/claude-agent-sdk-linux-x64@0.3.301`): there is no authenticated CLI on this box to drive. The same reading confirms the setting is honoured for a built-in, because the flag layer is one of the three sources allowed to name one, and a `false` passes its validation.

What was built:

- `setCustomizationEnabled` sends an id that names no MCP server to a new `switchPlugin`. It finds the container by id, sends the whole flag set with `enabledPlugins` for the container's `source` and every earlier decision beside it, reloads the plugins, and answers `true` only when the reload's list agrees with the switch - `true` and loaded, or `false` and gone. A switch the CLI did not take is recorded nowhere, so the list keeps saying what the CLI says.
- `describe` records what it read in `reported` and lays the list out through a new `laid`, which a switch also calls. The MCP half of `reported` is refreshed where a server is switched, so a rebuild after a plugin switch does not put a switched-off server back on.
- `customizationsOf` takes a seventh parameter, the plugins this session switched off, and carries them into the same container loop as the ones the CLI reported, with `enablement: [{ kind: 'session', enabled: false }]` on the container. A name the CLI *is* reporting is dropped from that list rather than marked, because a plugin the CLI is loading is not one this session switched off.
- `rootOf` is exported from `customizations.ts`, so the reload's entries and the container's `uri` are read for the same key. It is the `<name>@builtin` a built-in is keyed under, which is what the `enabledPlugins` key is.
- The MCP path is untouched.

The Files line for `customizations.ts` says a container "carries `enabled: false`". The protocol's shape for a container is `enablement: [{ kind: 'session', enabled: false }]` - `PluginCustomization.enablement`, read by a consumer as `enablement[0].enabled`, and the same shape task 02's validation names - so that is what the container carries, and not a flat flag.

`packages/agent-claude/test/agent-claude-plugin-switch.test.ts` is new, six cases over a mocked SDK whose `applyFlagSettings` moves a plugin set that `reloadPlugins` reads: the flag setting and then the reload in that order with the style kept beside them, the switched-off row published with the session entry on it and the other built-in left alone, switching back on, a second switch carrying the first decision, a CLI that did not take the switch, and a skill id and an unknown plugin id both answered `false` with the CLI asked nothing.

Nothing here is committed: this preset allows neither `git add` nor `git commit`, so the work is left in the worktree to be reviewed and committed afterwards. The files this task changed:

- `UPDATE: packages/agent-claude/src/session/servers.ts` - `switchPlugin`, the `switched` and `reported` state, `laid`, and the non-MCP arm of `setCustomizationEnabled`.
- `UPDATE: packages/agent-claude/src/session/customizations.ts` - the `off` parameter, the session entry on a switched-off container, and `rootOf` exported.
- `CREATE: packages/agent-claude/test/agent-claude-plugin-switch.test.ts` - the six cases, still untracked.
- `UPDATE: .project/plans/host/104-a-session-switch-on-a-builtin-stays/plan.md` - the Tasks table and the Resume state.

`pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs`, `git diff --quiet tools/` and `pnpm exec vitest run packages/agent-claude` pass - 34 files, 314 cases.

The checklist's by-hand item - "Disable (Session)" on `cc-plugin-agents-md` staying off, and the plugin's skills leaving the slash list - is not run: it needs a live authenticated CLI, which this box does not have.
