---
title: The documents say 1.1.0
status: todo
depends: [02, 03, 04, 05]
layer: "docs"
refs:
  - "[code://README.md#L9](../../../../README.md#L9) - the AHP badge"
  - "[code://docs/sdk/AHP.md](../../../../docs/sdk/AHP.md) - the protocol page"
  - "[code://UPSTREAM.md#L11-L16](../../../../UPSTREAM.md#L11-L16) - the Pass 7 boxes"
---

## Objective

The README, the protocol page and UPSTREAM.md say what ahpd serves of AHP 1.1.0, and what it leaves out.

## Files

- `UPDATE: README.md:9` - the badge says 1.1.0.
- `UPDATE: docs/sdk/AHP.md` - per-chat config, the shared pending list, and the experimental parts left out.
- `UPDATE: UPSTREAM.md:11-16` - tick the three boxes that the tasks built.

## Steps

1. Change the badge to 1.1.0.
2. Add the per-chat config and the pending list to `docs/sdk/AHP.md`, one paragraph each.
3. State in `docs/sdk/AHP.md` that windowed delivery and the TCP channel are not served.
4. Tick each Pass 7 box when its task has the status `done`.

## Validation

- `node /home/softov/.claude/skills/do-spec/scripts/lint-prose.mjs docs/sdk/AHP.md` shows no new finding.
- `pnpm docs:build` passes.

## Resume

