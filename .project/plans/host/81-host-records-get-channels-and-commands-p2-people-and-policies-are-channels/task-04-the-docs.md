---
title: The docs describe the people and policy channels and commands
status: done
depends: [task-03-the-daemon-serves-the-five.md]
layer: "docs"
refs:
  - "[code://docs/USERS.md](../../../../docs/USERS.md) - the people schemes"
  - "[code://docs/POLICY.md](../../../../docs/POLICY.md) - the policy scheme"
---

## Objective

`USERS.md` and `POLICY.md` name each channel and command, and say that the resource schemes stay.

## Files

- `UPDATE: docs/USERS.md` - the four channels, their commands, and the own-record rule.
- `UPDATE: docs/POLICY.md` - the policy channel, its commands, and that a hand edit reaches no channel.

## Steps

1. Add a section to each file in the file's own style.
2. Show one snapshot and one action for each file.
3. Say which grant each channel and command needs.
4. Say that a hand edit to a policy file reaches no channel.

## Validation

- Each snapshot and action in the docs matches a test in task 03.

## Resume

Implemented 2026-10-11. `USERS.md` has a section "People as channels and commands", and `POLICY.md` has "The channel and its commands". The examples match `records-channels.test.ts`.
