---
title: A handed plugin's skill is listed once
status: todo
depends: [task-01-the-copy-gets-a-claude-manifest.md]
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/session/customizations.ts#L79-L89](../../../../packages/agent-claude/src/session/customizations.ts#L79-L89) - handed plugins are left out, and `pluginOf`"
  - "[code://packages/agent-claude/src/session/customizations.ts#L147-L170](../../../../packages/agent-claude/src/session/customizations.ts#L147-L170) - the skills loop"
---

## Objective

agent-claude keeps the plugins that the host handed over as a separate list.
A skill whose prefix names one of them is not listed, because the host's entry for that plugin lists it.

## Files

- `UPDATE: packages/agent-claude/src/session/customizations.ts:79-89` - keep the handed plugins, and match a skill to one by its prefix.
- `UPDATE: packages/agent-claude/src/session/customizations.ts:147-170` - skip a skill and a command of a handed plugin.
- `UPDATE: packages/agent-claude/test/customizations.test.ts` - the skill of a handed plugin.

## Steps

1. Read which name the window sends when a person picks the skill, and record it in Resume.
2. Keep the reported plugins whose path is in `ours` as a second list.
3. Skip a skill or a command whose prefix names a plugin in that list.
4. Keep the name that the CLI runs where the window sends it.
5. Write the tests.
6. Set this task and the plan row to `implemented`.

## Validation

- A test: with a handed plugin named `vs-code-synced-data`, the skill `vs-code-synced-data:advisor` is in no container.
- A test: agent-claude lists a skill of any other plugin as before.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume
