---
title: a served paths change reaches the running daemon
status: todo
depends: [task-01-ahpd-paths-lists-adds-and-removes-a-folder.md]
layer: server
refs:
  - "[code://packages/server/src/commands/served.ts#L76-L87](../../../../packages/server/src/commands/served.ts#L76-L87) - the served registry"
  - "[code://packages/server/src/commands/configure.ts#L319](../../../../packages/server/src/commands/configure.ts#L319) - the push to the running list"
  - "[code://packages/server/src/commands/plugin.ts#L134](../../../../packages/server/src/commands/plugin.ts#L134) - `deploymentTokenOnly` on a write"
---

## Objective

The daemon serves `paths list`, `paths add` and `paths remove` over HTTP.
A served `add` or `remove` writes the daemon's own `config.json` and changes `served.options.paths`, so `ahpd status` shows the change at once.

## Files

- `UPDATE: packages/server/src/commands/paths.ts` - the served form: the daemon's file, no `configFile` field, the live list, and `deploymentTokenOnly`.
- `UPDATE: packages/server/src/commands/served.ts:76-87` - call `declarePaths(registry, facts)`.
- `UPDATE: packages/server/test/server-paths.test.ts` - cases for the served form.

## Steps

1. Add a case: a served `paths add` writes the daemon's `config.json` and adds the folder to `served.options.paths`.
2. Add a case: after a served `add`, `running().paths` holds the new folder.
3. Add a case: a served `paths remove` removes the folder from the file and from `served.options.paths`.
4. Add a case: a served `add` refuses a person's token, and accepts the deployment's token.
5. Add a case: a served `add` answers no restart line.
6. Run the cases and see them fail.
7. In `paths.ts`, use `served.configFile` as the file of the served form, and drop the `configFile` field.
8. After a served write, change `served.options.paths` in place, as `askToServe` does.
9. Set `meta: { deploymentTokenOnly: 'add or remove a served folder' }` on `add` and `remove`.
10. Call `declarePaths(registry, facts)` in `servedRegistry`.
11. Run the cases again and see them pass.

## Validation

- The new cases pass, and they fail before step 8.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` from the repository root; all pass.
- By hand: with a daemon running, `ahpd --remote <url> paths add <folder>`, then `ahpd status`. The status names the folder.

## Resume

Not started.
