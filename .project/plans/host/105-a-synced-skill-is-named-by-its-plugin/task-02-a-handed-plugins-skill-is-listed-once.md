---
title: A handed plugin's skill is listed once
status: done
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

- **Done so far:** built 2026-10-16. `customizationsOf` in `packages/agent-claude/src/session/customizations.ts` splits the plugins the CLI reported into two lists: `handed`, the ones whose `path` is in `ours`, and `reportedPlugins`, the rest. `handedOf` matches a name to one by the plugin's own name, as the CLI reported it. A skill of `reloadSkills()` whose name carries that prefix is skipped, and so is a command of one - the host's own entry for the copy is what lists both. Three tests in `packages/agent-claude/test/customizations.test.ts`: with a handed `vs-code-synced-data`, the skill `vs-code-synced-data:advisor` is in no container and is not moved to one either, its command leaves no container behind, and a skill of a plugin this host did not hand over is still attributed to it.
- **Next action:** build task 03.
- **Open questions:** none.
- **Watch out for:**
  - Step 1 was not run. It reads a live window, and this box has no session to read - the same wall task 01 step 1 hit. What the window sends is answered by the code instead: a picked item sends back the `insertText` and `_meta.command` the host itself listed, from `completions` in `packages/sdk/src/host/sessionmethods.ts`, so the name that comes back is the one on the host's own entry.
  - Step 4 has nothing of its own to act on in this file. The skip matches on the plugin's name exactly as the CLI reported it, which is the name the CLI runs a skill by, and no name is rewritten anywhere. The name the window shows for the skill is the host's entry's, which `partsOf` reads off the file as `advisor` rather than `vs-code-synced-data:advisor`.
  - An agent of a handed plugin is not skipped, because this task names a skill and a command. A bundle with an `agents/` folder would still be listed twice: once under the `agents` directory container as `<the CLI's name>:<the agent>`, and once among the host's entry's children. The task does not decide this.
  - `packages/sdk/test/fixtures/wire.jsonl` is dirty from the sdk suite. Restore it with `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
