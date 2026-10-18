---
title: The docs say how a client adds a rule
status: implemented
depends: [task-02-a-client-rule-joins-the-instructions.md]
layer: docs
refs:
  - "[code://docs/sdk/TOOLS.md#L104-L118](../../../../docs/sdk/TOOLS.md#L104-L118) - \"The wording a session is given\""
---

## Objective

`TOOLS.md` says which client rules reach the system prompt, when, and which backends take them.

## Files

- `UPDATE: docs/sdk/TOOLS.md:104-118` - a paragraph on client rules.

## Steps

1. Add a paragraph on client rules to the section on session wording.
2. Say that only `alwaysApply: true` rules apply, and that a change reaches the next start.
3. Give the length limit, and say that the host drops a rule over it.
4. Name the backends that take instructions, and say that ACP logs once and ignores them.
5. Set this task and the plan row to `implemented`.

## Validation

- The paragraph matches the behaviour of task 02.
- `pnpm -s docs:build` passes.

## Resume

- **Done so far:** built 2026-10-18. `TOOLS.md` says which client rules reach `Start.instructions`: only those with `alwaysApply: true`, after the host tools' wording, with a 4096-character limit. It names the backends: Claude, pi and cofold add them to a prompt; ACP puts them at the start of the first prompt. `pnpm -s docs:build` passes.
- **Files:** `docs/sdk/TOOLS.md`, this task's status, its row in `plan.md`, and the plan's Resume state. Nothing is committed.
- **Next action:** run the plan's final verification checklist, then write `implemented.md`.
- **Open questions:** none. Softov chose on 2026-10-18 to keep the first prompt route, and the log line in `packages/agent-acp/src/agent.ts` now says so.
- **Watch out for:** the first prompt route came from `plugin/52 p3 t07` on 2026-10-17, after this plan's ACP answer. The docs follow the code.
