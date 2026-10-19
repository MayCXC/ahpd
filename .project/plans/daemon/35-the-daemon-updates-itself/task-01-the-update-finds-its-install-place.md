---
title: The update finds its install place
status: todo
depends: []
layer: server
refs:
  - "[code://packages/server/src/version.ts#L20-L36](../../../../packages/server/src/version.ts#L20-L36) - `manifest`, which walks up from `import.meta.url` to the package root"
  - "[code://packages/server/src/install.ts#L86-L101](../../../../packages/server/src/install.ts#L86-L101) - `launch`, how npm is run on each platform"
---

## Objective

`installPlace()` says where the running `@ahpd/server` is installed and how npm reaches it, or why it cannot update it.

## Files

- `CREATE: packages/server/src/selfupdate.ts` - `installPlace()` and the `Place` type, `{kind: 'global' | 'prefix', prefix}`.
- `UPDATE: packages/server/src/version.ts:20-36` - export the package root that `manifest` finds, so `installPlace` does not walk a second time.
- `CREATE: packages/server/test/selfupdate-place.test.ts` - the cases below, on folders the test makes.

## Steps

1. Write the tests first.
2. Export the package root from `version.ts`.
3. Refuse a root whose real path differs from its path, because that is a linked package.
4. Refuse a root that is not in a folder named `node_modules/@ahpd`, because that is a checkout.
5. Answer `global` with `<prefix>` for `<prefix>/lib/node_modules/@ahpd/server` on Linux and macOS.
6. Answer `global` with `<prefix>` for `<prefix>/node_modules/@ahpd/server` on Windows when `<prefix>` has no `package.json`.
7. Answer `prefix` with `<dir>` for `<dir>/node_modules/@ahpd/server` when `<dir>/package.json` exists.
8. Refuse with one sentence that names the root and says to update by hand.
9. Set this task and the plan row to `implemented`.

## Validation

- A test for each answer: global on POSIX, global on Windows, a prefix install, a link and a checkout.
- The refusal names the root and contains no path outside it.
- `pnpm -s build`, `pnpm -s typecheck` and the server vitest suite pass.

## Resume
