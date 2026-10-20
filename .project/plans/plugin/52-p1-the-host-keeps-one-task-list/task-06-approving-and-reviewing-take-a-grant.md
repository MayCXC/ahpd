---
title: Approving and reviewing take a grant
status: done
depends: [task-04-the-plan-tools.md, task-05-the-task-tools.md]
layer: "tasks"
refs:
  - "[code://packages/sdk/src/tools/session.ts#L280-L282](../../../../packages/sdk/src/tools/session.ts#L280-L282) - `allowed`, the grant check a host tool makes"
  - "[code://packages/sdk/src/types/host.ts#L777-L793](../../../../packages/sdk/src/types/host.ts#L777-L793) - `may`, which is false for a call no person is behind"
  - "[code://docs/sdk/USERS.md](../../../../docs/sdk/USERS.md) - a grant on a plugin's subject, and how a role names it"
---

## Objective

`plan_approve` and `task_approve` stamp `approved` only for a call whose person holds the approve grant.
`task_review` stamps `reviewed` with an optional verdict.

## Files

- `CREATE: packages/tasks/src/approve.ts` - `plan_approve`, `task_approve` and `task_review`.
- `UPDATE: packages/tasks/src/plugin.ts` - register the three tools in `apply`.
- `CREATE: packages/tasks/test/tasks-approve.test.ts` - each tool, with and without the grant.

## Steps

1. Use the grant `task:approve` in both `plan_approve` and `task_approve`.
2. Refuse `plan_approve` and `task_approve` with `at.refusal(grant)` when `at.may(grant)` is false.
3. Stamp `approved` with `stampOf`, and answer one line.
4. Write `task_review` with the inputs `task` and `verdict`, where `verdict` is `approved` or `changes`.
5. Check no grant in `task_review`, so a reviewer session can review.
6. Stamp `reviewed` with the verdict, and answer one line.

## Validation

- `packages/tasks/test/tasks-approve.test.ts`: a person with the grant approves. The tool refuses a person without it, in the host's words.
- `packages/tasks/test/tasks-approve.test.ts`: a call no person is behind cannot approve.
- `packages/tasks/test/tasks-approve.test.ts`: `task_review` stamps `reviewed` with each verdict and with none.
- `pnpm vitest run packages/tasks/test` passes.

## Resume

- **Done so far:** every step. `approve.ts` has `plan_approve`, `task_approve` and `task_review`, registered from `apply`. Both approve tools read `task:approve` through `at.may`, and refuse with `new Error(at.refusal(grant))`, the same wording the sdk's own tools use. A call no person is behind approves nothing. They stamp `approved` with `stampOf` and answer `planLine` or `taskLine`. `task_review` takes `task` and an optional `verdict` of `approved` or `changes`, and asks no grant. It stamps `reviewed` with the verdict where one is given, and answers one line.
- **Next action:** task 07.
- **Open questions:** none.
- **Watch out for:** a second approval or review replaces the stamp with the later one, since the setting is about the current yes. The plan does not ask to keep the first. `isVerdict` was added to `record.ts` for the enum check. The grant refusal is an `Error` and not an `RpcError`, because that is how `allowed` in `packages/sdk/src/tools/session.ts` words it.
