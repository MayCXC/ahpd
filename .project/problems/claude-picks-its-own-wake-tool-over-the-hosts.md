---
title: claude picks its own wake tool over the host's
status: open
date: 2026-10-13
severity: minor
refs:
  - "[code://packages/sdk/src/tools/session.ts#L700-L730](../../packages/sdk/src/tools/session.ts#L700-L730) - the host's `schedule_wakeup`, whose wake survives a sleep and a restart"
  - "[code://packages/agent-claude/src/claude.ts#L320-L330](../../packages/agent-claude/src/claude.ts#L320-L330) - where the SDK takes `allowedTools` and `disallowedTools`"
---

## Symptom

A claude session asked to "call the schedule_wakeup tool" calls the CLI's own `ScheduleWakeup`, not the host's `mcp__ahp__schedule_wakeup`.
That wake lives in the claude process, so a daemon restart loses it.
The host tool is called only when the prompt names `mcp__ahp__schedule_wakeup`. It then needs a ToolSearch and an approval in `default` mode.

## Cause

Both tools are offered. The CLI's tool is loaded and the host tool is deferred, so the model takes the CLI's tool.
The approval comes from the CLI's permission mode for an MCP tool. The comment at `session.ts:722` speaks of the host's grant only.

## Impact

A wake that an agent schedules does not survive a daemon restart unless the agent picks the host tool.
A person sees an approval prompt for a wake, which the comment says does not happen.

## Workaround

Name `mcp__ahp__schedule_wakeup` in the prompt.

## Fix

- Add `ScheduleWakeup` to the `disallowedTools` that agent-claude passes, so the host tool is the only one.
- Or keep both and say in the host tool's description when to prefer it.
- Allow `mcp__ahp__schedule_wakeup` in `default` mode, or correct the comment.
