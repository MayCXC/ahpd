---
title: The first-party plugin schemas have no gap
status: todo
depends:
  - task-01-every-schema-entry-point-checks.md
layer: "agent-acp, agent-cofold, computer, activepieces"
refs:
  - "[code://packages/agent-acp/src/plugin.ts#L82-L92](../../../../packages/agent-acp/src/plugin.ts#L82-L92) - `machine`, whose fields have no type"
  - "[code://packages/agent-cofold/package.json#L130-L136](../../../../packages/agent-cofold/package.json#L130-L136) - `adapter` and `policy` in the options schema"
  - "[code://packages/agent-cofold/src/plugin.ts#L159](../../../../packages/agent-cofold/src/plugin.ts#L159) - `policy` among the fields the engine schema copies"
  - "[code://packages/computer/package.json#L132-L150](../../../../packages/computer/package.json#L132-L150) - `profiles`, whose fields have no type"
  - "[code://packages/activepieces/src/mapping.ts#L76-L82](../../../../packages/activepieces/src/mapping.ts#L76-L82) - ARRAY, OBJECT, JSON and DYNAMIC props"
  - "[code://packages/activepieces/src/wire.ts#L28-L39](../../../../packages/activepieces/src/wire.ts#L28-L39) - `PropDescription`, which has no sub-props"
  - "file:///github/cofold/packages/agents/src/types/agent.ts - `Policy` is a `decide` function, and `ModelAdapter` is an object of methods"
---

## Objective

`schemaGaps` finds no gap in any schema that agent-acp, agent-cofold, computer and activepieces register.

## Files

- `UPDATE: packages/agent-acp/src/plugin.ts:82-92` - give each `machine` field its type, as its description already says.
- `UPDATE: packages/agent-cofold/package.json:130-136` - remove `adapter` and `policy` from the options schema.
- `UPDATE: packages/agent-cofold/src/plugin.ts:159` - remove `policy` from the fields the engine schema copies.
- `UPDATE: packages/computer/package.json:132-150` - give each `profiles` field its type, as its description already says.
- `UPDATE: packages/activepieces/src/wire.ts:28-39` - add the sub-props of an ARRAY prop to `PropDescription`.
- `UPDATE: packages/activepieces/src/child.ts` - send the sub-props of an ARRAY prop when it describes a piece.
- `UPDATE: packages/activepieces/src/mapping.ts:76-82` - give each ARRAY, OBJECT, JSON and DYNAMIC prop a full schema.
- `UPDATE: packages/activepieces/test` - cases for each of the four prop types.
- `UPDATE: packages/agent-cofold/README.md` - say that `adapter` and `policy` are options for an embedder only.
- `UPDATE: CHANGELOG.md` - the schema changes.

## Steps

1. Write `machine.env` values as `oneOf`: a string, `{ fromEnv }` and `{ "$secret" }`, as the description says.
2. Write `copy` as an array of `{ source, target }`, and `seed` as an array of `{ source, target, keep, drop }`.
3. Write `part` and `state` as strings.
4. Remove `adapter` and `policy` from the cofold options schema and from the engine schema.
5. Keep `adapter` and `policy` in `CofoldOptions`, so an embedder still passes them in code.
6. Give each computer profile field the type its description names.
7. Make the child send an ARRAY prop's own props.
8. Map an ARRAY prop with props to an array of objects with those props.
9. Map an ARRAY prop with no props to an array of strings.
10. Map an OBJECT or DYNAMIC prop to an object with `additionalProperties: {}`.
11. Map a JSON prop to `{}`.
12. Add the test cases, the README line and the changelog line.

## Validation

- `schemaGaps` finds no gap in the schemas these four plugins register.
- An activepieces action with an ARRAY prop still runs with the value it ran with before.
- A cofold embedder that passes `adapter` and `policy` in code still uses them.
- `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test` passes.
- By hand: ahpw draws a computer profile and an Airtable `create_record` input as fields.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Files:** none yet.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** the cofold options schema is not closed, so an embedder's `adapter` still passes the check after the field leaves the schema.
