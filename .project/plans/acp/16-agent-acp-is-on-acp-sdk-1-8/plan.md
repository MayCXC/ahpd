---
title: agent-acp is on the ACP SDK 1.8.0
domain: acp
status: planned
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
changes: []
creates: []
refs:
  - "[code://packages/agent-acp/package.json#L66](../../../../packages/agent-acp/package.json#L66) - the SDK range, `^1.5.0`, locked at 1.6.0"
  - "[code://packages/agent-acp/src/session/turn.ts#L159](../../../../packages/agent-acp/src/session/turn.ts#L159) - `stopReasonFor`, which reads the prompt response's `stopReason`"
  - npm://@agentclientprotocol/sdk@1.8.0 - schema 1.25.0
---

## Goal

agent-acp runs on `@agentclientprotocol/sdk` 1.8.0.
The range admits it already, so a fresh install gets a version the tests never ran until the lock moves.

## Reconnaissance

A trial upgrade on `c881ca4a` was green: build, typecheck, boundary and agent-acp 246 tests.
No release-age exclude is needed, and the lock changes for this package only.
The peer is `zod ^3.25 || ^4`, unchanged.

- 1.7.0 checks the values of the v2 types. agent-acp imports only the v1 root.
- 1.8.0 makes `IdleStateUpdate` a union on `stopReason`, with a new `error` reason. agent-acp does not read `IdleStateUpdate`.
- 1.8.0 makes session notices and compaction stable.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The SDK range goes to `^1.8.0` | Softov, 2026-10-16, "also to update claude and acp if any update" | 01 |
| The SDK's new features are not in this plan: notices, compaction and the `error` stop reason | (defaulted: this plan is the version move) | - |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - agent-acp is on the ACP SDK 1.8.0](task-01-agent-acp-is-on-acp-sdk-1-8.md) | implemented | - |

## Risks and tradeoffs

- None found in the trial.

## Resume state

- **Done so far:** planned 2026-10-16, from a trial upgrade. Task 01 is implemented, 2026-10-16.
- **Next action:** review task 01.
- **Open questions:** none.
- **Watch out for:** `agent-acp-ports.test.ts` reads `tools/ahp.strict.schema.json`, so run `node tools/schema.mjs` before a bare vitest run.

## Final verification checklist

- [ ] The gates pass: build, typecheck, boundary, schema and vitest on agent-acp.
- [ ] `plans/index.md` updated.
