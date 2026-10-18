---
title: A rule part carries its frontmatter
status: implemented
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

- **Done so far:** built 2026-10-16. `rulesIn` reads each rule file once, so a rule part carries `description`, `alwaysApply` and `globs` off its frontmatter. The part is built in one place, and `rulesOf(dir, uri)` hands each rule's body over beside its part, out of the wire shape, for task 02.
- **Files:** `packages/sdk/src/pluginparts.ts`, `packages/sdk/test/pluginparts.test.ts`, and this task's two rows in `plan.md`. Nothing is committed, and `packages/sdk/test/fixtures/wire.jsonl` is left dirty by the vitest run.
- **Next action:** build task 02.
- **Open questions:** none.
- **Watch out for:** one choice the plan did not make:
  - The frontmatter is read by a small reader in `pluginparts.ts`: the two `---` lines, a `key: value` at the left margin, a quoted text, a `true` or `false`, and a list written between brackets or down a line at a time. Step 1 says to reuse the parser `pluginparts.ts` reads other frontmatter with, and it reads none: the host's YAML parser is `@cofold/yaml` in `packages/server`, and `.project/rules/the-sdk-depends-only-on-the-protocol.md` keeps any second package out of the sdk.
  - A rule whose frontmatter never closes is the bad frontmatter of the test. Nothing can be read out of it, so it carries no field and its whole text is the body.
