---
title: The plugins name the oldest daemon
status: todo
depends: []
layer: plugins, docs
refs:
  - "[code://packages/agent-claude/package.json#L63-L64](../../../../packages/agent-claude/package.json#L63-L64) - the `@ahpd/sdk` peer range, `>=0.10 <1`"
  - "[code://packages/server/src/install.ts#L255-L280](../../../../packages/server/src/install.ts#L255-L280) - `fittingVersion` reads the range"
  - "[code://docs/server/UPGRADE.md](../../../../docs/server/UPGRADE.md) - how an update moves the plugins"
---

## Objective

Each first-party plugin admits `@ahpd/sdk` from 0.14, so a 0.13 daemon does not install a 0.14.1 plugin it cannot load. UPGRADE.md says that an update by npm needs `ahpd plugin update all`.

## Files

- `UPDATE: packages/activepieces/package.json` - peer `@ahpd/sdk` to `>=0.14 <1`.
- `UPDATE: packages/agent-acp/package.json` - the same.
- `UPDATE: packages/agent-claude/package.json` - the same.
- `UPDATE: packages/agent-cofold/package.json` - the same.
- `UPDATE: packages/agent-pi/package.json` - the same.
- `UPDATE: packages/bot/package.json` - the same.
- `UPDATE: packages/computer/package.json` - the same.
- `UPDATE: packages/push/package.json` - the same.
- `UPDATE: packages/tasks/package.json` - the same.
- `UPDATE: packages/tunnel-devtunnel/package.json` - the same.
- `UPDATE: packages/webhook/package.json` - the same.
- `UPDATE: docs/server/UPGRADE.md` - a section for an update by npm or from 0.12.

## Steps

1. Set the `@ahpd/sdk` peer range of each package above to `>=0.14 <1`.
2. Run `pnpm install` so the lockfile agrees, and keep only the lockfile lines for these ranges.
3. Add a section to UPGRADE.md: an update by `npm i -g @ahpd/server`, or from 0.12, does not move the plugins.
4. In that section, tell the reader to run `ahpd plugin update all`, then `ahpd restart`.
5. Search the tests for a hardcoded peer range, and correct each one.
6. Run the gates, and set this task and the plan row to `implemented`.

## Validation

- The gates pass.
- `rg '"@ahpd/sdk": ">=0\.(8|10|11|13)' packages/*/package.json` finds nothing.

## Resume
