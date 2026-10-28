---
title: A conversation runs on its own login
status: done
depends: []
layer: "agent-claude"
refs:
  - "[code://packages/agent-claude/src/options.ts#L250-L285](../../../../packages/agent-claude/src/options.ts#L250-L285) - `MODEL_SOURCE` and `OF_A_VARIANT`, the shape a record's list of secrets takes"
  - "[code://packages/agent-claude/src/session/query.ts#L150-L176](../../../../packages/agent-claude/src/session/query.ts#L150-L176) - where the CLI's environment is built in a machine and for the task tools"
  - "[code://packages/agent-claude/src/session/query.ts#L409](../../../../packages/agent-claude/src/session/query.ts#L409) - the pushed credential over the record's `env`"
  - "[code://packages/agent-claude/src/session/query.ts#L530-L533](../../../../packages/agent-claude/src/session/query.ts#L530-L533) - `startQuery`, which records what the CLI was started from"
  - "[code://packages/agent-claude/src/session/query.ts#L907-L923](../../../../packages/agent-claude/src/session/query.ts#L907-L923) - `refreshPreset`, which starts a new CLI when that changed"
  - "[code://packages/agent-claude/src/claude.ts#L587-L735](../../../../packages/agent-claude/src/claude.ts#L587-L735) - `create`, which builds each session of an agent"
---

## Objective

A record's `logins` give each conversation its own order of the logins.
The CLI runs on the first login in that order that is not cooling down, and keeps it while it works.
The CLI gets the login's token as `CLAUDE_CODE_OAUTH_TOKEN`.

## Files

- `CREATE: packages/agent-claude/src/logins.ts` - the logins of a record, the order of a conversation, and the cooldowns of an agent.
- `UPDATE: packages/agent-claude/src/options.ts:250-285` - the `logins` field beside `modelSources`, with a write-only `token`.
- `UPDATE: packages/agent-claude/src/models.ts:113-116` - `tokenOf` exported, so a login's token is read as a model source's key is.
- `CREATE: packages/agent-claude/src/session/logins.ts` - the session's login: which one, and when it changes.
- `UPDATE: packages/agent-claude/src/session/context.ts` - the cooldowns in the session's options, and the area in the context.
- `UPDATE: packages/agent-claude/src/session/query.ts:150-176` - the login's token in the CLI's environment, under a pushed credential.
- `UPDATE: packages/agent-claude/src/session/query.ts:530-533` - what the CLI was started from includes its login.
- `UPDATE: packages/agent-claude/src/session/query.ts:907-923` - `refreshPreset` restarts the CLI when the login changes too.
- `UPDATE: packages/agent-claude/src/session.ts` - the area built with the others, and the first login taken before the first query.
- `UPDATE: packages/agent-claude/src/claude.ts:587-735` - one record of cooldowns for every session of the agent.
- `CREATE: packages/agent-claude/test/agent-claude-logins.test.ts` - the cases below.

## Steps

1. Add `LOGIN` and the `logins` field to `OF_A_VARIANT` in `options.ts`, with `token` written as `MODEL_SOURCE.key` is.
2. Export `tokenOf` from `models.ts`.
3. Write `loginsOf(values)` in `logins.ts`: each entry with a name and a token's text, the first of a name kept.
4. Write `ordered(key, logins)` with meridian's rendezvous score, and cite `routing.ts` L127-L150.
5. Write `Cooldowns` from meridian's `ProfileExhaustion`, with `mark`, `cooling`, `until` and an injectable clock, and cite it.
6. Write `createLogins(ctx)` in `session/logins.ts`: `loginFor(values)` keeps the session's login while it is not cooling down.
7. In `loginFor`, take the first login in the order that is not cooling down.
8. When every login cools down, take the first login in the order.
9. Lay `CLAUDE_CODE_OAUTH_TOKEN` under `ctx.options.env` in the three places `query.ts` builds an environment.
10. Record the login's name beside the values in `startQuery`, and compare both in `refreshPreset`.
11. Take the first login in `createSession`, before the first query.
12. Hand every session of an agent the agent's `Cooldowns` in `claude.ts`.

## Validation

- `packages/agent-claude/test/agent-claude-logins.test.ts` holds these cases:
  - A conversation's CLI starts on the first login of its order.
  - Two sessions on one chat URI start on one login.
  - Sessions on many chat URIs start on more than one login.
  - meridian's pinned vectors give meridian's account.
  - A pushed credential stays over the login.
  - A login that cools down moves the next turn to a new CLI on the next login.
  - That new CLI resumes the conversation.
  - A record with no `logins` adds no `CLAUDE_CODE_OAUTH_TOKEN`.
- Run `pnpm vitest run packages/agent-claude --maxWorkers=1`, and expect every case to pass.
- Run the new cases on the code before this task, and expect them to fail.

## Resume

Done 2026-10-28.
Six of the seven cases fail on the code before this task.
The case of a record with no `logins` passes there too, because it keeps today's behaviour.
The engine's list of fields in `engine.test.ts` gained `logins`.

