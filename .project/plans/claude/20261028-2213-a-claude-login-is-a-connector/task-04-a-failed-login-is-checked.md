---
title: A failed login is checked
status: done
depends: [task-03-a-failed-login-hands-the-turn-on.md]
layer: "agent-claude"
refs:
  - "[code://packages/server/src/proxy/listener.ts#L719-L726](../../../../packages/server/src/proxy/listener.ts#L719-L726) - the proxy's log line, and the outcome it notes on a connector's health"
  - "[code://packages/bot/src/plugin.ts#L420-L445](../../../../packages/bot/src/plugin.ts#L420-L445) - a plugin's connection to its host, opened by the first thing that needs it"
  - "[code://docs/plugins/PLUGINS.md#L860-L885](../../../../docs/plugins/PLUGINS.md#L860-L885) - a plugin is a client of its own host, with the grants its configuration gives it"
  - "[code://packages/agent-claude/README.md#L209-L239](../../../../packages/agent-claude/README.md#L209-L239) - *Several logins*, which this task writes for connectors and the proxy's rule"
---

## Objective

Each failure of a login goes to the plugin's log with the CLI's words, and asks the host to check that connector.
The README, the spec and the changelog say what a login is and what a failure of one does.

## Files

- `UPDATE: packages/agent-claude/src/logins.ts` - what a failure of a login calls.
- `UPDATE: packages/agent-claude/src/session/logins.ts` - a failure of a login reaches the open logins, with the CLI's words.
- `UPDATE: packages/agent-claude/src/plugin.ts` - a failure goes to the log and asks the host to check that connector, through the plugin's own connection.
- `UPDATE: packages/agent-claude/README.md:209-239` - the `logins` field as connector ids, the adapter, and what a failure does.
- `UPDATE: .project/specs/agent-backends.md:98-117` - the scenario of an agent on several logins.
- `UPDATE: CHANGELOG.md` - an entry under `0.14.1 - unreleased`.
- `UPDATE: packages/agent-claude/test/agent-claude-logins.test.ts` - the case below.

## Steps

1. Write `failed` in `OpenLogins`, which calls `onFailure` with the login's id and the CLI's words.
2. Call `failed` for each failure of a kind of `FAILOVER` or `REFUSED`.
3. Cut the login's token out of the CLI's words before they leave.
4. Open the plugin's connection to its host at the first failure, log the failure, and check that connector.
5. Write the field, the adapter and the failures into the README, the spec and the changelog.

## Validation

- `packages/agent-claude/test/agent-claude-logins.test.ts` holds this case:
  - A login's failure goes to the plugin's log and asks the host to check that connector.
    The checks go out on one connection, and the check asks the API.
- Run `pnpm vitest run packages/agent-claude/test/agent-claude-logins.test.ts`, and expect every case to pass.
- Run the new case on the code before this task, and expect it to fail.
- Run `lint-prose.mjs` on the README section and the spec scenario, and expect no finding.

## Resume

Done 2026-10-28.
The plugin's case fails on task 03's code: no request reaches the host.
A case stubs `fetch` before the plugin loads, because the adapter takes its `fetch` when it is built.
The README section and the spec scenario pass `lint-prose.mjs`.

