---
title: The docs say how an action runs
status: todo
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
