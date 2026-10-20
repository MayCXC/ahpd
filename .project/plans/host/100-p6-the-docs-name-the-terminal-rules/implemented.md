---
title: The docs name the terminal rules - implemented
date: 2026-10-19
refs:
  - git://f356474b
  - "[code://docs/sdk/AHP.md](../../../../docs/sdk/AHP.md)"
  - "[code://docs/server/CONFIGURE.md](../../../../docs/server/CONFIGURE.md)"
  - "[code://docs/plugins/PLUGINS.md](../../../../docs/plugins/PLUGINS.md)"
  - "[code://docs/sdk/HOST.md](../../../../docs/sdk/HOST.md)"
---

The docs now say that the host acts on the terminal rules and on `editAutoApprovePatterns`.
They say whose rules apply, that a deny asks, how a write redirect is checked, and that only an approved command is `not-needed`.
They name the daemon default and the two ways another parser replaces the splitter.

## What was built

- [`code://docs/sdk/AHP.md`](../../../../docs/sdk/AHP.md) - the three keys in the list the host acts on, and five keys that a connection owns.
- [`code://docs/server/CONFIGURE.md`](../../../../docs/server/CONFIGURE.md) - a `Terminal rules` section for `terminalAutoApproveDefaults` and `commandParser`, and `commandParser` in the list of keys with no flag.
- [`code://docs/plugins/PLUGINS.md`](../../../../docs/plugins/PLUGINS.md) - `registerCommandParser` in the register table, and `What a command parser has to answer`.
- [`code://docs/sdk/HOST.md`](../../../../docs/sdk/HOST.md) - the keys read, the keys per connection, and the grants row for a terminal key.
- [`code://packages/sdk/src/vscoderootconfig.ts`](../../../../packages/sdk/src/vscoderootconfig.ts) - the header names the five keys this host reads.
- [`code://packages/sdk/src/host/root.ts`](../../../../packages/sdk/src/host/root.ts) - its comment counts ten keys, with `eligibleForAutoApproval`.

## Verified

- The sections above are in the docs on `main`, merged in PR 31.
- The prose lint found no new finding in `AHP.md`, `HOST.md` and `PLUGINS.md`, and none in `CONFIGURE.md`.
- Softov reviewed the plan on 2026-10-19 and approved the close.

## Departures from the plan

- Task 01 - the plugin method is in `docs/plugins/PLUGINS.md`, beside the other ports, and not in `docs/sdk/HOST.md` as the Files list said. HOST.md links to it from the `commandParser` key.
- Task 01 - `packages/sdk/src/host/root.ts` changed too, and the Files list did not name it.

## Left for later

- Nothing.
