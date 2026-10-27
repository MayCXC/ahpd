---
title: Every schema entry point checks for gaps
status: todo
depends: []
layer: "sdk, server, docs"
refs:
  - "[code://packages/sdk/src/plugins/validate.ts#L88](../../../../packages/sdk/src/plugins/validate.ts#L88) - `checkAgent`"
  - "[code://packages/sdk/src/plugins/validate.ts#L549](../../../../packages/sdk/src/plugins/validate.ts#L549) - `checkTriggerType`"
  - "[code://packages/sdk/src/plugins/validate.ts#L609](../../../../packages/sdk/src/plugins/validate.ts#L609) - `checkAdapter`"
  - "[code://packages/sdk/src/plugins/validate.ts#L664](../../../../packages/sdk/src/plugins/validate.ts#L664) - `checkEngine`"
  - "[code://packages/sdk/src/plugins/plugins.ts#L1347](../../../../packages/sdk/src/plugins/plugins.ts#L1347) - `registerSessionConfig`"
  - "[code://packages/server/src/plugins.ts#L1987](../../../../packages/server/src/plugins.ts#L1987) - where a manifest's `optionsSchema` is kept"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1500](../../../../packages/sdk/src/host/sessionmethods.ts#L1500) - a backend's session config schema on its way to a client"
---

## Objective

The host finds each gap in a schema that a plugin gives it, at every place a plugin can give one.
Each gap is a problem line that names the plugin and the path, and the load continues.

## Files

- `CREATE: packages/sdk/src/plugins/schemagaps.ts` - `schemaGaps(schema)`, which returns each gap as a path and a reason.
- `UPDATE: packages/sdk/src/plugins/validate.ts:88` - check the schema that `checkAgent` takes.
- `UPDATE: packages/sdk/src/plugins/validate.ts:549` - check `configSchema` in `checkTriggerType`.
- `UPDATE: packages/sdk/src/plugins/validate.ts:609` - check the adapter's `schema` and each capability's `input` in `checkAdapter`.
- `UPDATE: packages/sdk/src/plugins/validate.ts:664` - check the engine's `schema` in `checkEngine`.
- `UPDATE: packages/sdk/src/plugins/plugins.ts:1347` - check the property that `registerSessionConfig` takes.
- `UPDATE: packages/server/src/plugins.ts:1987` - check a manifest's `optionsSchema` before the host keeps it.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:1500` - check each backend's session config schema the first time a client asks for it.
- `CREATE: packages/sdk/test/schema-gaps.test.ts` - cases for each gap, for each union, and for `{}`.
- `UPDATE: docs/plugins/PLUGINS.md` - say what a schema must name, and that a gap is a problem line.
- `UPDATE: CHANGELOG.md` - the new problem line.

## Steps

1. Write `schemaGaps` to walk `properties`, `additionalProperties`, `items` and each branch of `oneOf` and `anyOf`.
2. Report an object with neither `properties` nor an `additionalProperties` schema.
3. Report an array with no `items`.
4. Report a field with keywords and no `type`, `enum`, `const` or union.
5. Accept `{}` as a value of any JSON shape.
6. Make each check return its gaps beside its result, so that the caller writes the problem line.
7. Write each problem line as `<plugin>: <where> <path>: <gap>`, such as `agent-claude: engine claude env: object with no properties`.
8. Report the gaps of a backend's session config schema once for each backend, not at each call.
9. Never refuse a load, a registration or a call because of a gap.
10. Write the test cases, the docs and the changelog line.

## Validation

- The cases in `schema-gaps.test.ts` pass.
- A test plugin that registers `{ type: 'object' }` as an engine schema loads, and its problem line names the path.
- `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test` passes.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Files:** none yet.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** the first-party plugins have gaps until tasks 02, 03 and 04 are done, so a test daemon prints their problem lines.
