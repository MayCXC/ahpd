---
title: A caller sees only the agents it may use
status: todo
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

- **Done so far:** nothing.
- **Next action:** step 1.
- **Files:** none yet.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** a refused agent must not tell the caller that it exists.
