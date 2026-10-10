---
title: The docs say what `origins` admits
status: implemented
depends: [task-02-the-api-answers-to-each-origin.md]
layer: "docs"
refs:
  - "[code://docs/HOST.md#L63](../../../../docs/HOST.md#L63) - the `host` key row"
  - "[code://docs/DAEMON.md#L298](../../../../docs/DAEMON.md#L298) - the `--resource` flag row"
  - "[code://docs/DAEMON.md#L706-L712](../../../../docs/DAEMON.md#L706-L712) - the paragraph on the names the API answers to"
  - "[code://packages/server/README.md#L127](../../../../packages/server/README.md#L127) - the `--resource` flag row"
---

## Objective

The docs list the key `origins` and the flag `--origin`, and they say when a deployment needs them.

## Files

- `UPDATE: docs/HOST.md:63` - add an `origins` row after `host`.
- `UPDATE: docs/DAEMON.md:298` - add an `--origin <url>` row after `--resource`.
- `UPDATE: docs/DAEMON.md:706-712` - add the configured origins to the list of names.
- `UPDATE: packages/server/README.md:127` - add an `--origin <url>` row after `--resource`.

## Steps

1. Write the HOST.md row: `origins`, a list of origins, none, "Extra origins a browser may reach this host by".
2. Say in that row that a host bound to `0.0.0.0` needs one to serve a page on its public address.
3. Write the flag rows with the description from task 01.
4. Add the configured origins to the DAEMON.md paragraph, and link the decision.
5. Match the wrap of each file you edit.

## Validation

- `rg -n "origins" docs/HOST.md docs/DAEMON.md packages/server/README.md` finds each new row and the paragraph.
- Every link you added resolves.

## Resume

Built. DAEMON.md, HOST.md and the server README have the key, the flag and the paragraph.
