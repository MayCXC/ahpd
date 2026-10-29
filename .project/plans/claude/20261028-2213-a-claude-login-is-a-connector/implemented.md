---
title: A Claude login is a connector, and a failed one hands the turn on - implemented
date: 2026-10-28
refs:
  - git://190047d2
  - "[code://packages/agent-claude/src/adapter.ts](../../../../packages/agent-claude/src/adapter.ts)"
  - "[code://packages/agent-claude/src/logins.ts](../../../../packages/agent-claude/src/logins.ts)"
  - "[code://packages/agent-claude/src/session/logins.ts](../../../../packages/agent-claude/src/session/logins.ts)"
  - "[code://packages/sdk/src/connectors/probe.ts](../../../../packages/sdk/src/connectors/probe.ts)"
  - "[code://packages/sdk/src/agents/channel.ts](../../../../packages/sdk/src/agents/channel.ts)"
---

A Claude login is a connector of the adapter `claude-login`: one account's token.
A sign-in on claude.ai or a put makes one, a put of the same id replaces its token, and a remove takes it away.
A Claude record names its logins by connector id, in order, and the agents channel refuses a put naming one the record may not use.
A turn runs on the first ready login, as the model proxy sends a call to its first entry.
A request that fails with no connection, a 429 or a 5xx before the turn showed anything runs again on the next login.
A refused credential ends the turn and names the login, and a retry time a failure names keeps the login out until then.
Each failure goes to the plugin's log, and the host checks that login.

## What was built

- [`code://packages/sdk/src/connectors/probe.ts`](../../../../packages/sdk/src/connectors/probe.ts) - the check one call with a credential answers, shared by the host's adapters and this plugin's; a JSON body makes it a POST.
- [`code://packages/sdk/src/agents/channel.ts`](../../../../packages/sdk/src/agents/channel.ts) - `refuseConnectors`, which holds a record's field marked `x-ahpd-connector` to the connectors the host serves, as an automation's trigger is held.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - the agents channel reads the connectors channel's references.
- [`code://packages/agent-claude/src/adapter.ts`](../../../../packages/agent-claude/src/adapter.ts) - the `claude-login` adapter: the CLI's own one-year sign-in, a pasted code's exchange, and a check that counts tokens.
- [`code://packages/agent-claude/src/logins.ts`](../../../../packages/agent-claude/src/logins.ts) - the open logins of one load, their rests, and a record's logins with their tokens.
  It names the variables a login's CLI goes without, and the SDK's kinds of a failed request and of a refused credential.
- [`code://packages/agent-claude/src/session/logins.ts`](../../../../packages/agent-claude/src/session/logins.ts) - a turn's login, and the refusal of a turn with none ready.
  The failure, its cut point, the move, and the words a turn ends with.
- [`code://packages/agent-claude/src/options.ts`](../../../../packages/agent-claude/src/options.ts) - the declared `logins` field, its items marked with the adapter they name.
- [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts) - the login's token in the CLI's environment, without the credentials the CLI takes before it.
  `refreshPreset` refuses a turn with no ready login, and restarts on a new login or a new token.
  A failed frame's `result` moves the turn, or ends it with the failure's words.
- [`code://packages/agent-claude/src/plugin.ts`](../../../../packages/agent-claude/src/plugin.ts) - the adapter beside the engine over one record of open logins; each failure logged, and the host asked to check that login.

## Verified

- The CLI 2.1.301 that SDK 0.3.301 runs, read for its sign-in.
  The adapter cites it for each value: the authorize URL, the token URL, the code page, the client id, the scope and the expiry.
- The same CLI, read for how a request fails, as *Searches performed* in the plan says.
  Each kind sits in `FAILOVER` or `REFUSED` by its HTTP status, read against the API's errors page.
- A real CLI 2.1.301, run with one scratch configuration folder per case.
  A refused `CLAUDE_CODE_OAUTH_TOKEN` does not fall back to a sign-in in the same folder.
- `curl` against the API with a Claude OAuth token and with an invalid one: `POST /v1/messages/count_tokens` answered 200 and 401, and 404 for a retired model.
- `packages/agent-claude/test/agent-claude-login-adapter.test.ts`: 9 cases, all failing on the code before task 01.
- `packages/sdk/test/agents-channel.test.ts`: 5 cases for a field that names a connector, 4 failing on the code before task 02.
- `packages/agent-claude/test/agent-claude-logins.test.ts`: 27 cases.
  Each task's record says which of its cases fail on the code before it, and why the others pass there.
- The suites pass at one worker: agent-claude, 440 cases; sdk, 3689 with 2 skipped; server, 1632 with 2 skipped.
  Three earlier runs of the server suite each timed out one to three cases that start a daemon, while the machine was loaded.
  The cases differed from run to run.
  The same `usage-port` case timed out on upstream main's code in that window, and each case passes alone.
- Boundary, typecheck, build and schema pass.

## Departures from the plan

- None.

## Left for later

- None.
