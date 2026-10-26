---
title: Activepieces installs a missing piece
status: todo
depends: [task-01-a-plugin-installs-a-package.md]
layer: "activepieces, docs"
refs:
  - "[code://packages/activepieces/package.json#L90-L100](../../../../packages/activepieces/package.json#L90-L100) - the `pieces` pattern"
  - "[code://packages/activepieces/src/plugin.ts#L182-L193](../../../../packages/activepieces/src/plugin.ts#L182-L193) - `apply`"
  - "[code://packages/activepieces/src/child.ts#L144-L151](../../../../packages/activepieces/src/child.ts#L144-L151) - the import of a piece"
---

## Objective

A piece name saved in the options installs when it does not resolve, and its connector shows. Each install and each piece that does not load is an alert on the plugin's row.

## Files

- `UPDATE: packages/activepieces/package.json:90-100` - the `pieces` pattern accepts `@<version>` after the name.
- `UPDATE: packages/activepieces/src/plugin.ts:182-193` - `apply` installs each missing piece before it asks the child to describe them.
- `UPDATE: packages/activepieces/src/child.ts:144-151` - the child imports a piece by its package name, from its own `node_modules` or from `installed/`.
- `UPDATE: packages/activepieces/src/wire.ts` - the describe request carries the `installed` folder.
- `UPDATE: packages/activepieces/test` - the version in a name, the install and the alerts.
- `UPDATE: packages/activepieces/README.md` - how a person adds a piece, with or without a version.

## Steps

1. Change the `pieces` pattern to accept an optional `@<version>` after the package name.
2. Split each name into its package name and its version.
3. Resolve each package name from the plugin's own `node_modules` and from `host.installed`.
4. Call `host.install` for each name that does not resolve, or whose written version is not the one installed.
5. Raise an `info` alert with `ref` `piece:<package>` and the version when an install ends.
6. Raise an `error` alert with the same `ref` and the npm error when an install fails.
7. Send `host.installed` to the child in the describe request.
8. Make the child import a piece by its package name.
9. Make the child try `installed/` when its own `node_modules` does not have the piece.
10. Raise a `warning` alert with `ref` `piece:<package>` for each piece that still does not load, in place of `host.problem`.
11. Document in the README how to add a piece, with and without a version.

## Validation

- A test: a name with `@0.5.1` passes the pattern, and the child imports it by the name without the version.
- A test with a fake `host.install`: the plugin installs a missing piece once, and gives it the alert above.
- The same test: the plugin installs no piece that is in `package.json`.
- A test: an install that fails leaves the other pieces as adapters.
- The gate passes: `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`.
- By hand, in a test daemon with XDG temp dirs: `@activepieces/piece-postgres@0.5.1` in the options shows a Postgres connector.

## Resume
