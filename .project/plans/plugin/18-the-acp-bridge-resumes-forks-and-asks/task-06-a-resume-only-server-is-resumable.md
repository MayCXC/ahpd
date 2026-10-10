---
title: A server that only resumes is resumable, and an unknown field is asked as text
status: todo
depends: [task-01-a-resume-does-not-replay.md, task-03-a-servers-question-is-asked-in-the-chat.md]
layer: "agent-acp"
refs:
  - "[code://packages/agent-acp/src/session.ts#L171](../../../../packages/agent-acp/src/session.ts#L171) - `resumable()` reads `ctx.loads` only"
  - "[code://packages/agent-acp/src/session/opening.ts](../../../../packages/agent-acp/src/session/opening.ts) - `open()` accepts either `ctx.loads` or `ctx.resumes`"
  - "[code://packages/agent-acp/src/mapping.ts#L591-L630](../../../../packages/agent-acp/src/mapping.ts#L591-L630) - `questionOf`, which asks a field of an unknown type as text"
  - "[code://packages/agent-acp/test/fixtures/acp-server.mjs](../../../../packages/agent-acp/test/fixtures/acp-server.mjs) - the scripted server"
---

## Objective

`resumable()` answers true when the server advertises `session.load` or `session.resume`, as `open()` already does.
A form field of a type ACP does not name is asked as a text question, and a test holds it.

## Files

- `UPDATE: packages/agent-acp/src/session.ts:171` - `resumable` reads `ctx.loads || ctx.resumes`.
- `UPDATE: packages/agent-acp/test/fixtures/acp-server.mjs` - a server that advertises `session.resume` and not `session.load`, and a form with a field of an unknown type.
- `UPDATE: packages/agent-acp/test/agent-acp-catalog.test.ts` - the resume-only case.
- `UPDATE: packages/agent-acp/test/agent-acp-ports.test.ts` - the unknown field case.

## Steps

1. Change `resumable` to `() => ctx.loads || ctx.resumes`.
2. Add a fixture flag for a server that advertises `session.resume` and not `session.load`.
3. Add a test: against that server, `resumable()` is true and a reopen sends `session/resume`.
4. Add a fixture form with a field whose `type` ACP does not name.
5. Add a test: the bridge asks that field as a `text` question, and the answer reaches the server.

## Validation

- `packages/agent-acp/test/agent-acp-catalog.test.ts`: a resume-only server is resumable and reopens with `session/resume`.
- `packages/agent-acp/test/agent-acp-ports.test.ts`: an unknown field type is a `text` question and its answer reaches the server.
- `pnpm typecheck` and `pnpm boundary` green; `pnpm exec vitest run packages/agent-acp` green.

## Resume
