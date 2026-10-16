---
title: The ACP backend hears the Codex account
status: done
depends: [task-02-the-host-publishes-each-agent-account.md]
layer: agent-acp
refs:
  - "[code://packages/agent-acp/src/connection.ts#L209-L252](../../../../packages/agent-acp/src/connection.ts#L209-L252) - the notification handlers"
  - "[code://packages/agent-acp/src/agent.ts#L129](../../../../packages/agent-acp/src/agent.ts#L129) - the empty probe, which stays empty"
  - "npm://@agentclientprotocol/codex-acp@1.13.1 - `_auth/status_update`"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/codex/codexAccountState.ts#L11-L32 - the state map"
---

## Objective

An ACP agent that advertises `authStatus` sends its account to the host when `_auth/status_update` arrives.

## Files

- `UPDATE: packages/agent-acp/src/connection.ts:209-252` - a handler for `_auth/status_update`.
- `UPDATE: packages/agent-acp/test` - each kind of the notification maps to its state.

## Steps

1. Read the `authStatus` flag in `agentCapabilities._meta` at the start of the connection.
2. Add the handler for `_auth/status_update`.
3. Map `account`, `api_key`, `gateway` and `none` to the states of task 01.
4. Send the account with the event of task 02.
5. Keep the probe as it is, with no spawn at boot.
6. Write the tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The agent-acp test: an `account` notification gives the email and the plan.
- The agent-acp test: a `none` notification gives `signedOut`.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume

Done. The contract was read off `@agentclientprotocol/codex-acp` 1.13.1 as it
installs globally (`src/AuthStatusMeta.ts`, bundled at `dist/index.js:36942`):
the handshake carries `agentCapabilities._meta.authStatus` as an empty object,
which is a presence flag rather than a shape, and `_auth/status_update` goes out
as `{ authStatus: <status> }`. A status is `{ kind, label, ... }` with a `kind`
of `account`, `api_key`, `gateway`, `none` or `external`; only `account` carries
a nested `account` object, whose keys are `email` and `plan` (the server's own
name for the plan, not `planType`), and which it leaves out entirely when it has
neither. `gateway` may carry a `detail`, which is a provider name and not an
account, and every kind carries a `label` a client draws. The first push is
scheduled with `setImmediate` so that it cannot overtake the response to
`initialize` (`dist/index.js:38472`), and a later one goes out on a session
start, on `authenticate`, on `/logout` and on Codex's own `account/updated`.

What `packages/agent-acp/src/connection.ts` does with it:

- `AUTH_STATUS` and `AUTH_STATUS_UPDATE` name the key and the method, because
  neither is part of ACP and both are one server's own spelling.
- `accountOf(status, at)` maps the kinds: `account` is `signedIn` with `email`
  and `planType` from the nested object, each only where the server named it;
  `api_key`, `gateway` and `external` are `unavailable`; `none` is `signedOut`;
  and a kind this bridge does not know leaves the account unanswered, because
  every state is a claim about who is billed and a guess at one is worse than
  saying nothing. A server that names no email gives `signedIn` with no email,
  which `Account`'s own doc calls a real answer rather than a missing one.
- The notification handler exists only where the session has an `account`
  handler, and `AcpHandlers.account` is wired in `session/opening.ts` from
  `start.onAccount`, so an ACP account reaches the host through the event task
  02 added. The handshake reply is read after the registration and the first
  push arrives around it, so a status that lands before the reply is kept and
  handed over once the flag is known, rather than dropped for the order it
  arrived in.
- The probe in `agent.ts` is untouched: it answers empty and spawns nothing, so
  the account of an ACP backend comes from a live session and from nowhere else.

**Decided here, not in the task:** step 3 names four kinds and the pinned
codex-acp sends five. `external` is Bedrock and an agent's own identity, which
VS Code's `codexAccountState.ts` folds into `unavailable` beside the API key, so
it is mapped there rather than left unanswered; the report says so.

The fixture (`test/fixtures/acp-server.mjs`) grew `--auth-status=<kind>`, which
advertises the flag and sends one update with that kind as soon as the handshake
is answered, and `--auth-silent`, which sends the same update and advertises
nothing. `test/agent-acp-account.test.ts` (new) reads the `account` kind for its
email and plan, each of the other four for its state, and the silent server for
an account this bridge keeps out.

Files this task changed, so the work can be committed on its own:

- `packages/agent-acp/src/connection.ts` - the flag, `accountOf`, the handler
- `packages/agent-acp/src/types.ts` - `AcpHandlers.account`
- `packages/agent-acp/src/session/opening.ts` - where the account is sent
- `packages/agent-acp/test/agent-acp-account.test.ts` (new)
- `packages/agent-acp/test/fixtures/acp-server.mjs` - the two flags
- `.project/plans/host/99-a-client-sees-the-agent-account/plan.md` and this file

Gates at this state: `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`,
`node tools/schema.mjs` and `git diff --quiet tools/` pass, and `pnpm -s exec
vitest run packages/agent-acp` passes 252 tests in 16 files.
