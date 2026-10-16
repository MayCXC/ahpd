---
title: Users, teams, projects, roles, policies, computers and usage get typed channels and commands - implemented
date: 2026-10-11
refs:
  - git://796ac45 - the last review fix; the builds are da923f3, 4931409, 2e1803f and 046a089, and the review fixes are 02a6f20, 5f85e17 and 796ac45
---

A client reads users, teams, projects, roles, policies and computers as typed lists, and it hears each change.
It changes them and reads usage through typed `x-` commands.
The resource schemes stay as they are.

## What was built

- [p1](../81-p1-the-host-serves-x-commands/implemented.md) - the host serves `x-` commands, and a plugin registers one with `registerMethod`.
- [p2](../81-p2-people-and-policies-are-channels/implemented.md) - users, teams, projects, roles and policies are channels, with `put` and `remove` commands.
- [p3](../81-p3-usage-is-read-through-commands/implemented.md) - usage is read through five commands.
- [p4](../81-p4-computers-are-a-channel/implemented.md) - computers are a channel, with five commands.

## Verified

- Each child's `implemented.md` lists its tests.
- Reviewed on 2026-10-11; `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/bot packages/sdk packages/server` pass on main at 0fcd7ad (3705 cases).

## Departures from the plan

- Each child's `implemented.md` lists its departures.

## Left for later

- The ahpapp half and a watch on the policy store - see [deferred.md](deferred.md).
