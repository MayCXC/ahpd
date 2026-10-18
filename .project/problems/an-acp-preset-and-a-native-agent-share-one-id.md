---
title: An ACP preset and a native agent share one id, and the second to load is dropped
status: open
date: 2026-10-18
severity: minor
refs:
  - "[code://packages/sdk/src/plugins.ts#L352-L364](../../packages/sdk/src/plugins.ts#L352-L364) - the first registration keeps an agent id and the second is dropped with `agent provider clash:`"
  - "[code://packages/agent-pi/src/plugin.ts#L33](../../packages/agent-pi/src/plugin.ts#L33) - agent-pi registers the id `pi`"
  - "[code://packages/agent-acp/src/presets.ts#L154-L163](../../packages/agent-acp/src/presets.ts#L154-L163) - the shipped ACP preset `pi`, which registers the same id"
---

## Symptom

A host that loads `@ahpd/agent-pi` and `@ahpd/agent-acp` with the shipped `pi` preset registers the id `pi` twice.
The plugin that loads second loses the id, and its agent is not offered.
Found while checking container/05 p9 task 06, 2026-10-18: the ACP preset had to be keyed `pi-acp` with its `command` written out, so both agents were offered.

## Cause

- An agent's id is the provider id a client names, and it is also the session URI's scheme, as in `pi:/<id>`.
- A preset key is that id, and taking a shipped preset means using its name as the key.
- Nothing in the id says which plugin or which bridge serves the agent, so two ways to run one agent claim one name.

## Impact

A person who installs both cannot take the shipped `pi` preset by name.
They must write a key of their own and copy the preset's command, and the preset's `machine` block does not come with it.
Sessions recorded under `pi:/` belong to whichever plugin won the id.
The same clash is waiting for any other agent that has both a native plugin and an ACP preset.

## Workaround

Key the ACP preset under another id and write its `command`, for example `"pi-acp": { "command": "pi-acp" }`.

## Fix

Review the id format before more agents ship both ways.
- A preset key that takes a shipped preset by a separate field, such as `"pi-acp": { "preset": "pi" }`, so the id and the preset are not one string.
- Or an id that names its bridge, such as `acp.pi`, spelled and parsed in one place as machine ids are.
Softov chooses between the two, or another format.
