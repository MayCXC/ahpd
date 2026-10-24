---
title: The docs say how an action runs
status: done
depends:
  - task-03-an-action-is-a-host-tool.md
  - task-04-a-bot-binds-its-connectors.md
layer: "docs"
refs:
  - "[code://docs/plugins/PLUGINS.md#L500-L540](../../../../docs/plugins/PLUGINS.md#L500-L540) - \"An adapter of your own\""
  - "[code://docs/plugins/BOTS.md#L7](../../../../docs/plugins/BOTS.md#L7) - \"The record\""
  - "[code://.project/specs/host-tools.md](../../../../.project/specs/host-tools.md) - the host tools spec"
  - "[code://.project/specs/bots.md](../../../../.project/specs/bots.md) - the bots spec"
---

## Objective

The docs and the specs say how an action becomes a tool, how a binding works, and what each call checks.

## Files

- `UPDATE: docs/plugins/PLUGINS.md:500-540` - `run`, the tool name, and the bindings.
- `UPDATE: docs/plugins/BOTS.md` - the `connectors` field.
- `UPDATE: .project/specs/host-tools.md` - a scenario for an action tool.
- `UPDATE: .project/specs/bots.md` - a scenario for a bot with bindings.
- `UPDATE: CHANGELOG.md` - a connector action runs as a tool.

## Steps

1. In `PLUGINS.md`, add `run` to the adapter example, with one `action` capability.
2. Add a short section on the tool name, the `connectors` key, and the single binding.
3. List the four checks that each call makes.
4. In `BOTS.md`, add `connectors` to the record table.
5. Add one scenario to each spec.
6. Add a changelog line.
7. Set each task and the plan row to `implemented`.

## Validation

- `node /home/softov/.claude/skills/do-spec/scripts/lint-prose.mjs` passes on the changed specs.
- Each new doc sentence matches the code of tasks 01 to 04.

## Resume

- **Done so far:** every step, 1 to 7.
  - `docs/plugins/PLUGINS.md` has a `send_message` `action` capability beside the receive one in the adapter example, and a `run` that answers it. The `capabilities` bullet says an `action` is the one type the host runs; a `run` bullet says what it is handed and what it answers; `registerBindings` is a row in the register table; and the new section "An action offered as a tool" says the tool name, the `connectors` config key and the bot's field, the one-binding and the enum shapes, and the four checks of each call.
  - `docs/plugins/BOTS.md` has the `connectors` row in the record table, and says which bodies are refused.
  - `.project/specs/host-tools.md` has the scenario "An action runs as a tool", and its `covers` names `connectors/actions.ts` and `connectors/bindings.ts`. `.project/specs/bots.md` has "A bot's connectors".
  - `CHANGELOG.md` has one line under Plugins and connectors and one under Bots, at 0.14.0 unreleased.
  - `.project/plans/index.md` has row 118 as active with the open question, and the next free host number as 119.
  - The prose linter passes on the two changed specs.
- **Next action:** the plan's final checks and its Resume state.
- **Files:** `docs/plugins/PLUGINS.md`, `docs/plugins/BOTS.md`, `.project/specs/host-tools.md`, `.project/specs/bots.md`, `CHANGELOG.md`, `.project/plans/index.md`.
- **Open questions:** none of its own; the plan's is task 04's, and the index row names it.
- **Departures:** the Files list does not name `.project/plans/index.md`, which step 7 and the plan's checklist need.


## Resume
