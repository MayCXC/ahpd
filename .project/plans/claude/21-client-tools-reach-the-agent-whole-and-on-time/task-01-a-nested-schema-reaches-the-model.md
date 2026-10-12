---
title: A nested schema reaches the model
status: todo
depends: []
layer: "packages/agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/clienttools.ts#L9-L25](../../../../packages/agent-claude/src/session/clienttools.ts#L9-L25) - `shaped()` and its comment"
  - "[code://packages/agent-claude/src/session/clienttools.ts#L59](../../../../packages/agent-claude/src/session/clienttools.ts#L59) - `contributed`, which builds the SDK server from the shapes"
  - npm://zod@^4.4.3 - `z.fromJSONSchema`
---

## Objective

A client tool's input schema reaches the model as the client wrote it: nested objects, arrays of objects, enums, required fields and descriptions.
A schema that zod cannot read reaches the model as a string, as all of them do now.

## Files

- `UPDATE: packages/agent-claude/src/session/clienttools.ts:9-25` - replace `shaped()` with a read through `z.fromJSONSchema`, and rewrite its comment.
- `UPDATE: packages/agent-claude/package.json` - raise the `zod` floor to the first version with `fromJSONSchema`, if `^4.4.3` does not have it.
- `CREATE: packages/agent-claude/test/agent-claude-contributed-schema.test.ts` - the cases below.

## Steps

1. Check the zod version that added `fromJSONSchema`, and raise the floor in `package.json` if it is above 4.4.3.
2. Read each property schema with `z.fromJSONSchema`.
3. Keep the property's `description` on the zod with `.describe()` when the read leaves it out.
4. Catch a property that `z.fromJSONSchema` throws on, and give `z.string()` for it.
5. Remove the old `shaped()` branches.
6. Rewrite the comment above the function to say what it reads and what it falls back to.

## Validation

- A nested object reaches the SDK server as an object with its required fields.
- An array of objects stays an array of objects.
- An enum stays an enum, and a description stays on its property.
- A schema that `z.fromJSONSchema` refuses becomes a string, and the other properties stay as they are.
- Each case reads the JSON Schema that the SDK server lists, not only the zod.
- `pnpm exec vitest run packages/agent-claude` passes.

## Resume
