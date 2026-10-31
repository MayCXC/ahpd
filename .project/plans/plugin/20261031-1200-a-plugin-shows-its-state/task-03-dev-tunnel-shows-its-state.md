---
title: Dev Tunnel shows its state
status: todo
depends:
  - task-02-the-row-carries-the-view.md
layer: tunnel-devtunnel
refs:
  - "[code://packages/tunnel-devtunnel/src/plugin.ts#L132-L136](../../../../packages/tunnel-devtunnel/src/plugin.ts#L132-L136) - where `devtunnel host` starts and the plugin says the tunnel"
  - "[code://packages/tunnel-devtunnel/src/devtunnel.ts#L184-L196](../../../../packages/tunnel-devtunnel/src/devtunnel.ts#L184-L196) - `host`, which splits the output into lines"
  - "[code://packages/tunnel-devtunnel/test/tunnel-devtunnel.test.ts](../../../../packages/tunnel-devtunnel/test/tunnel-devtunnel.test.ts) - the plugin tests, with a fake spawner"
---

## Objective

The Dev Tunnel plugin shows a view with the tunnel URL, the tunnel id, the port and the state of the relay.
It reads the URL and the relay state from the output of `devtunnel host`.

## Files

- `UPDATE: packages/tunnel-devtunnel/src/devtunnel.ts:184-196` - `host` takes a second callback that gets each line, next to `log`.
- `CREATE: packages/tunnel-devtunnel/src/hoststate.ts` - `readHostLine(state, line)`, which answers the new state for a line it knows.
- `CREATE: packages/tunnel-devtunnel/src/view.ts` - `tunnelView(state)`, the `PluginView` of a state.
- `UPDATE: packages/tunnel-devtunnel/src/plugin.ts:132-136` - keep the state, show the view on each change, and clear it when the tunnel stops.
- `UPDATE: packages/tunnel-devtunnel/i18n/pt.json` - the texts of the view in Portuguese.
- `UPDATE: packages/tunnel-devtunnel/i18n/es.json` - the texts of the view in Spanish.
- `CREATE: packages/tunnel-devtunnel/test/tunnel-devtunnel-view.test.ts` - the cases of this task.
- `UPDATE: packages/tunnel-devtunnel/README.md` - say what the plugin's page shows.

## Steps

1. Run `devtunnel host` by hand, and copy its lines for a start, a relay drop and a relay return.
2. Put those lines in the test as fixtures.
3. Read the URL from the line `Connect via browser: <url>`, and keep the first http(s) URL.
4. Read the relay state from the lines that say the connection to the relay is lost or restored.
5. Keep the tunnel id, its label and the port from the start of the plugin.
6. Make `tunnelView` a Card with a Column: the URL as a Link, then a Text for each value.
7. Give each Text a fixed component id, so its text has a catalog key.
8. Show the view once the tunnel starts, and again when the URL or the relay state changes.
9. Clear the view when the tunnel stops.
10. Add a test that the fixture lines give the URL and each relay state.
11. Add a test that the plugin shows a view that `checkView` accepts.
12. Add a test that a stop clears the view.

## Validation

- `pnpm vitest run packages/tunnel-devtunnel/test` passes, with the new cases.
- `pnpm typecheck` is clean.
- By hand, start a test ahpd under XDG directories with the plugin, and read its row in `x-ahpd-plugins`.

## Resume
