---
title: A client rule joins the instructions
status: implemented
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

- **Done so far:** built 2026-10-16 with Softov's 4096 characters. `instructions(uri)` now hands the host tools' own wording first and then the body of each of the session's client rules that says `alwaysApply: true`, read off the copies this host made (`pluginCopies`) rather than off what a client announced. A body over `RULE_MOST` (4096) is dropped and named in the log. `Start.instructions`' doc in `packages/sdk/src/types/agent.ts` names the rules, and the ACP backend's `create` logs at the start of a chat that many instructions were left out - once, rather than on every turn. Four tests in `client-plugins-session.test.ts`: the always-apply rule is in the start, a rule without the field is not, one over the limit is not and is logged by name, and a rule is gone from the start after its client leaves.
- **Files:** `packages/sdk/src/host/tooling.ts`, `packages/sdk/src/types/agent.ts`, `packages/agent-acp/src/agent.ts`, `packages/sdk/test/client-plugins-session.test.ts`, and this task's row in `plan.md` with the limit row in its Answers table. Nothing is committed, and `packages/sdk/test/fixtures/wire.jsonl` is left dirty by the vitest run.
- **Next action:** build task 03, the paragraph in `docs/sdk/TOOLS.md:104-114` and `pnpm -s docs:build`.
- **Open questions:** none.
- **Watch out for:**
  - `spawn.ts:673` reads `ctx.instructions(uri)` twice, once to decide whether the field is there and once for its value, so a start with a rule over the limit writes that line twice. `spawn.ts` is not in this task's Files and was left as it is; the log line is one per read of `instructions`.
  - The rules are added by `pluginCopies(uri)` and not by `pluginsFor(uri, chatUri)`, which writes down what a chat began with and is therefore only callable where a chat URI is at hand. `pluginsFor` is `pluginCopies` plus the set of servers a client switched off, so the directories a rule is read from are the same ones the backend is handed.
  - The ACP line has no test: this task's Files name `client-plugins-session.test.ts` alone, and nothing in `packages/agent-acp/test` starts a session with `instructions` on it.
  - `instructions(uri)` holds the host tools' own wording alone, and the remote origin instruction is a route of its own, `turnInstructions`, which the backend reads at each turn. The rules join the first and not the second.
