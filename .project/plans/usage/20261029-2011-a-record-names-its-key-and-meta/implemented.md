---
title: A record names its key and its meta - implemented
date: 2026-10-29
refs:
  - git://daa0fe8c - the last commit before this record
  - "[code://packages/sdk/src/access/meta.ts](../../../../packages/sdk/src/access/meta.ts)"
  - "[code://packages/sdk/src/types/usage.ts](../../../../packages/sdk/src/types/usage.ts)"
  - "[code://packages/sdk/src/types/users.ts](../../../../packages/sdk/src/types/users.ts)"
  - "[code://packages/server/src/proxy/caller.ts](../../../../packages/server/src/proxy/caller.ts)"
  - "[code://packages/server/src/proxy/listener.ts](../../../../packages/server/src/proxy/listener.ts)"
  - "[code://packages/server/src/commands/token.ts](../../../../packages/server/src/commands/token.ts)"
---

A proxy record of a call made with a key now holds the key's id in `token` and the names the key and the call gave in `meta`. A key is minted with `meta` by `ahpd token mint --meta`, by the `meta` param of `x-ahpd/tokens/mint`, and `ahpd token list` prints it.

## What was built

- [`code://packages/sdk/src/access/meta.ts`](../../../../packages/sdk/src/access/meta.ts) - `checkMeta` checks one map: a name of 1 to 64 characters of `[A-Za-z0-9_.-]`, a value of at most 256 characters with no comma and no line break, and at most 32 entries. `parseMeta` reads `k=v,k=v`, refuses a part with no `=`, and refuses a name written twice. Both throw `RpcError(INVALID_PARAMS)` with one sentence.
- [`code://packages/sdk/src/types/usage.ts`](../../../../packages/sdk/src/types/usage.ts) - `UsageBase.token` and `UsageBase.meta` are the key and the names, present only on a proxy record made with a key.
- [`code://packages/sdk/src/types/users.ts`](../../../../packages/sdk/src/types/users.ts) - `TokenRecord.meta` is what a key says about itself, and `Principal.keyMeta` is the same read at each call. The mint options take `meta`.
- [`code://packages/sdk/src/access/users.ts`](../../../../packages/sdk/src/access/users.ts) - the tokens file reader checks `meta` with `checkMeta` and reports a bad one as a broken file. `mintToken` checks it and writes it. `principalOf` answers `keyMeta` from the live token record, as `keyScope` does.
- [`code://packages/sdk/src/access/tokens.ts`](../../../../packages/sdk/src/access/tokens.ts) - `x-ahpd/tokens/mint` takes `meta` as an object of names to values and refuses anything `checkMeta` refuses.
- [`code://packages/server/src/commands/token.ts`](../../../../packages/server/src/commands/token.ts) - `--meta NAME=VALUE` is repeatable on `token mint`, and a name written twice across two flags is refused. Each `token list` line that has meta prints `meta k=v,k=v`.
- [`code://packages/server/src/proxy/caller.ts`](../../../../packages/server/src/proxy/caller.ts) - `META_HEADER` is `x-ahp-meta`. A person's caller carries the header's entries under the key's `keyMeta`, and a name the key holds keeps the key's value. A header that will not parse, and a merge over 32 entries, is a 400 refusal.
- [`code://packages/server/src/proxy/listener.ts`](../../../../packages/server/src/proxy/listener.ts) - `Charged.meta` and `Charged.token` reach `record`, which writes them when they have a value. Every `x-ahp-*` header stays on the host.
- `docs/server/PROXY.md`, `docs/server/USERS.md`, `docs/sdk/USAGE.md` and `docs/sdk/USERS.md` describe the header, the flag, the param and the two record fields.
- `.project/specs/usage.md` names `token` and `meta` in the record base, and says a proxy call made with a key carries them.

## Verified

- `packages/sdk/test/meta.test.ts`, 7 cases: each bound at its limit is accepted and one past it is refused; `a=1, b=2` parses to two entries; `a`, `=1`, `a=1,a=2` and `a=x,y` are refused.
- `packages/sdk/test/users-tokens.test.ts`, 28 cases: a mint with meta writes it, and a tokens file with a bad meta is reported as broken.
- `packages/sdk/test/token-methods.test.ts`, 12 cases: the `meta` param is refused with one sentence, and a mint and a list answer it.
- `packages/server/test/token-command.test.ts`, 17 cases: two `--meta` flags reach the record, and `token list` shows them.
- `packages/server/test/proxy-listener.test.ts`, 45 cases: `X-AHP-Meta: a=1, b=2` reaches the record; `bad` is 400 with `invalid_request_error`; the provider never receives the header; a key at the bound and a call that adds one are refused 400.
- `packages/server/test/proxy-policy-usage.test.ts`, 26 cases: a key writes `token`; a key with `env=prod` and a header with `env=dev,client=pi` writes `{ env: prod, client: pi }`; the deployment token and a full sign-in write no `token`.
- `pnpm exec tsc -p tsconfig.json --noEmit` prints nothing.
- The whole suite, `pnpm exec vitest run --maxWorkers=3 --testTimeout=30000`: 459 files passed and 1 skipped (460), 7662 tests passed and 29 skipped (7691), exit 0, 669 seconds.

## Departures from the plan

- Task 03's Files do not name `docs/sdk/USERS.md`. Its param table and its mint paragraph also had to describe `meta`, because the SDK doc is where the RPC param is written.
- Task 03's Files do not name `.project/specs/usage.md`. A spec is corrected in place when behaviour changes, and the record base it lists had no `token` or `meta`.
- The plan does not decide what an empty `X-AHP-Meta` header does. It parses to `{}` and names no meta, rather than a 400, because it asks for nothing.
- The plan does not say when the header is read. It is read after the scope answer, so a call that names another scope is refused 403 before a malformed header is looked at.
- The plan's status is `implemented`, as the instruction for this build asked. The skill's plan statuses do not include that value, so `scripts/plans.mjs` shows a plan status it does not know.

## Left for later

- The last two checks in the plan's final list were not run by hand: a real `--meta env=prod` mint with an `X-AHP-Meta: client=pi` call, and a bad header at a running proxy. The tests above cover the same paths.
- `packages/sdk/src/access/meta.ts` and `packages/sdk/test/meta.test.ts` are untracked. `git add` is denied in this session, so run `git add packages/sdk/src/access/meta.ts packages/sdk/test/meta.test.ts` to commit them with task 02's code.
- The suite rewrote `packages/sdk/test/fixtures/wire.jsonl` and the restore is denied here. Run `git checkout -- packages/sdk/test/fixtures/wire.jsonl` before committing.
