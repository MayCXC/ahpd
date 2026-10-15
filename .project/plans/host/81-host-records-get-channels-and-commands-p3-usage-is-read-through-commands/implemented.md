---
title: Usage is read through commands - implemented
date: 2026-10-11
refs:
  - git://2e1803f - the build; the review fixes in 02a6f20 changed no usage code
  - "[code://packages/sdk/src/usage.ts](../../../../packages/sdk/src/usage.ts) - the answers, and `usageMethods`"
  - "[code://packages/server/src/commands/run.ts](../../../../packages/server/src/commands/run.ts) - where the daemon serves the usage commands"
---

A client reads usage with five typed commands, and gets each answer as JSON, not as text in a `data` string.
Each command answers what the matching `usage:` read answers, for the same readers.

## What was built

- [`code://packages/sdk/src/usage.ts`](../../../../packages/sdk/src/usage.ts) - `usageProvider` returns `answers`: `periods`, `range`, `records`, `groups`, `pools` and `readable`. `body` and `groupsBody` give the same answers as JSON text.
- [`code://packages/sdk/src/usage.ts`](../../../../packages/sdk/src/usage.ts) - `bounds` and `keysFrom` hold the refusal sentences that `rangeOf` and `keysAsked` had.
- [`code://packages/sdk/src/usage.ts`](../../../../packages/sdk/src/usage.ts) - `usageMethods(provider)`, the commands `pools`, `totals`, `range`, `records` and `groups`.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - the daemon adds the five commands to `base.methods` by `ahpd`.
- `docs/sdk/USAGE.md` has a section "Reading usage by command".

## Verified

- Every test in `usage.test.ts` and `usage-scheme.test.ts` passes with no change.
- `packages/sdk/test/usage-methods.test.ts` compares each command with its read.
- `packages/server/test/records-channels.test.ts` checks that the daemon advertises the usage commands.
- Reviewed on 2026-10-11; `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/bot packages/sdk packages/server` pass on main at 0fcd7ad (3705 cases).

## Departures from the plan

- Task 02 - `pools` answers `[{ pool, kind, name }]`, the listing of `usage://` with a name for each pool.
- Task 02 - each command also refuses in `handle` a pool that the reader may not read, as the read does after the gate.

## Left for later

- none.
