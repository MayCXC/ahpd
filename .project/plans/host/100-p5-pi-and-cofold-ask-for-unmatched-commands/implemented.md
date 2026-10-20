---
title: pi and cofold ask only for unmatched commands - implemented
date: 2026-10-19
refs:
  - git://7fe360c8
  - "[code://packages/agent-pi/src/session.ts](../../../../packages/agent-pi/src/session.ts)"
  - "[code://packages/agent-cofold/src/pauses.ts](../../../../packages/agent-cofold/src/pauses.ts)"
  - "[code://packages/agent-cofold/src/runs.ts](../../../../packages/agent-cofold/src/runs.ts)"
---

pi and cofold now ask the session's `getAutoApproval` before they ask a person about a shell command.
A command that the owner's rules approve runs without a question, and any other command asks as before.
A mode that refuses or runs a call keeps its answer, and the check only removes questions.

## What was built

- [`code://packages/agent-pi/src/session.ts`](../../../../packages/agent-pi/src/session.ts) - `decide` is async, and `allowedByRule` asks the check only when the mode answers `ask`, for `bash` and `powershell`.
- [`code://packages/agent-cofold/src/pauses.ts`](../../../../packages/agent-cofold/src/pauses.ts) - `autoApprove` asks the check for `shell_exec`, and approves with no `alwaysApprove`.
- [`code://packages/agent-cofold/src/runs.ts`](../../../../packages/agent-cofold/src/runs.ts) - the live read loop calls `autoApprove` before the mapping opens a question.

## Verified

- `packages/agent-pi/test/agent-pi-autoapproval.test.ts`: the eight cases of task 01, from `runs a bash command the owner's rules allow, without asking` to `still asks about a command whose input names none`.
- `packages/agent-cofold/test/agent-cofold-autoapproval.test.ts`: the four cases of task 02, from `runs a shell command the owner's rules allow, without asking` to `asks the check only about cofold's shell`.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` passed.
- Softov reviewed the plan on 2026-10-19 and approved the close.

## Departures from the plan

- Task 02 - the check is in the session (`pauses.ts` and `runs.ts`), not in `mapping.ts`.
  The mapping is pure, and the resume replay also runs it.
- Task 02 - a replay shows the questions that were asked, whatever the rules say now.

## Left for later

- Nothing.
