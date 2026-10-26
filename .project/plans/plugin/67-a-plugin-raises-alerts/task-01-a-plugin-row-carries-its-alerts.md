---
title: A plugin row carries its alerts
status: todo
depends: []
layer: "sdk, server, docs"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L761-L773](../../../../packages/sdk/src/types/plugin.ts#L761-L773) - `problem(line)` on `PluginHost`"
  - "[code://packages/sdk/src/plugins/plugins.ts#L868-L874](../../../../packages/sdk/src/plugins/plugins.ts#L868-L874) - where a `problem` line goes"
  - "[code://packages/server/src/plugins.ts#L1339](../../../../packages/server/src/plugins.ts#L1339) - `told` and the log after load"
  - "[code://packages/server/src/plugins.ts#L1737-L1744](../../../../packages/server/src/plugins.ts#L1737-L1744) - `failed`, by plugin id"
  - "[code://packages/server/src/pluginschannel.ts#L234-L252](../../../../packages/server/src/pluginschannel.ts#L234-L252) - the row"
---

## Objective

`host.alert`, `host.clearAlert` and `host.problem` put alerts on the plugin's row, with the loader's own lines, and a client reads them as `alerts`.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts:761-773` - the `Alert` type, `alert(alert)` and `clearAlert(ref)` on `PluginHost`, and `problem` documented as a `warning` alert.
- `UPDATE: packages/sdk/src/plugins/plugins.ts:868-874` - the host option takes an alert in place of a line.
- `UPDATE: packages/server/src/plugins.ts` - the plugin set keeps alerts by id in place of `failed`, and `loadOne` sends alerts there during and after `apply`.
- `UPDATE: packages/server/src/applyplugins.ts:94-97` - the loader lines of each plugin become alerts on that plugin, and still go to the log.
- `UPDATE: packages/server/src/pluginschannel.ts:70-82` - `loadProblemOf` masks every alert text.
- `UPDATE: packages/server/src/pluginschannel.ts:234-252` - the row carries `alerts` and no `loadProblem`.
- `UPDATE: packages/server/test/plugins-channel.test.ts` - each `loadProblem` check reads the `error` alert.
- `UPDATE: docs/plugins/PLUGINS.md:809-815` - `alert`, `clearAlert` and `problem`.
- `UPDATE: docs/plugins/PLUGINS.md:1265-1276` - the `alerts` row field in place of `loadProblem`.

## Steps

1. Add `Alert` to the sdk as `{ level: 'notice' | 'info' | 'warning' | 'error'; text: string; ref?: string }`.
2. Add `alert(alert)` and `clearAlert(ref)` to `PluginHost`, and keep `problem(line)`.
3. Make `problem(line)` raise a `warning` alert with no `ref`.
4. Replace the `failed` map in the plugin set with alerts by plugin id.
5. Store the line that says a plugin did not load as an `error` alert.
6. Store every other loader line about a plugin as a `warning` alert on that plugin.
7. Replace an alert that has the same `ref` as a new one.
8. Keep at most 50 alerts on a plugin, and drop the oldest first.
9. Clear a plugin's alerts when it reloads or unloads.
10. Accept an alert after `apply` returns, and call the plugins channel `refresh`.
11. Mask each alert text with `loadProblemOf` before the row carries it.
12. Remove `loadProblem` from the row, and add `alerts` when the plugin has any.
13. Change each test that reads `loadProblem` to read the `error` alert.
14. Update the two `PLUGINS.md` sections.

## Validation

- `plugins-channel.test.ts`: a plugin that throws in `apply` has one `error` alert, and the masking tests still pass on its text.
- A new test: a plugin that calls `problem` in `apply` loads.
- The same test: its row has one `warning` alert with that text.
- A new test: `alert` after `apply` with the same `ref` twice leaves one alert, and `clearAlert` takes it out.
- A new test: a reload clears the alerts, and 60 alerts leave the newest 50.
- The gate passes: `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`.
- By hand, in a test daemon: add a piece that does not exist to the Activepieces options.
- The Activepieces row then has one `warning` alert.

## Resume
