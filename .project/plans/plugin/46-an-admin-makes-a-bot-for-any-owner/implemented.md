---
title: An admin makes a bot for any owner - implemented
date: 2026-10-11
refs:
  - git://a8da02e - the build is 3d1ad9c and a8da02e, merged in 3506063; the review fix is the commit that closes this plan
  - "[code://packages/bot/src/provider.ts](../../../../packages/bot/src/provider.ts) - `ownerFor`, `mayLink` and `manifest`"
  - "[code://packages/bot/src/record.ts](../../../../packages/bot/src/record.ts) - `sameOwner` and the owner check on an edit"
---

A holder of `*:*` makes a bot for any user, team, project or this host.
Any `root:` owner is this host, so a renamed machine keeps its bots and their sessions.
The bot manifest gives `root:<hostName>` as a `const` in `owner`.

## What was built

- [`code://packages/bot/src/provider.ts`](../../../../packages/bot/src/provider.ts) - `ownerFor` lets an admin name any owner and records a named `root:` as `root:<hostName>`. An edit keeps the owner on record. `mayLink` uses `sameOwner`, and `manifest(hostName)` replaces `MANIFEST`.
- [`code://packages/bot/src/record.ts`](../../../../packages/bot/src/record.ts) - `sameOwner`, which `checkRecord` uses to compare the owner an edit names.
- `docs/BOTS.md` gives the owner rule for an admin and for the host.

## Verified

- `packages/bot/test/bot-provider.test.ts` has the eight cases from task 01, and one case from the review for an edit that names the host under another name.
- With the review fix removed from `checkRecord`, that case fails.
- Reviewed on 2026-10-11; `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/bot` pass.

## Departures from the plan

- a8da02e - any `root:` owner is this host, from the decision above. The plan named only `root:<hostName>`.
- Review fix - an edit that names the host under an older or newer name is accepted, and the owner on record does not change.

## Left for later

- none.
