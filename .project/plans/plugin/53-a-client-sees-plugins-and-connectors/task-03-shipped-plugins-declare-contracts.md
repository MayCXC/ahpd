---
title: Every shipped plugin declares its contracts
status: todo
depends: [task-02-a-registration-is-checked.md]
layer: "every plugin package"
refs:
  - "[code://packages/webhook/package.json](../../../../packages/webhook/package.json) - an `ahpd` field to extend"
  - "[code://packages/bot/src/plugin.ts](../../../../packages/bot/src/plugin.ts) - a plugin with channels, methods and an agent"
---

## Objective

Each plugin package in this repository declares `description`, `categories` and `contracts` in its `ahpd` field.
Each one still loads, which proves the contracts list every registration.

## Files

- `UPDATE: packages/agent-acp/package.json` - the manifest fields.
- `UPDATE: packages/agent-claude/package.json` - the manifest fields.
- `UPDATE: packages/agent-cofold/package.json` - the manifest fields.
- `UPDATE: packages/agent-pi/package.json` - the manifest fields.
- `UPDATE: packages/bot/package.json` - the manifest fields.
- `UPDATE: packages/computer/package.json` - the manifest fields.
- `UPDATE: packages/push/package.json` - the manifest fields.
- `UPDATE: packages/tasks/package.json` - the manifest fields.
- `UPDATE: packages/tunnel-devtunnel/package.json` - the manifest fields.
- `UPDATE: packages/webhook/package.json` - the manifest fields.
- `CREATE: packages/server/test/plugin-contracts.test.ts` - load every shipped plugin with its contracts.

## Steps

1. Read each plugin's `apply`, and list every register call with its name.
2. Write the list in `ahpd.contracts`, one key for each kind.
3. Write `description` as one sentence, and `categories` from `agent`, `channel`, `connector`, `storage` and `tool`.
4. Add the repository's `links` entry to each one.
5. Write a test that loads each shipped plugin and expects no contract error.
6. Run the test, and set this task and the plan row to `done`.

## Validation

- `plugin-contracts.test.ts`: every shipped plugin loads with no problem line about a contract.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** `packages/server/package.json` has an `ahpd` field and is not a plugin; leave it. The computer tests time out on this machine, so the computer load runs on CI.
