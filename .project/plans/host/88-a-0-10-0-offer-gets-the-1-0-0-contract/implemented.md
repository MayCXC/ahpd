---
title: A 0.10.0 offer gets the 1.0.0 contract - implemented
date: 2026-10-15
refs:
  - git://eff49f2d
  - "[code://packages/sdk/src/host/handshake.ts](../../../../packages/sdk/src/host/handshake.ts)"
---

A VS Code 1.141 window that offers `0.10.0` gets `0.10.0` back, so it keeps a read state for each chat.

## What was built

- [`code://packages/sdk/src/host/handshake.ts`](../../../../packages/sdk/src/host/handshake.ts) - `LEGACY_COMPATIBLE_VERSION` and `SPOKEN_VERSIONS`, and the `0.10.0` rule after the package negotiation, the same rule as VS Code's `negotiateAgentHostProtocolVersion`.
- [`code://packages/sdk/test/host-handshake.test.ts`](../../../../packages/sdk/test/host-handshake.test.ts) - the offers, the refusal list, `-32602` for a malformed entry, and no canvas action for a `0.10.0` client.
- [`code://packages/sdk/test/ahp-test-cases.test.ts`](../../../../packages/sdk/test/ahp-test-cases.test.ts) - the package's version table against `negotiateProtocolVersion`, and through the host for each row that does not offer `0.10.0`.
- `docs/AHP.md` says the host speaks `0.10.0`.

## Verified

- `host-handshake.test.ts` and `ahp-test-cases.test.ts` pass 687 of 687 on main, 2026-10-15.
- On an isolated daemon, 2026-10-15: `['0.10.0','0.9.0']` got `0.10.0`, `['1.0.0','0.10.0']` got `1.0.0`, and `['0.8.0']` got `-32005` with `1.0.0`, `0.10.0` and `0.9.0`.

## Departures from the plan

- The package's version table expects a refusal for two rows that offer `0.10.0`. The table runs against the package's own negotiation, as VS Code does, by Softov's answer.

## Left for later

- A plan that adds a canvas action must gate it for real, because `isActionKnownToVersion` answers true for canvas at `0.10.0`.
