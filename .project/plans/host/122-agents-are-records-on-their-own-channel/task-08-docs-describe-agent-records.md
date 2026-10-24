---
title: The docs describe agent records
status: todo
depends: [task-07-presets-become-records.md]
layer: "docs"
refs:
  - "[code://docs/plugins/PLUGINS.md#L1331](../../../../docs/plugins/PLUGINS.md#L1331) - the part on agents and unloads"
---

## Objective

PLUGINS.md and the agent plugin READMEs say what an agent record and a kind are.
They also name the fields that only a host agent may set.

## Files

- `UPDATE: docs/plugins/PLUGINS.md` - add `registerAgentKind` and the channel `x-ahpd-agents`, and remove `presets`.
- `UPDATE: packages/agent-claude/README.md` - the kind, its template and its host-only fields.
- `UPDATE: packages/agent-acp/README.md` - the kind, its templates and its host-only fields.
- `UPDATE: packages/agent-cofold/README.md` - the kind and its fields.
- `UPDATE: packages/agent-pi/README.md` - the kind and its key variables.

## Steps

1. Describe the channel, its grants and its owners in PLUGINS.md.
2. Describe `registerAgentKind` and each field of `AgentKind` in PLUGINS.md.
3. Remove every `presets` example from the four READMEs.
4. Give each README one record example, with a `$secret` key.
5. Name the host-only fields and the key variables of each kind.

## Validation

- `rg -n "presets" docs packages/agent-*/README.md` finds no option that is gone.
- By hand, each README example puts with `x-ahpd-agents` with no error.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Files:** none yet.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** never cite another project.
