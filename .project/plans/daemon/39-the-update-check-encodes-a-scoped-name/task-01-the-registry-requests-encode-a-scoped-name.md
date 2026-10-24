---
title: The registry requests encode a scoped name
status: done
depends: []
layer: server
refs:
  - "[code://packages/server/src/update.ts#L123](../../../../packages/server/src/update.ts#L123) - `refreshUpdate`"
  - "[code://packages/server/src/selfupdate.ts#L125-L131](../../../../packages/server/src/selfupdate.ts#L125-L131) - `latestOnNpm`"
  - "[code://packages/server/src/install.ts#L257](../../../../packages/server/src/install.ts#L257) - the packument request"
  - "[code://packages/server/src/install.ts#L593](../../../../packages/server/src/install.ts#L593) - the manifest request"
---

## Objective

Every registry request sends a scoped name as `@scope%2fname`, as npm does.

## Files

- `UPDATE: packages/server/src/update.ts:82-123` - a helper that gives a package name as a registry path, used by `refreshUpdate`.
- `UPDATE: packages/server/src/selfupdate.ts:125-131` - `latestOnNpm` uses the helper.
- `UPDATE: packages/server/src/install.ts:257` - the packument request uses the helper.
- `UPDATE: packages/server/src/install.ts:593` - the manifest request uses the helper.
- `UPDATE: packages/server/test/update.test.ts:142-146` - the case asserts the encoded path.
- `UPDATE: packages/server/test/server-update.test.ts:62` - the local registry answers only the encoded path.
- `UPDATE: packages/server/test/host-update-method.test.ts` - a case that asserts the encoded path for `x-ahpd/update` with no version.

## Steps

1. Add an exported helper in `update.ts` that replaces the first `/` of a scoped name with `%2f`.
2. Leave a name without a scope as it is.
3. Use the helper in `refreshUpdate` and in `latestOnNpm`.
4. Use the helper in the two requests in `install.ts`, and remove their own `replace`.
5. Change the case in `update.test.ts` to assert `/-/package/@ahpd%2fserver/dist-tags`.
6. Add a case for the helper with a scoped name and with a plain name.
7. Make the local registry in `server-update.test.ts` answer 404 to the unencoded path.
8. Add a case in `host-update-method.test.ts` that asserts the encoded path.
9. Run the server tests, and set this task and the plan row to `implemented`.

## Validation

- The tests in `update.test.ts`, `server-update.test.ts`, `host-update-method.test.ts` and `plugin-install.test.ts` pass.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** `registryPath` is exported from `update.ts`. A scoped name has the slash after its scope replaced with `%2f`; a name without a scope comes back as it is. `refreshUpdate`, `latestOnNpm` and the two requests in `install.ts` use it, and their own `replace` is gone. `update.test.ts` asserts `/-/package/@ahpd%2fserver/dist-tags` and has a `registryPath` case for a scoped and a plain name. The local registry in `server-update.test.ts` answers only the encoded path, so the unencoded one is a 404. `host-update-method.test.ts` has a case that records the URL `x-ahpd/update` with no version asks, and it is the encoded path. The four server files passed 128 of 128. `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` passed, and the full suite passed 6474 tests with 29 skipped.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** `plugin-install.test.ts` stubs the packument path. Its paths are unchanged, because the helper sends the same form the file already had.
