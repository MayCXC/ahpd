---
title: A fallback id is a slug too
status: done
depends: [task-02-daemon-refuses-a-non-slug-name.md]
layer: "server"
refs:
  - "[code://packages/server/src/plugins.ts#L93-L101](../../../../packages/server/src/plugins.ts#L93-L101) - `unscoped` and `provisionalOf`, the fallback id"
  - "[code://packages/server/src/plugins.ts#L789-L792](../../../../packages/server/src/plugins.ts#L789-L792) - the slug check in `loadOne`"
---

## Objective

A module that exports no `name` takes a fallback id from the manifest's `name`, its file name or its spec.
A scoped fallback `@scope/name` becomes `scope-name`, so the package `@acme/y` is the plugin `acme-y`.
The loader checks every fallback id against the slug rule. When the id is still not a slug, the loader skips the plugin with the problem line of task 02.

## Files

- `UPDATE: packages/server/test/plugin-load.test.ts` - the cases below.
- `UPDATE: packages/agent-cofold/test/agent-cofold-plugin.test.ts:194` - the listed id of a cofold manifest with no `name` export is `ahpd-agent-cofold`.
- `UPDATE: packages/server/src/plugins.ts:93-101` - `unscoped`, and `provisionalOf` reads through it.
- `UPDATE: packages/server/src/plugins.ts:789-792` - `loadOne` checks the id, exported or fallback.
- `UPDATE: packages/sdk/src/types/plugin.ts:863-869` - `Plugin.name` names the fallback and its scope rule.
- `UPDATE: docs/plugins/PLUGINS.md` - the id section, the vault example, the route section and the listing example.

## Steps

1. Change the manifest case in `plugin-load.test.ts` to expect `acme-y`, from the load and from `pluginIdOf`.
2. Add a case: the loader skips a manifest name of `@acme/` and forty `x` characters, and does not call `apply`.
3. Add a case: the loader skips a file `My_Plugin.js` with no `name` export.
4. Change the cofold listing case to `ahpd-agent-cofold`.
5. Run the tests and see them fail.
6. Add `unscoped` and call it in `provisionalOf`.
7. In `loadOne`, check `ready.id` against `isRecordSlug` in place of the exported `name` alone.
8. Change the docs, then run the gates.

## Validation

- `plugin-load.test.ts` holds the three cases above.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- `pnpm exec vitest run packages/sdk packages/server packages/agent-claude packages/agent-acp packages/bot packages/webhook packages/computer packages/push` passes.

## Resume

- **Done:** 2026-10-14. The fallback id is unscoped and checked. `pluginIdOf` and the listing give the same id, because both read `provisionalOf`.
- **Departure:** one cofold test expected `@ahpd/agent-cofold` as a fallback id, not two. The other `@ahpd/agent-cofold` in that test is `row.module`, the package name, and it stays.
- **Kept:** `routePrefix` still encodes each segment. No id that loads holds `@` or `/` now, so the encoding has no effect.
- **Gates:** typecheck, boundary and schema pass. The test gate passes with 5099 tests, and agent-cofold, agent-pi and tunnel-devtunnel pass with 444 tests.
