---
title: A profile may have its machine clone from a public origin
status: done
depends: [task-03-the-code-arrives-by-clone.md]
layer: "computer"
refs:
  - "[code://packages/computer/src/manifest.ts#L36-L218](../../../../packages/computer/src/manifest.ts#L36-L218) - `Profile`, which gains `code`"
  - "[code://packages/computer/src/plugin.ts#L99-L169](../../../../packages/computer/src/plugin.ts#L99-L169) - `profilesOf`, where a profile's fields are read"
---

## Objective

A profile on another Docker with `code: "clone"` has its machine fetch the session's branch from its `origin` remote, by its https form.
The machine holds no ssh key and no token, so only a public repository can be fetched; private repositories are in [deferred.md](deferred.md).
The default stays `code: "bundle"` (task 03); the way back is host/67's bring-back, the same for both.

## Files

- `UPDATE: packages/computer/src/manifest.ts:36-218` - `Profile.code?: 'bundle' | 'clone'`, documented.
- `UPDATE: packages/computer/src/plugin.ts:99-169` - read `code`, and fail the load on a value that is not `bundle` or `clone`.
- `UPDATE: packages/computer/src/clone.ts` - `codeRouteOf` picks the route, and `httpsOf` gives an ssh origin's https form.
- `UPDATE: packages/computer/src/runtime.ts` - `fetchedInto`, the `clone` route, beside `bundledInto`.
- `UPDATE: packages/computer/test/computer-disposable.test.ts` - the cases below.

## Steps

1. Read `code` in one place, `codeRouteOf(profile)`, which answers `bundle` when it is absent.
2. Set the machine's `origin` to the https form of the tree's `origin`.
3. Refuse a branch that origin does not have, and say that `code: "bundle"` brings it without a push.
4. Fetch the branch into the seed ref, and let the bundle route's checkout and bring-back take it from there.

## Validation

- With the fake Docker, a `code: "clone"` profile fetches the https form of an ssh origin.
- That create sends no bundle.
- The create refuses a branch that origin does not have, and removes the machine.
- A profile with no `code` runs task 03's bundle route unchanged.
- By hand on dev02 in task 05, once each way.

## Resume

- **Done:** 2026-10-30. `codeRouteOf` in [`clone.ts`](../../../../packages/computer/src/clone.ts) picks the route, and `seedGit` calls `bundledInto` or `fetchedInto`.
- **Departure:** the `clone` route is a fetch, not `git clone`. It runs `git ls-remote --exit-code origin refs/heads/<branch>`, then `git fetch origin +refs/heads/<branch>:refs/ahpd/seed` in the machine's own git directory. The checkout and bring-back are then the bundle route's, unchanged.
- **Departure:** `code` takes `bundle` or `clone`, and any other value fails the load, as `gitGuard` does.
- **Departure:** no `gitCredential`. Everything in the machine can read a key or token there. So the machine fetches by https with none, and private repositories wait. Softov chose this on 2026-10-30.
- **Tests:** two in [`computer-disposable.test.ts`](../../../../packages/computer/test/computer-disposable.test.ts), `httpsOf` in [`computer-far-git.test.ts`](../../../../packages/computer/test/computer-far-git.test.ts), and `EVERY_FIELD` in [`computer-options-schema.test.ts`](../../../../packages/computer/test/computer-options-schema.test.ts) has `code`. Task 03's bundle tests pass unchanged.
