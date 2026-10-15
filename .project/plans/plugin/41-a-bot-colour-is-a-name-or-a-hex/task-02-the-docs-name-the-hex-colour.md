---
title: The docs name the hex colour
status: done
depends: [task-01-a-bot-colour-is-a-name-or-a-hex.md]
layer: "docs"
refs:
  - "[code://docs/plugins/BOTS.md#L16](../../../../docs/plugins/BOTS.md#L16) - the `color` row of the record table"
  - "[code://docs/plugins/BOTS.md#L27](../../../../docs/plugins/BOTS.md#L27) - the refusal for a colour outside the list"
  - "[code://docs/plugins/BOTS.md#L39-L43](../../../../docs/plugins/BOTS.md#L39-L43) - the bodies and colours"
  - "[code://packages/bot/README.md#L82](../../../../packages/bot/README.md#L82) - the package README on the colours"
---

## Objective

`docs/plugins/BOTS.md` and the package README say a colour is one of the eleven names or `#rrggbb`.

## Files

- `UPDATE: docs/plugins/BOTS.md:16` - the `color` row names the eleven names or a hex colour.
- `UPDATE: docs/plugins/BOTS.md:27` - a refused colour is one that is neither.
- `UPDATE: docs/plugins/BOTS.md:39-43` - one sentence on the hex colour, and that it is kept in lowercase.
- `UPDATE: packages/bot/README.md:82` - the same sentence as `docs/plugins/BOTS.md`.

## Steps

1. Update the `color` row in `docs/plugins/BOTS.md` to say "one of the eleven below, or a hex colour".
2. Update the refusal sentence in `docs/plugins/BOTS.md` to match.
3. Add one sentence on `#rrggbb` and the lowercase to the colours section.
4. Update the colours sentence in `packages/bot/README.md` to match.

## Validation

- Read both files and check that no other sentence says only eleven colours.

## Resume
