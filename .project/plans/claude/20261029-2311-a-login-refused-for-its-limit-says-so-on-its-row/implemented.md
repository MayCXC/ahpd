---
title: A login refused for its limit says so on its row - implemented
date: 2026-10-29
refs:
  - git://9c9563ab - the change
  - "[code://packages/sdk/src/connectors/channel.ts#L955](../../../../packages/sdk/src/connectors/channel.ts#L955) - the note command"
  - "[code://packages/agent-claude/src/session/logins.ts#L207](../../../../packages/agent-claude/src/session/logins.ts#L207) - a refusal is noted with its words and when the login is back"
  - "[code://packages/agent-claude/src/session/logins.ts#L311](../../../../packages/agent-claude/src/session/logins.ts#L311) - a turn that went through is noted as a call that worked"
  - "[code://packages/agent-claude/src/plugin.ts#L161](../../../../packages/agent-claude/src/plugin.ts#L161) - the plugin sends its checks and its notes on one connection"
---

A Claude login refused for its limit says so on its connector's row, with the CLI's words and when it is back.
A turn that goes through on a login says so too.

## What was built

- [`code://packages/sdk/src/connectors/channel.ts`](../../../../packages/sdk/src/connectors/channel.ts) - `x-ahpd/connectors/note` keeps `{ id, ok, status?, error? }` with `note`.
  It takes what a check takes, and only the plugin that registered the connector's adapter may note.
- [`code://packages/agent-claude/src/logins.ts`](../../../../packages/agent-claude/src/logins.ts) - `OpenLogins.onCall`, and `called`, which skips a token the login no longer holds.
- [`code://packages/agent-claude/src/session/logins.ts`](../../../../packages/agent-claude/src/session/logins.ts) - `refused` notes the failure, and `answered` notes a turn that went through.
- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - a result with nothing wrong calls `answered`.
- [`code://packages/agent-claude/src/plugin.ts`](../../../../packages/agent-claude/src/plugin.ts) - `throughHost` sends each check and each note on one connection.
- [`code://docs/plugins/PLUGINS.md`](../../../../docs/plugins/PLUGINS.md) - the command, and the calls a health keeps.

## Verified

- On the code before the change, the three cases fail.
  There is no note command, no note, and two requests on the plugin's connection where four are expected.
- After the change, `connectors-channel.test.ts` and `agent-claude-logins.test.ts` pass, 75 of 75.
- The type check passes.

## Departures from the plan

- none.

## Left for later

- none.
