---
title: A record's logins are connector ids
status: done
depends: [task-01-a-claude-login-is-a-connector.md]
layer: "sdk, server, agent-claude"
refs:
  - "[code://packages/sdk/src/agents/channel.ts#L586-L693](../../../../packages/sdk/src/agents/channel.ts#L586-L693) - `putOne`, where a field that names a connector is checked"
  - "[code://packages/sdk/src/automations/automations.ts#L330-L400](../../../../packages/sdk/src/automations/automations.ts#L330-L400) - the check of a field marked `x-ahpd-connector`, which a record's field copies"
  - "[code://packages/server/src/commands/run.ts#L833-L843](../../../../packages/server/src/commands/run.ts#L833-L843) - the agents channel the daemon builds, which is handed its connectors"
  - "[code://packages/agent-claude/src/options.ts#L222-L249](../../../../packages/agent-claude/src/options.ts#L222-L249) - the `logins` field this task gives connector ids"
  - "[code://packages/agent-claude/src/logins.ts#L18-L45](../../../../packages/agent-claude/src/logins.ts#L18-L45) - `loginsOf`, which this task reads from the open logins"
  - "[code://packages/agent-claude/src/claude.ts#L597-L770](../../../../packages/agent-claude/src/claude.ts#L597-L770) - `create`, which builds each session of an agent"
---

## Objective

A Claude record's `logins` names connectors of `claude-login`, and a put that names one the record may not use is refused.
The rotation reads each named login's token from its open connector, and does what it does today.

## Files

- `UPDATE: packages/sdk/src/agents/channel.ts:76-114` - a `connectors` option: the connectors the host serves, read at each put.
- `UPDATE: packages/sdk/src/agents/channel.ts:586-693` - a put refuses a field that names a connector the record may not use.
- `UPDATE: packages/server/src/commands/run.ts:833-843` - the agents channel reads the connectors channel's references.
- `UPDATE: docs/plugins/PLUGINS.md:661-723` - a field of an engine's schema marked `x-ahpd-connector`.
- `UPDATE: packages/agent-claude/src/options.ts:222-249` - the `logins` field: connector ids marked `x-ahpd-connector`.
- `UPDATE: packages/agent-claude/src/logins.ts` - a login an owner may use, and `loginsOf` reading each token from its connector.
- `UPDATE: packages/agent-claude/src/session/logins.ts` - the rotation's logins, read through the agent's open logins.
- `UPDATE: packages/agent-claude/src/session/context.ts` - the agent's logins in the session's options.
- `UPDATE: packages/agent-claude/src/claude.ts` - the plugin's logins and the record's owner, handed to every session of the agent.
- `UPDATE: packages/agent-claude/src/plugin.ts` - the engine opens a record with the load's logins and the record's owner.
- `UPDATE: packages/sdk/test/agents-channel.test.ts` - the cases of a field that names a connector.
- `UPDATE: packages/agent-claude/test/agent-claude-logins.test.ts` - the record's logins as connector ids, and the cases below.

## Steps

1. Add `connectors?: () => readonly ConnectorRef[]` to `AgentsChannelOptions`.
2. Write `refuseConnectors` in the agents channel from `checkReferences`, for a field or a list's items marked `x-ahpd-connector`.
3. Refuse an id with no connector of that adapter.
4. Refuse a connector whose owner is neither the record's owner nor the host.
5. Call `refuseConnectors` in `putOne` after the schema check, and before the put writes anything.
6. Hand the agents channel `() => connectorLists.refs()` in `run.ts`.
7. Say in PLUGINS.md what a field of an engine's schema marked `x-ahpd-connector` names, and when the channel checks it.
8. Declare `logins` in `options.ts` as a list of connector ids, each item marked `x-ahpd-connector` with `claude-login`.
9. Write `usable(id, owner)` in `OpenLogins`: the token of an open login of that owner or of the host.
10. Make `loginsOf` take the agent's open logins, and read each named login's token from them.
11. Hand every session the plugin's `OpenLogins` and the record's owner, from `apply` through `claude()`.
12. Keep the order, the cooldowns, the move and the wait as they are.

## Validation

- `packages/sdk/test/agents-channel.test.ts` holds these cases:
  - The channel refuses a put that names a connector the host does not serve, and names the id.
    The store and the vault stay as they were.
  - The channel refuses a put that names a connector of another adapter.
  - The channel refuses a person's put that names another person's connector.
    It takes one that names the host's connector.
  - A field that is not marked is not checked.
- `packages/agent-claude/test/agent-claude-logins.test.ts` holds these cases:
  - The rotation's cases pass with the record naming connector ids.
  - The rotation leaves out a named login whose connector is not open.
  - A turn skips another person's login and takes the host's.
  - A put that replaces a login's token moves the next turn to a new CLI on the new token.
  - A login whose connector closes moves the next turn to the next login.
- Run `pnpm vitest run packages/agent-claude/test/agent-claude-logins.test.ts` and `pnpm vitest run packages/sdk/test/agents-channel.test.ts`, and expect every case to pass.
- Run the new cases on the code before this task, and expect them to fail.

## Resume

Done 2026-10-28.
Four of the channel's five cases fail on task 01's code; the case of a field the schema does not mark keeps today's behaviour.
Twenty-one of the logins file's 24 cases fail on task 01's code.
Two of the other three keep the merged behaviour: a record with no logins, and a refused sign-in.
The third, a session closed during a wait, passes there because that code reads no login from a connector id, so nothing waits.
A login's field is `id`, the connector's id the record names.
A put that replaces a login's token leaves the record's values as they were.
So a CLI is started from its login's token as well as its id.

