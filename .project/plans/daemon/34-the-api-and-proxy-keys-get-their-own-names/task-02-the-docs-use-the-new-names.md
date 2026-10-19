---
title: The docs use the new names
status: todo
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
