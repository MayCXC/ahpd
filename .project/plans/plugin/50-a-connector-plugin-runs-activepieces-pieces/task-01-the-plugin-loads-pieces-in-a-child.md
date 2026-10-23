---
title: The plugin loads pieces in a child
status: todo
depends: []
layer: "connector-activepieces"
refs:
  - "[code://packages/webhook/package.json#L61-L73](../../../../packages/webhook/package.json#L61-L73) - the `ahpd` manifest to copy"
  - "[code://packages/webhook/src/plugin.ts#L38-L39](../../../../packages/webhook/src/plugin.ts#L38-L39) - `optionsSchema`, the pattern for `pieces`"
  - "[code://packages/sdk/src/types/plugin.ts#L1154](../../../../packages/sdk/src/types/plugin.ts#L1154) - `apply` may answer a promise"
  - "[code://package.json#L15](../../../../package.json#L15) - the build list, which gets the new package"
---

## Objective

`packages/connector-activepieces` is a plugin with a `pieces` option.
`apply` starts one child process, and the child loads each named piece and describes it as plain JSON.

## Files

- `CREATE: packages/connector-activepieces/package.json` - the manifest, with `contracts.adapters: ["ap-*"]` and `@activepieces/pieces-framework` at exactly `0.32.0`.
- `CREATE: packages/connector-activepieces/tsconfig.json` - as `packages/webhook/tsconfig.json`.
- `CREATE: packages/connector-activepieces/LICENSE` - MIT, as the other packages.
- `CREATE: packages/connector-activepieces/src/index.ts` - the plugin export.
- `CREATE: packages/connector-activepieces/src/plugin.ts` - `optionsSchema` and `apply`.
- `CREATE: packages/connector-activepieces/src/child.ts` - the child entry: the TLS pin, `describe` and the message loop.
- `CREATE: packages/connector-activepieces/src/wire.ts` - the message types between the plugin and the child.
- `UPDATE: package.json:15` - add `tsc -p packages/connector-activepieces` before the server.
- `CREATE: packages/connector-activepieces/test/child.test.ts` - the cases below.

## Steps

1. Copy the package layout of `packages/webhook`.
2. Declare `pieces` in `optionsSchema` as a list of package names, each starting with `@activepieces/piece-`.
3. In `child.ts`, replace `process.env` with a proxy that ignores a write or a delete of `NODE_TLS_REJECT_UNAUTHORIZED`.
4. Do this before the child requires any piece.
5. In `child.ts`, answer `describe` with the `auth` and the actions of each piece.
6. Find each piece as the exported object that has `_actions`.
7. Answer each prop as its `type`, `displayName`, `description`, `required` and static `options`, and drop its functions.
8. Answer a piece that fails to load as an error that names it, and keep the others.
9. In `apply`, fork `child.ts` with an IPC channel, and send `describe` with the `pieces` option.
10. Make the child exit when its IPC channel closes.
11. Report each piece error through the plugin's log, and keep loading.
12. Add the tests, and run the package tests.

## Validation

- `child.test.ts`: a piece that sets `NODE_TLS_REJECT_UNAUTHORIZED` to `"0"` leaves it unset in the child.
- `child.test.ts`: `describe` of a test piece answers its auth and its actions, with no function in the answer.
- `child.test.ts`: a package that is not installed answers an error, and the other pieces still load.
- `child.test.ts`: the child exits when the parent closes the channel.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume
