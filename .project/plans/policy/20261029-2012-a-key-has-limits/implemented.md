---
title: A key has spend and call limits - implemented
date: 2026-10-29
refs:
  - "[code://packages/sdk/src/types/users.ts](../../../../packages/sdk/src/types/users.ts)"
  - "[code://packages/sdk/src/access/policies.ts](../../../../packages/sdk/src/access/policies.ts)"
  - "[code://packages/sdk/src/access/decide.ts](../../../../packages/sdk/src/access/decide.ts)"
  - "[code://packages/sdk/src/usage/charge.ts](../../../../packages/sdk/src/usage/charge.ts)"
  - "[code://packages/server/src/proxy/listener.ts](../../../../packages/server/src/proxy/listener.ts)"
  - "[code://packages/server/src/commands/token.ts](../../../../packages/server/src/commands/token.ts)"
---

A minted token carries spend and call limits of its own, written `amount:measure:period`. A proxy call made with the key is refused once one of them has no room, with the key's sentence. The limits only narrow: they never allow a model no policy allows, they never stop the charge to a person's or a team's limits, and they hold for a `*:*` holder and with `policies.check` off.

## What was built

- [`code://packages/sdk/src/types/users.ts`](../../../../packages/sdk/src/types/users.ts) - `TokenRecord` gets `limits?: PolicyLimit[]`, the mint options take `limits`, and `Principal` gets `keyLimits`, read from the live token record so a revoked or expired key answers none.
- [`code://packages/sdk/src/types/policies.ts`](../../../../packages/sdk/src/types/policies.ts) - `PolicyScope` gets `token:${string}` for the row a key's limits make.
- [`code://packages/sdk/src/access/policies.ts`](../../../../packages/sdk/src/access/policies.ts) - `checkKeyLimits` runs `limitOf` for the `model` kind, fills a missing `pool` with `shared` and refuses `each`. `checkPolicy` refuses a `token:` scope and a `pool` that starts with `token:`.
- [`code://packages/sdk/src/access/users.ts`](../../../../packages/sdk/src/access/users.ts) - the tokens file reader and `mintToken` check `limits` with `checkKeyLimits`, and `principalOf` answers `keyLimits` from the record.
- [`code://packages/sdk/src/access/tokens.ts`](../../../../packages/sdk/src/access/tokens.ts) - `x-ahpd/tokens/mint` takes `limits` as a list, refused as `INVALID_PARAMS` when `checkKeyLimits` refuses one.
- [`code://packages/sdk/src/access/decide.ts`](../../../../packages/sdk/src/access/decide.ts) - `keyRowOf` writes `{ id: token:<id>, scope: token:<id>, kind: model, match: { model: ['*'] }, limits, cap: true, pool: token:<id> }`, `scoped` matches a `token:` row against `principal.token`, and `decide` adds the row to an allowed `model` decision, never counting it as an allow. A `*:*` holder gets the row alone.
- [`code://packages/sdk/src/usage/charge.ts`](../../../../packages/sdk/src/usage/charge.ts) - `levelOf` puts a `token:` row before the person's own, so the cap is walked first and a team row still pays.
- [`code://packages/server/src/proxy/listener.ts`](../../../../packages/server/src/proxy/listener.ts) - `policyFor` walks the key's row alone with the switch off, when a usage store is there.
- [`code://packages/server/src/commands/token.ts`](../../../../packages/server/src/commands/token.ts) - `--limit <amount>:<measure>:<period>`, repeatable, split at the two colons; a value that is not three parts or whose amount is not a number is refused with one sentence. `token list` shows each limit as `limit 5 usd/day`.
- `docs/sdk/POLICY.md` names the key's row, its key and its refusal; `docs/server/USERS.md` documents `--limit`; `docs/server/PROXY.md` names a key's limit in the 403 row.

## Verified

- `pnpm exec tsc -p tsconfig.json --noEmit` passes.
- The suite runs with `pnpm exec vitest run --maxWorkers=2 --testTimeout=20000` after `pnpm -s schema`.

## Departures from the plan

- `token mint`'s `limits` field is a list of strings, `amount:measure:period`, because it is one flag value with no spaces; `x-ahpd/tokens/mint` takes the objects. Both end in `checkKeyLimits`.
- The key's row is written for a `model` decision only, so an agent or a computer check gets no row: the measures a key holds are a `model` row's.
