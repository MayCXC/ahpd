---
title: Each people scheme has its own channel
status: accepted
date: 2026-10-11
refs:
  - "[code://packages/sdk/src/people.ts#L239-L240](../../packages/sdk/src/people.ts#L239-L240) - the four people schemes, each with its own grant"
  - "[code://packages/sdk/src/types/plugin.ts#L184-L186](../../packages/sdk/src/types/plugin.ts#L184-L186) - a channel has one grant"
---

## Context

Users, teams, projects and roles are four resource schemes, and each has its own grant subject.
A channel has one grant.

## Decision

For now, each people scheme has its own channel: `x-ahpd-users://`, `x-ahpd-teams://`, `x-ahpd-projects://` and `x-ahpd-roles://`.
Each channel needs the grant of its scheme, such as `user:read`.

Source: Softov, 2026-10-11, to "How should users, teams, projects and roles be split into channels?" - "Four channels".

## Consequences

A client subscribes once for each list it shows.
A reader with `team:read` and no `user:read` gets the whole teams channel.
The users channel shows that reader only their own record, as `user://<id>` does.

## Options

- **One `x-ahpd-people://` channel with four lists.** Rejected: the channel must filter each list by its own grant inside one snapshot.
