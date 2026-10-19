---
title: The docs use the new names
status: implemented
depends:
  - task-01-the-daemon-reads-the-new-names.md
layer: "docs"
refs:
  - "[code://docs/server/PROXY.md](../../../../docs/server/PROXY.md) - the proxy examples"
  - "[code://docs/server/REMOTE.md](../../../../docs/server/REMOTE.md) - the HTTP API examples"
  - "[code://docs/server/UPGRADE.md](../../../../docs/server/UPGRADE.md) - what an upgrade changes"
---

## Objective

The docs show only the new names, and the upgrade page says how to rename the two keys.

## Files

- `UPDATE: docs/server/PROXY.md` - `proxy` becomes `modelProxy` in the text and the examples.
- `UPDATE: docs/server/REMOTE.md` - `http` becomes `httpApi` in the text and the examples.
- `UPDATE: docs/server/UPGRADE.md` - the two renamed keys, and the warning a person sees.
- `UPDATE: docs/server/CONFIGURE.md` - the two keys, if the page names them.

## Steps

1. Search `docs/` for the two configuration keys, and skip the `proxy` grant and the `proxy` match type.
2. Rename each configuration key in the text and in each JSON example.
3. Add an UPGRADE.md entry that names the old key, the new key and the warning.
4. Run `pnpm -s docs:build` if the repository has it, and fix each broken link.

## Validation

- `rg -n '"http":|"proxy":' docs --glob '*.md'` finds nothing outside the UPGRADE.md entry.
- `node /home/softov/.claude/skills/do-spec/scripts/lint-prose.mjs` passes on the plan files.

## Resume

Done 2026-10-19. Every step is built, and every case the Validation names passes. Not reviewed.

`PROXY.md`, `REMOTE.md` and `CONFIGURE.md` name `httpApi` and `modelProxy` in their text and in each JSON example. `UPGRADE.md` has a "Renamed keys" section naming the old key, the new one and the warning a person sees. The search also found `HOST.md`, `POLICY.md` and `PLUGINS.md` naming the keys, so those use the new names too. The `proxy` grant, `proxy:call`, the policy `proxy` match type, the `source: "proxy"` usage records and the MCP `http` server type are untouched.

Departures:
- `docs/sdk/HOST.md`, `docs/sdk/POLICY.md` and `docs/plugins/PLUGINS.md` are updated beside the four files the task lists. Step 1 searches all of `docs/`, and those pages name the configuration keys.

`rg -n '"http":|"proxy":' docs --glob '*.md'` finds nothing. `pnpm -s docs:build` passes.
