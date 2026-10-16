---
title: A client rule joins the instructions
status: todo
depends: [task-01-a-rule-part-carries-its-frontmatter.md]
layer: "sdk, agent-acp"
refs:
  - "[code://packages/sdk/src/host/tooling.ts#L1720-L1724](../../../../packages/sdk/src/host/tooling.ts#L1720-L1724) - `instructions`"
  - "[code://packages/sdk/src/host/tooling.ts#L1047-L1056](../../../../packages/sdk/src/host/tooling.ts#L1047-L1056) - `pluginsFor`"
  - "[code://packages/sdk/src/host/spawn.ts#L673](../../../../packages/sdk/src/host/spawn.ts#L673) - where the start takes them"
---

## Objective

`instructions(uri)` adds the body of each client rule with `alwaysApply: true`, after the host tool instructions.
A rule over the length limit is dropped, and a backend with no system prompt logs once.

## Files

- `UPDATE: packages/sdk/src/host/tooling.ts:1720-1724` - `instructions` reads the rules of the session's client plugins.
- `UPDATE: packages/sdk/src/types/agent.ts:231-238` - the doc of `Start.instructions` names client rules.
- `UPDATE: packages/agent-acp/src/agent.ts:184` - `create` logs once when `start.instructions` is not empty.
- `UPDATE: packages/sdk/test/client-plugins-session.test.ts` - a rule that applies, one that does not, one over the limit, and one from a client that left.

## Steps

1. Propose a number for the length limit in Resume, and stop until Softov answers.
2. Get the session's client plugins from `pluginsFor`.
3. Add the body of each rule with `alwaysApply: true`, after the host tool instructions.
4. Drop a rule over the limit, and log its name.
5. Make the ACP backend log once per session when it gets instructions it cannot use.
6. Update the doc of `Start.instructions`.
7. Write the tests.
8. Set this task and the plan row to `implemented`.

## Validation

- `client-plugins-session.test.ts`: the start of a session has the always-apply rule in `instructions`.
- `client-plugins-session.test.ts`: a rule without `alwaysApply: true` is not in `instructions`.
- `client-plugins-session.test.ts`: a rule over the limit is not in `instructions`.
- `client-plugins-session.test.ts`: the rule is gone from the next start after its client leaves.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume
