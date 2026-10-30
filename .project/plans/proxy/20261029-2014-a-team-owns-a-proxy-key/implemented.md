---
title: A team owns a proxy key - implemented
date: 2026-10-30
refs:
  - git://84ed83bf - the proxy answers a team key and charges it to the team
  - git://f90fd339 - the token commands mint, list and revoke a team key
  - git://2d622c94 - a token record names a user or a team, and `verifyTeamKey` answers the team
  - "[code://packages/sdk/src/access/users.ts#L1219-L1250](../../../../packages/sdk/src/access/users.ts#L1219-L1250) - `teamPrincipalOf`"
  - "[code://packages/sdk/src/access/users.ts#L1441-L1453](../../../../packages/sdk/src/access/users.ts#L1441-L1453) - `verifyTeamKey`"
  - "[code://packages/sdk/src/access/users.ts#L1678-L1833](../../../../packages/sdk/src/access/users.ts#L1678-L1833) - `mintToken`, with the team's checks"
  - "[code://packages/sdk/src/access/tokens.ts#L104-L221](../../../../packages/sdk/src/access/tokens.ts#L104-L221) - `teamParam`, `boundTeam` and the three commands"
  - "[code://packages/server/src/commands/token.ts#L149-L330](../../../../packages/server/src/commands/token.ts#L149-L330) - `--team` on the three subcommands"
  - "[code://packages/server/src/proxy/caller.ts#L94-L145](../../../../packages/server/src/proxy/caller.ts#L94-L145) - `callerOf` asks `verifyTeamKey`"
  - "[code://packages/server/src/proxy/listener.ts#L295-L303](../../../../packages/server/src/proxy/listener.ts#L295-L303) - `poolsOf` names each pool once"
  - "[code://packages/server/src/proxy/listener.ts#L482-L505](../../../../packages/server/src/proxy/listener.ts#L482-L505) - `chargedAs` charges a team key as `team:<team>`"
  - "[code://packages/sdk/src/access/decide.ts#L132-L146](../../../../packages/sdk/src/access/decide.ts#L132-L146) - `scoped` never matches a `user:` row for a team"
---

A team holds a key of its own, and a proxy call made with it is the team's.
The call is answered as `team:<team>`, the record's owner is `team:<team>`, and the team pays.
A team key is minted, listed and revoked like a person's, with `--team` in place of `--user`.
Root and a caller who holds `user:write` reach all three.
It opens the proxy and no other door: the websocket, `/api` and the daemon's own port refuse it.

## What was built

- [`code://packages/sdk/src/types/users.ts`](../../../../packages/sdk/src/types/users.ts) - `TokenRecord` and `MintedToken` name exactly one of `user` and `team`, `Principal` gains `team`, and `Users` gains `verifyTeamKey` and a `mintToken` that takes a team.
- [`code://packages/sdk/src/access/users.ts`](../../../../packages/sdk/src/access/users.ts) - the reader refuses a record that names both or neither.
  `teamPrincipalOf` reads the team's record live, and `verifyTeamKey` answers its team, while `verify` refuses a team key.
  `mintToken` takes the team's branch.
- [`code://packages/sdk/src/access/tokens.ts`](../../../../packages/sdk/src/access/tokens.ts) - `teamParam` on the three commands, `boundTeam` for a caller, and `authorize` answering false for a team.
- [`code://packages/server/src/commands/token.ts`](../../../../packages/server/src/commands/token.ts) - `--team` on `token mint`, `list` and `rm`, in place of `--user`.
- [`code://packages/server/src/proxy/caller.ts`](../../../../packages/server/src/proxy/caller.ts) - `callerOf` asks `verifyTeamKey` when `verify` answers nothing, and holds the answer to `standing` and `can` as a person's.
- [`code://packages/server/src/proxy/listener.ts`](../../../../packages/server/src/proxy/listener.ts) - `chargedAs` writes the owner `team:<team>` for a principal with `team`, and `poolsOf` names each pool once.
- [`code://packages/sdk/src/access/decide.ts`](../../../../packages/sdk/src/access/decide.ts) - `scoped` never matches a `user:` row when the principal names a team.
- [`code://docs/server/USERS.md`](../../../../docs/server/USERS.md), [`code://docs/server/PROXY.md`](../../../../docs/server/PROXY.md) and [`code://docs/sdk/AUTHENTICATION.md`](../../../../docs/sdk/AUTHENTICATION.md) - how a team key is minted, what it opens, and how a call with it is charged.

## Verified

- `packages/sdk/test/users-tokens.test.ts` - the record, the principal, the mint's refusals and the readers of a broken record.
- `packages/sdk/test/token-methods.test.ts` and `packages/server/test/token-command.test.ts` - `team` and `--team` on the three commands, and who may reach them.
- `packages/server/test/proxy-listener.test.ts` - a team key's call is answered and recorded as `team:backend` with one pool.
  A grant the key does not hold is refused, and `/v1/models` lists what the team's rows allow and what a `user:team:backend` deny row does not.
- `packages/server/test/proxy-policy-usage.test.ts` - the record's owner, `team` and pools, a `user:` row holding no team key, and a `team:backend` deny row refusing one.
- `packages/server/test/server-http.test.ts` - the same key reaches `/v1/models` and is 401 on `/api` and at the websocket's door.
- `pnpm exec tsc -p tsconfig.json --noEmit` passes, and the full suite passes: 460 files, 7699 tests.

## Departures from the plan

- `verifyTeamKey` is optional on `Users`, so a hand-built `Users` literal without it still satisfies the port; `callerOf` asks it only when it is there.
- `poolsOf` drops repeated pool names with a `Set`.
  A team key's owner is `team:<team>`, which is the team's pool too.
  `usage.charge` adds to every pool it is given, so a repeated name would count the team twice.
- `token mint --url` with `--team` is refused rather than printing an address the websocket would refuse; the plan did not name this case.
- `token list` has no person column, so a team key's line shows `team <team>` after the label, and the "every grant of" fallback names the team.
- A team principal's `memberships` are `[team]`, or `[team, <project>]` for a key scoped to one of the team's projects.
  `scopeFor` resolves the key's scope that way, while the principal belongs to that team alone.

## Left for later

- none.
