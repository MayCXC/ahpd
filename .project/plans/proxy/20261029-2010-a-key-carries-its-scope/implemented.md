---
title: A key carries the scope it charges - implemented
date: 2026-10-29
refs:
  - "[code://packages/sdk/src/types/users.ts](../../../../packages/sdk/src/types/users.ts)"
  - "[code://packages/sdk/src/access/users.ts](../../../../packages/sdk/src/access/users.ts)"
  - "[code://packages/sdk/src/usage/scopes.ts](../../../../packages/sdk/src/usage/scopes.ts)"
  - "[code://packages/sdk/src/access/tokens.ts](../../../../packages/sdk/src/access/tokens.ts)"
  - "[code://packages/server/src/commands/token.ts](../../../../packages/server/src/commands/token.ts)"
---

A key can now carry the team and project its calls are charged to.
`ahpd token mint --scope backend:ahpc` writes it on the token record after checking the person is in that scope now, and each call made with the key charges it when the call names none and is refused 403 when the call names another.
The scope is read from the live record at every call, so a membership taken away stops the key without a revoke.

## What was built

- `TokenRecord.scope?` in `packages/sdk/src/types/users.ts`, written `team` or `team:project`, and `mintToken`'s options gained `scope`. The tokens file reader refuses a record whose scope is not that shape, and reads the file as no tokens at all when it does.
- `mintToken` in `packages/sdk/src/access/users.ts` refuses a scope the person is not in now, one written `team:*`, and any scope on a host that names no team. The check runs after the grants and before the per-person token limit, so a refused mint spends no slot.
- `Principal.keyScope?` in `packages/sdk/src/types/users.ts`, defined in `principalOf` as a getter over the live token record: the record's `scope`, and nothing when the record is gone or belongs to somebody else.
- `scopeFor` in `packages/sdk/src/usage/scopes.ts` reads the key's scope before the primary. A call naming nothing is charged to the key's scope; a call naming another is refused with `this key charges <scope>, and the call names <named>`; a key whose scope the person no longer covers is refused with the `may name` sentence; a principal with no `keyScope` keeps the old order exactly.
- `x-ahpd/tokens/mint` takes a `scope` parameter, and a `scope` that is not a string is refused `-32602`.
- `ahpd token mint --scope TEAM[:PROJECT]` in `packages/server/src/commands/token.ts`, and `ahpd token list` prints `scope <team[:project]>` on each line that has one.
- The proxy caller and the session owners needed no code change: both resolve through `scopeFor`, so a scoped key charges a `/v1` call and a session opened over `/api` the same way.
- Docs: `docs/server/PROXY.md` ("Who may call", with pi as the example), `docs/server/USERS.md` (`token mint --scope` and the `token list` sentence) and `docs/sdk/USERS.md` (the mint's param table).

## Verified

- `pnpm typecheck` clean.
- `pnpm exec vitest run --maxWorkers=2 --testTimeout=30000` passes: 455 test files passed and 1 skipped, 7531 tests passed and 29 skipped, no failure, in 971 s.
- Plain `pnpm test` did not pass on this box under load: 22 files and 50 tests failed, every one a 5 s timeout in `agent-cofold`, `agent-acp` and the daemon-spawning server tests. A second run with `--maxWorkers=2 --testTimeout=20000` left `server-http.test.ts` failing once, on `the daemon never announced itself`; that file then passed 69/69 alone. No test in a file this plan touches failed in any run.
- `scopes.test.ts` (15), `users-tokens.test.ts` (24), `session-scope.test.ts` (14) and `proxy-listener.test.ts` (44) pass, 97 tests in all. `token-command.test.ts` and `token-methods.test.ts` pass too.
- `scopes.test.ts`: the key's scope wins over the primary when the call names none, the same name is allowed, another name is refused with the key's sentence (including `team:*`), a key whose membership was removed is refused with the `may name` sentence, and a principal with no `keyScope` resolves as before.
- `session-scope.test.ts`: a session opened with a key starts its scope picker on the key's scope and the work is charged there.
- `proxy-listener.test.ts`: a call with a scoped key and no header records `backend` and `ahpd`; the same call with `X-AHP-Scope: backend:billing` is 403; the same name and no name are both 200.
- `users-tokens.test.ts`: the mint writes the scope, refuses one the person is not in and one naming a wildcard, refuses any scope on a teamless host, and a tokens file with a scope that is not a place is read as no tokens.

## Departures from the plan

- `docs/sdk/USERS.md` gained a `scope?` row on the mint's param table and a sentence in the grants paragraph. The task's Files list named only the two server docs, but the sdk doc is the reference for `mintToken` and would otherwise describe a param the code has.
- The mint refuses `team:*` with the grammar sentence `backend:* is not a scope: a scope is team or team:project` rather than with `scopeFor`'s `may name` sentence. The plan's Validation gives the `may name` sentence to a team the person is not in; a wildcard is refused before it reaches the memberships.
- A scope that `scopeFor` would treat as no name, such as an empty string or `backend:`, is refused at the mint with the grammar sentence, so a mint can never write a record the reader rejects.

## Left for later

- The by-hand check is not run: pointing pi at the proxy with a scoped key needs a live host with a configured daemon, and `~/.config/ahpd` is not this session's to touch. The `/v1` path is pinned by `proxy-listener.test.ts` instead.
- The scope picker on a session still offers every membership the person holds, with only its default moved to the key's scope. A client that picks another is refused when the work is charged, not in the form.
- Team keys (plan `proxy/20261029-2014-a-team-owns-a-proxy-key`) and key limits (plan `policy/20261029-2012-a-key-has-limits`) build on this record.
