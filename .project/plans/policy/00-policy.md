---
title: Policy - what exists today
domain: policy
revalidated: 2026-10-17
---

Policy is what decides which agents, computers and models a person may use, and how much of them.
Roles decide whether a person may act at all (`users.ts`), and policies decide which agent, model and computer they may use.
Policy 01 built the rows, the `policy:` scheme and `decide`, which refuses a session, a turn or a proxy call that no row allows.
Limits are stored and not enforced until policy 02 is built.
The rule shape is the rules draft at file:///github/ahp-review/prospect/ahp-user-rules.md.

## Packages

- [`code://packages/sdk`](../../../packages/sdk) - the host, its ports and gates, the policy port, the `policy:` scheme and `decide`.
- [`code://packages/server`](../../../packages/server) - the daemon configuration and the default stores.

## Contracts

- [`code://packages/sdk/src/types/plugin.ts`](../../../packages/sdk/src/types/plugin.ts) - `PortKey` and the `register*` methods.
- [`code://packages/sdk/src/types/users.ts`](../../../packages/sdk/src/types/users.ts) - `Principal`: roles through `can`, memberships and the primary.
- [`code://packages/sdk/src/usage/scopes.ts`](../../../packages/sdk/src/usage/scopes.ts) - the team and project a request is charged to.
- [`code://packages/sdk/src/types/policies.ts`](../../../packages/sdk/src/types/policies.ts) - the row and the `Policies` port.
- [`code://packages/sdk/src/access/decide.ts`](../../../packages/sdk/src/access/decide.ts) - the four steps of a check.

## Runtime path

```
createSession -> charge (scope) -> decide(agent), decide(computer) -> -32009 on a refusal
sendMessage -> uncharged refusal -> decide(agent, with the turn's model)
proxy call -> policyFor -> decide(model) -> 403 on a refusal
```

## Tests

- [`code://packages/sdk/test/decide.test.ts`](../../../packages/sdk/test/decide.test.ts) - the rules draft's examples for `decide`.
- [`code://packages/sdk/test/policy-checks.test.ts`](../../../packages/sdk/test/policy-checks.test.ts) - the checks at a session and a turn.
- [`code://packages/sdk/test/policy-scheme.test.ts`](../../../packages/sdk/test/policy-scheme.test.ts) - the `policy:` scheme.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A person with no charge rule of their own is charged to the most specific pool first: their own, then the project, then the team, then everyone, and any one pool that allows the work is enough | Softov, 2026-10-02, asked "what does a user's `auto` charge order mean, when they have no charge rule of their own?": "Most specific first"; policy 02 charges everyone in this order | policy 02 |

## Known gaps

- No limit is enforced, and no usage record names a policy: policy 02.
- Machine hours, open sessions, agent work hours and the cancel during a turn: policy 03.
- No charge rule of a person's own, and no team default: unplanned, number `05`.
