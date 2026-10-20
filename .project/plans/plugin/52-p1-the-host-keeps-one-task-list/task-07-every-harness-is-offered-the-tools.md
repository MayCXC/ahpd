---
title: Every harness is offered the tools
status: done
depends: [task-06-approving-and-reviewing-take-a-grant.md]
layer: "tasks"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L736](../../../../packages/sdk/src/types/plugin.ts#L736) - `registerTool`, the tools offered to every session's model"
  - "[code://packages/sdk/test/host-tools.test.ts](../../../../packages/sdk/test/host-tools.test.ts) - a host folded from plugins, with its tools in a session"
  - "[code://packages/agent-pi/test/agent-pi-tools.test.ts](../../../../packages/agent-pi/test/agent-pi-tools.test.ts) - `toPiTool`, a host tool as pi runs it"
  - "[code://packages/agent-cofold/test/agent-cofold-tools.test.ts#L243-L266](../../../../packages/agent-cofold/test/agent-cofold-tools.test.ts#L243-L266) - `hostTools`, a host tool as cofold offers it"
---

## Objective

The host offers the nine task tools to a pi session and a cofold session, and one session sees a task the other added.

## Files

- `CREATE: packages/tasks/test/tasks-harnesses.test.ts` - the nine tools through pi and cofold, and two sessions on one list.

## Steps

1. Convert each of the nine tools with `toPiTool`, and call `task_add` the way pi does.
2. Open a cofold session with the nine tools as `hostTools`, and assert that its model gets each one.
3. Fold the tasks plugin into a host with `foldHostOptions`, as `host-tools.test.ts` does.
4. Call `task_add` from one session and `task_list` from a second session of that host.
5. Assert that the second session lists the task, with the first session in `created.in`.

## Validation

- `pnpm vitest run packages/tasks/test/tasks-harnesses.test.ts` passes.
- No file under `packages/agent-pi/src` or `packages/agent-cofold/src` changes.

## Resume

- **Done so far:** every step. `tasks-harnesses.test.ts` folds the plugin with `foldHostOptions`. It wraps each tool as a session's `BoundTool` with that session's call, and passes them to `toPiTool` and to a `cofoldAgent` session. The pi conversion offers every tool and calls `task_add` and `task_list`. The cofold model is offered every one. A task added from one session's wrapped tools is listed from a second session's, and its `created.in` is the first session. No file under `packages/agent-pi/src` or `packages/agent-cofold/src` changed.
- **Next action:** task 08.
- **Open questions:** the task says nine tools, but `plan_set`, added by Softov's answer on 2026-10-18, makes ten registered tools. The test covers all ten and names them, so nothing is left out.
- **Watch out for:** `packages/tasks/package.json` gained `@cofold/agents` as a devDependency, because the cofold half opens a session on `createFakeModel` from `@cofold/agents/testing`; `pnpm-lock.yaml` follows. The cofold session has no store (`memory: true`) and a temporary working directory. `toPiTool` takes a `BoundTool` and not a `HostTool`, so the wrapper that binds the call is the test's, as `boundTools` does in the host.
