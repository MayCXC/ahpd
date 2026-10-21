---
title: The registry requests encode a scoped name
status: todo
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

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** `plugin-install.test.ts` stubs the packument path. Keep its paths as they are, because the helper sends the same form.
