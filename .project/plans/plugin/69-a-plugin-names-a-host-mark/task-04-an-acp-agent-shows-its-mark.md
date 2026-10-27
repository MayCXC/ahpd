---
title: An ACP agent shows its vendor's mark
status: implemented
depends: [task-01-the-host-resolves-a-mark.md]
layer: "sdk, server, agent-acp"
refs:
  - "[code://packages/sdk/src/types/agents.ts#L28-L40](../../../../packages/sdk/src/types/agents.ts#L28-L40) - `AgentTemplate`, with one `icon`"
  - "[code://packages/sdk/src/agents/channel.ts#L265](../../../../packages/sdk/src/agents/channel.ts#L265) - the agents channel row, which sends a record's own `icon`"
  - "[code://packages/sdk/src/agents/engines.ts#L56-L66](../../../../packages/sdk/src/agents/engines.ts#L56-L66) - the engines row, which sends the templates whole"
  - "[code://packages/server/src/plugins.ts#L1515-L1521](../../../../packages/server/src/plugins.ts#L1515-L1521) - the pattern: adapter icons are resolved at load"
  - "[code://packages/agent-acp/src/presets.ts#L272-L291](../../../../packages/agent-acp/src/presets.ts#L272-L291) - `templates`, which give an ACP row no icon"
  - "[code://packages/server/src/agents/migrate.ts#L146-L170](../../../../packages/server/src/agents/migrate.ts#L146-L170) - the move from presets, which wrote records with no icon"
---

## Objective

Each ACP template names its vendor's mark, and the host sends it as `data:` icons, light and dark.
A record with no icon is sent with the icons of its engine's template whose `command` matches.

## Files

- `UPDATE: packages/sdk/src/types/agents.ts:28-40` - add `icons?: Icon[]` to `AgentTemplate`, the resolved form a client reads.
- `UPDATE: packages/server/src/plugins.ts:1515-1521` - resolve each engine template's `icon` at load into `icons`, as adapter icons are.
- `UPDATE: packages/sdk/src/agents/channel.ts:265` - add `icons` to the row: the record's own icon, else its template's icons.
- `UPDATE: packages/agent-acp/src/presets.ts:272-291` - give each template with a mark `icon: { src: "mark:<name>" }`.
- `CREATE: packages/server/icons/<name>.svg` - one mark for each ACP row that has one, with a dark file where the mark is dark.
- `UPDATE: packages/sdk/test/agents-channel.test.ts` - cases for a record with its own icon, one that takes its template's, and one that matches no template.
- `UPDATE: packages/server/test/plugin-icons.test.ts` - a case for a template whose `mark:` icon is resolved at load.
- `UPDATE: .project/pending/plugin-58-icon-curation.md` - one row for each ACP mark, and one row that asks Softov for the dsh mark.

## Steps

1. Find a mark for each ACP row in `presets.ts`, from codex to omp.
2. Take each mark from Simple Icons, else from the vendor's own published mark, and record the source and licence.
3. Reuse a mark the host ships already, such as `openai` for codex, and do not copy it.
4. Add a dark file for a mark that does not read on a dark background.
5. Leave a row with no mark without an icon, and leave dsh for Softov.
6. Add `icons?: Icon[]` to `AgentTemplate`.
7. In the loader, resolve each engine template's `icon` with `resolveIcons` into `icons`, against the plugin's package.
8. In the agents row, send `icons` as `[icon]` when the record has one.
9. Else send the icons of the engine's template whose `config.command` equals the record's `config.command`.
10. Keep `icon` on the row as it is, so a client that reads it is not changed.
11. Add the test cases, and the curation rows.

## Validation

- The new agents channel and loader cases pass.
- `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test` passes.
- By hand: the agents channel row of Softov's Codex record carries the OpenAI icons, with no edit to the record.

## Resume

- **Done so far:** `AgentTemplate` in `packages/sdk/src/types/agents.ts` carries `icons?: Icon[]`, the resolved form a client reads. The loader in `packages/server/src/plugins.ts` resolves each engine template's `icon` with `resolveIcons` and `fetchIcons`, against the plugin's package, and sets `icons`; the template keeps `icon`. The agents row in `packages/sdk/src/agents/channel.ts` sends `icons` as `[icon]` when the record has its own icon, otherwise the icons of the engine's template whose `config.command` equals the record's, and leaves the key out when neither applies. `packages/agent-acp/src/presets.ts` has a `MARKS` table and each template with a mark carries `icon: { src: "mark:<name>" }`: codex reuses `openai`, and gemini, copilot, opencode, cursor, qwen and cline name their own. The host ships `gemini.svg`, `copilot.svg` with `copilot-dark.svg`, `opencode.svg` with `opencode-dark.svg`, `cursor.svg` with `cursor-dark.svg`, `qwen.svg`, and `cline.svg` with `cline-dark.svg`, each from Simple Icons under CC0 1.0. `agents-channel.test.ts` has three new cases: a record with its own icon, one that takes its template's by command, and one that matches no template. `plugin-icons.test.ts` has a case for a template's mark resolved at load.
- **Next action:** Softov adds the three by-hand checks, which need his daemon and ahpw.
- **Files:** `packages/sdk/src/types/agents.ts`, `packages/server/src/plugins.ts`, `packages/sdk/src/agents/channel.ts`, `packages/agent-acp/src/presets.ts`, `packages/server/icons/{gemini,copilot,copilot-dark,opencode,opencode-dark,cursor,cursor-dark,qwen,cline,cline-dark}.svg`, `packages/sdk/test/agents-channel.test.ts`, `packages/server/test/plugin-icons.test.ts`, `docs/plugins/PLUGINS.md`, `.project/pending/plugin-58-icon-curation.md`, this task file.
- **Open questions:** the mark for dsh, and marks for kilo, goose, pi, devin, amp and omp, for which no clear source and licence was found.
- **Departures:** `docs/plugins/PLUGINS.md` gained a sentence about a template's `icons` and a paragraph about the agents row's `icons`, which the Files list does not name. Kilo, goose, pi, devin, amp and omp show the engine's icon, and dsh has a curation row that asks for its mark.
- **Watch out for:** a record matches a template only when its own `config.command` is a string equal to the template's. A record whose command was edited keeps the engine's icon.
