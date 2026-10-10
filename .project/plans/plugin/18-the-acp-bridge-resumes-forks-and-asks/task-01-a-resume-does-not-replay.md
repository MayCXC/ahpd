---
title: A resume does not replay what the host holds
status: done
depends: []
layer: "agent-acp"
refs:
  - "[code://packages/agent-acp/src/session.ts#L1006-L1147](../../../../packages/agent-acp/src/session.ts#L1006-L1147) - `open`, where a resume is always `session/load`"
  - "[code://packages/agent-acp/src/session.ts#L1123-L1136](../../../../packages/agent-acp/src/session.ts#L1123-L1136) - `watchSession`, built from the load replay only"
  - "[code://packages/agent-acp/src/connection.ts#L312](../../../../packages/agent-acp/src/connection.ts#L312) - `loadSession`, beside which `resumeSession` goes"
  - "[code://packages/sdk/src/types/agent.ts#L246-L261](../../../../packages/sdk/src/types/agent.ts#L246-L261) - `Start.resume` and `Start.seed`"
  - "[code://packages/agent-acp/test/agent-acp.test.ts](../../../../packages/agent-acp/test/agent-acp.test.ts) - the scripted server the bridge is tested against"
---

## Objective

A resumed ACP session whose turns the host already holds is resumed with `session/resume`, its transcript still answers every turn, and every other resume is `session/load` as today.

## Files

- `UPDATE: packages/agent-acp/src/connection.ts:312` - `resumeSession` on the connection, beside `loadSession`.
- `UPDATE: packages/agent-acp/src/session.ts:1006-1147` - the choice between the calls, and the record seeded on a resume.
- `UPDATE: packages/agent-acp/test/agent-acp-catalog.test.ts` - the cases below.

## Steps

1. Run `pnpm install` first: `package.json` asks `@agentclientprotocol/sdk` `^1.5.0` and `node_modules` holds 1.4.0.
2. Read whether the server advertised `session.resume` in the `initialize` answer.
3. When it did and `Start.seed` is not empty, call `resumeSession` with the same `sessionId`, `cwd`, `mcpServers` and `additionalDirectories` `loadSession` is given, and learn modes and config options from its answer.
4. After a resume, build the watched record (`watchSession`, `session.ts:1123-1136`) from `Start.seed` as its replay, since no replay arrives; new turns are added to it as today.
5. Otherwise keep the `loadSession` path and its refusal unchanged.
6. A reopen after the server died calls `resumeSession` when the server advertised `session.resume`, keeping the record it has, and `loadSession` otherwise, as today. The order in `open` is fork (task 02), then resume, then load.
7. Rewrite the comment above `open` to say which call is made when.

## Validation

- `packages/agent-acp/test/agent-acp-catalog.test.ts`: a server advertising `session.resume`, with a seed, gets `session/resume` and no `session/load`; without a seed it gets `session/load`; a server advertising neither refuses as today.
- The same file: after a resume with a seed and one new turn, the session's `transcript` answers the seeded turns and the new one.
- The same file: a server that advertises `session.resume` and dies is reopened with `session/resume`, and its transcript has no turn twice.
- `pnpm test`, `pnpm typecheck` green.

## Resume

- **The file the cases went into is `packages/agent-acp/test/agent-acp-catalog.test.ts`, not `test/agent-acp.test.ts`.** Every case in this plan's three tasks names the same file in Files and Validation and every one of them is catalog state: which call the open makes, what the record holds, what a fork point answers. `agent-acp.test.ts` is the small end-to-end file (6 cases) and has no fixture log to read. The amendment is here rather than in the plan, which is forward-action-only.
- Step 1 was already satisfied: `node_modules` holds `@agentclientprotocol/sdk@1.6.0` for the `^1.5.0` the manifest asks, and it has `methods.agent.session.resume` and `methods.agent.session.fork`.
- `Start.seed` **is** handed on every resume path, so the plan's "watch out for" is settled in the bridge's favour: `lifecycle.ts` and `chatactions.ts` pass it on the reopen, the move and the fork alike. No fallback was needed.
- The choice lives in `open` as `const taking = ctx.resumes && (start.resume === undefined || held.length > 0)` - the `start.resume === undefined` arm is the server-died reopen, where the host hands no seed because it holds nothing, and `session/resume` is still the right call (the server kept the conversation). `resumable: () => ctx.loads` is left as it was.
- The host's own turns are kept on `WatchedSession.held` and read ahead of `turns` by `turnsOf`, rather than tagged onto individual `WatchedTurn`s: a resume replays nothing, so the conversation the host held when it asked is the record's opening and must not be written twice when the server replays. `held` is filled once, by `hold()` in `watchSession`, and only while the record is still empty.
- The fixture gained `--no-resume`, which drops `sessionCapabilities.resume`, and a `session/resume` handler that names the id it was given and replays nothing. The `--replay` flag is older and belongs to `session/load`; the resumed case is run against a `--replay` server, so a load would have replayed and a resume cannot.

