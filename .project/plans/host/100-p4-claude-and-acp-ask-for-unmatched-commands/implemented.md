---
title: Claude and ACP ask only for unmatched commands - implemented
date: 2026-10-19
refs:
  - git://fc154d8a
  - "[code://packages/agent-claude/src/session/asking.ts](../../../../packages/agent-claude/src/session/asking.ts)"
  - "[code://packages/agent-claude/src/session/config.ts](../../../../packages/agent-claude/src/session/config.ts)"
  - "[code://packages/agent-acp/src/session/handlers.ts](../../../../packages/agent-acp/src/session/handlers.ts)"
---

Claude and ACP now ask the session's `getAutoApproval` before they ask a person about a shell command.
A command that the owner's rules approve runs without a question, and its row says `confirmed: 'not-needed'`.
Any other command asks as before.

## What was built

- [`code://packages/agent-claude/src/session/asking.ts`](../../../../packages/agent-claude/src/session/asking.ts) - `canUseTool` calls the check for `Bash` before anything is held.
- [`code://packages/agent-claude/src/session/config.ts`](../../../../packages/agent-claude/src/session/config.ts) - `sourceFirst` keeps the line the model wrote per `tool_use_id` in `Config.unprefixed`, and the check reads that line.
- [`code://packages/agent-claude/src/session/context.ts`](../../../../packages/agent-claude/src/session/context.ts) - `getAutoApproval` on `ClaudeSessionOptions`, mapped from `Start` in `claude.ts`.
- [`code://packages/agent-acp/src/session/handlers.ts`](../../../../packages/agent-acp/src/session/handlers.ts) - `askPermission` reads `rawInput.command` from a call of kind `execute`, and selects the agent's `allow_once` option for an approved command.

## Verified

- `packages/agent-claude/test/agent-claude-autoapproval.test.ts`: the eight cases of task 01, from `runs a command the owner's rules allow, without asking` to `still answers a call the SDK has already cancelled`.
- `packages/agent-acp/test/agent-acp-ports.test.ts`: four cases, for an allowed command, an unmatched one, a call with no command line and an agent with no `allow_once`.
- The ACP shape is the one codex-acp 1.13.1 sends: `rawInput: { command, cwd }`.
- Softov reviewed the plan on 2026-10-19 and approved the close.

## Departures from the plan

- Task 01 - the validation line that says `bypassPermissions` and `dontAsk` keep their answers has no test. Those modes never call `canUseTool`, according to the SDK's `permissionMode` documentation. Softov accepted the close without a test, 2026-10-19.
- Task 01 - `context.ts` and `claude.ts` changed to carry the check, and the Files list did not name them.

## Left for later

- An ACP agent that puts the command line in another place asks as before. Only the codex-acp shape is read.
