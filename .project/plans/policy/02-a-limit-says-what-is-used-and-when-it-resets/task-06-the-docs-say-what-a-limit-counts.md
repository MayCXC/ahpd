---
title: The docs say what a limit counts and how a client reads it
status: todo
depends: [task-04-a-turn-and-a-proxy-call-are-charged.md, task-05-a-client-reads-each-limit.md]
layer: "docs"
refs:
  - "[code://docs/sdk/POLICY.md#L97-L140](../../../../docs/sdk/POLICY.md#L97-L140) - what is checked, the refusal, and \"What this does not yet enforce\""
  - "[code://docs/sdk/USAGE.md](../../../../docs/sdk/USAGE.md) - the usage store, its pools and the `usage:` scheme"
  - "[code://docs/server/REFERENCE.md](../../../../docs/server/REFERENCE.md) - the `policies` and `usage` settings"
---

## Objective

The docs say how a limit is counted, which row pays, how a client reads a limit, and what waits for policy 03.

## Files

- `UPDATE: docs/sdk/POLICY.md:97-140` - a section on limits: the walk, the keys, the refusal, the reads; the gaps that are left.
- `UPDATE: docs/sdk/USAGE.md` - the days in `usage.timezone`, `turns`, `opens`, the policy keys and `usage://limits`.
- `UPDATE: docs/server/REFERENCE.md` - `policies.payOrder` and `policies.ownLimits`, and `usage.timezone` cutting the store's days.

## Steps

1. Write the section on limits in `POLICY.md`, with the walk for one measure as a short list.
2. Show the read of `policy://A2/limits` as a JSON example with a `shared` and an `each` limit.
3. Replace "What this does not yet enforce" with what waits: hours, sessions, the cancel during a turn, and charge rules.
4. Add the policy keys, `turns` and `usage://limits` to `USAGE.md`.
5. Add `payOrder` and `ownLimits` to `REFERENCE.md`, with their values and defaults.
6. Run `pnpm -s build` and check that the docs name only what the code has.

## Validation

- Each name in the docs is in the code: `rg -n "payOrder|ownLimits|opens|usage://limits" packages docs`.
- No em dash and no hard wrap in the changed lines.

## Resume

