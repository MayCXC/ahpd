---
title: A rule part carries its frontmatter
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/pluginparts.ts#L181-L185](../../../../packages/sdk/src/pluginparts.ts#L181-L185) - `rulesIn`"
  - "[code://packages/sdk/src/pluginparts.ts#L328-L333](../../../../packages/sdk/src/pluginparts.ts#L328-L333) - `part`"
  - "file:///github/agent-host-protocol/types/channels-session/state.ts#L1105-L1131 - `RuleCustomization`"
---

## Objective

A rule part carries `description`, `alwaysApply` and `globs` from its file's frontmatter.
The host also keeps the rule's body for task 02.

## Files

- `UPDATE: packages/sdk/src/pluginparts.ts:181-185` - `rulesIn` reads each rule file once.
- `UPDATE: packages/sdk/src/pluginparts.ts:328-333` - a rule part gets the three fields of `RuleCustomization`.
- `UPDATE: packages/sdk/test/pluginparts.test.ts` - a rule with frontmatter, a rule without it, and a bad frontmatter.

## Steps

1. Read how `pluginparts.ts` reads other frontmatter, and reuse that parser.
2. Read the frontmatter of each rule file found by `rulesIn`.
3. Add `description`, `alwaysApply` and `globs` to the rule part when the file has them.
4. Keep the body of the rule beside the part, out of the wire shape.
5. Treat a rule with a bad frontmatter as a rule without one.
6. Write the tests.
7. Set this task and the plan row to `implemented`.

## Validation

- `pluginparts.test.ts`: a `.mdc` file with `alwaysApply: true` gives a part with `alwaysApply: true`.
- `pluginparts.test.ts`: a `.instructions.md` file with no frontmatter gives a part with no new field.
- The schema gate passes on the new part shape.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume
