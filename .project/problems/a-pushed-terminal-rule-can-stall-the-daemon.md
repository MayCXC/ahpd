---
title: A terminal rule a member pushes can stall the daemon
status: open
date: 2026-10-20
severity: major
blocks:
  - plans/host/100-p2-a-session-gets-its-owners-command-check/plan.md
refs:
  - "[code://packages/sdk/src/host/gate.ts#L347-L353](../../packages/sdk/src/host/gate.ts#L347-L353) - `terminalAutoApproveRules` is per connection, so a push needs no grant"
  - "[code://packages/sdk/src/commandautoapprover.ts#L450-L463](../../packages/sdk/src/commandautoapprover.ts#L450-L463) - a `/.../` key becomes a `RegExp` with no limit on its cost"
  - "[code://packages/sdk/src/commandautoapprover.ts#L522-L528](../../packages/sdk/src/commandautoapprover.ts#L522-L528) - each command is matched on the daemon's main thread"
  - "[code://packages/sdk/src/host/spawn.ts#L925-L950](../../packages/sdk/src/host/spawn.ts#L925-L950) - `getAutoApproval` reads the pushed rules"
---

## Symptom

A signed-in member pushes `terminalAutoApproveRules` with the key `/(a+)+$/`.
Their agent then runs a command such as `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!`.
The match does not end, and the daemon answers nobody while it runs.
In Node, the same expression takes 209 ms on 20 characters, 432 ms on 24 and 1701 ms on 26.

## Cause

A rule key written `/.../` is compiled as written.
`leadsToEndlessLoop` catches an expression that matches the empty string forever, but not one that backtracks.
The match runs on the main thread with no time limit.

## Impact

Any member who can sign in can stop the daemon for every person on the host, from their own session.
VS Code reads the same rules, but there one window has one user, so a slow rule stalls only that user.

## Workaround

None.

## Fix

- A pushed `/.../` key needs `config:change`, and a plain key needs no grant, as now.
- The match runs with a time limit, in a worker or with a linear-time engine, which is a new dependency.
- A pushed key that is not a plain prefix is refused for a member, and allowed for the daemon's own configuration.
