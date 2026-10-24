---
title: A caller sees only the agents it may use
status: implemented
depends: [task-01-the-agents-channel.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/auth.ts#L88-L106](../../../../packages/sdk/src/host/auth.ts#L88-L106) - `agentsFor`, which rewrites the agent list for one connection"
  - "[code://packages/sdk/src/host/root.ts#L641](../../../../packages/sdk/src/host/root.ts#L641) - where the root state applies `agentsFor`"
---

## Objective

The agent list in the root state holds only the agents the caller may use, and `createSession` on any other agent is refused.

## Files

- `UPDATE: packages/sdk/src/host/auth.ts:88-106` - filter the list by the agent's owner.
- `UPDATE: packages/sdk/src/host/root.ts:641` - pass the caller to `agentsFor`, if it does not have it yet.
- `UPDATE: packages/sdk/src/host/host.ts` - refuse `createSession` and a session restore on an agent the caller may not use.
- `CREATE: packages/sdk/test/agents-for-caller.test.ts` - the tests.

## Steps

1. Read the owner of each agent from its record, and treat an agent with no record as a host agent.
2. Keep a host agent when the caller has `session:write`.
3. Keep a team agent when the caller is a member of that team.
4. Keep a user agent when the caller is that person.
5. Apply the same rule at `createSession`, and give a refused agent the answer of an unknown agent.
6. Send a new list to a connection when a membership change alters what it may use.

## Validation

- `packages/sdk/test/agents-for-caller.test.ts` lists the agents for three callers: one with `session:write`, one team member and one other person.
- A test expects `createSession` on another person's agent to fail like an unknown agent.
- The gate passes.

## Resume

- **Done so far:** `packages/sdk/src/agents/usable.ts` holds `mayUseAgent`, the one rule: a host agent - the daemon's own or a plugin's, with no record and so no owner - takes `session:write`, a team's agent takes a membership, and a person's agent is that person's own. `agentsFor` in `packages/sdk/src/host/auth.ts` filters the list with it, so a caller is not told an agent it may not use; `createSession` in `packages/sdk/src/host/sessionmethods.ts` and a restore in `packages/sdk/src/host/lifecycle.ts` ask it too, and a refused agent answers exactly what an unknown one does, `No provider called <id>` (-32002). The owner is read from the record through the new `HostOptions.agentOwners`, which the daemon fills with `agentLists.owners()`; `AgentsChannel` grew `owners()`. An id with no record is a host agent. Step 6 is the host's users watch: `watchingUsers()` is true when `agentOwners` is given, so a change to the users file dispatches `root/agentsChanged` and each connection gets its own filtered list, with `Principal.memberships` a live getter. `packages/sdk/test/agents-for-caller.test.ts` has 3 tests: each of three callers' lists, `createSession` refused on another person's agent in the words of an unknown provider, and a membership change arriving as a new list.
- **Next action:** task 03, agent-claude registers a kind.
- **Files:** `packages/sdk/src/agents/usable.ts` (new), `packages/sdk/src/host/auth.ts`, `packages/sdk/src/host/sessionmethods.ts`, `packages/sdk/src/host/lifecycle.ts`, `packages/sdk/src/host.ts`, `packages/sdk/src/agents/channel.ts`, `packages/sdk/src/types/host.ts`, `packages/server/src/commands/run.ts`, `packages/sdk/test/agents-for-caller.test.ts` (new), `packages/sdk/test/agents-channel.test.ts`, `packages/sdk/test/automation-wake.test.ts`, `packages/sdk/test/plugin-start-session.test.ts`, `packages/sdk/test/host-chat-attachment.test.ts`, `packages/sdk/test/users-gate-commands.test.ts`.
- **Departures:** the session restore lives in `packages/sdk/src/host/lifecycle.ts`, not `host/host.ts`, and it asks the rule only when the open has a sender, so an automation or a tool run, which has no principal, is not refused. A caller that has not signed in keeps the host agents rather than none: the list is where an unsigned client learns the resource it signs in with, and an empty list lost `auth/required` (three `users-host` cases failed). For the same reason the `required: false` rewrite of that resource applies only to a root or signed-in connection, as it did before. `agentOwners` is a function because the records change while the host runs and a fold is rebuilt from it. Fixtures that start a session on the daemon's own agent grew `session:write`: `automation-wake`'s `DRIVER`, `host-chat-attachment`'s ana, and `users-gate-commands`' opener. In `plugin-start-session` the case about a person who may not create a chat now maps its backends to `user:soft` through `agentOwners`, because a host agent needs `session:write`, and `session:write` covers `chat:write` - a chat's groups are the session's - so no role that may start a session there can be one that may not add a chat. For the same reason `users-gate-commands` asks its `chat:fork` refusal of `talker`, whose grants are `session:read`, `chat:send` and `chat:create`, rather than of the opener.
- **Open questions:** `session:write` covering a chat's groups is the table's own rule (`holds` in `packages/sdk/src/access/users.ts`), so on a host agent "may not create a chat" is only reachable through an agent a person owns. A host with a users directory and no `agentOwners` keeps every agent for everybody, which is what a caller of the library that does not fold records gets.
- **Watch out for:** a refused agent must not tell the caller that it exists - the list leaves it out and the start answers as an unknown provider does. A status, error, row or log must never carry a key or a secret value.
