---
title: Docs
status: done
depends: [task-01-a-need-value-is-read-from-the-vault.md]
layer: "docs"
refs:
  - "[code://docs/plugins/COMPUTERS.md](../../../../docs/plugins/COMPUTERS.md) - `## Profiles`, where a profile's `needs` are described"
---

## Objective

`docs/plugins/COMPUTERS.md` says a need value may name a secret, when it is read, and which scopes a machine may read.

## Files

- `UPDATE: docs/plugins/COMPUTERS.md` - under `## Profiles`, a need value written `{ "$secret": "<name>" }`, read when the machine is made, for its owner and team; a pointer to `docs/server/REFERENCE.md`'s vault section for setting one.

## Steps

1. One sentence per line, no em dash, no hard wrap.

## Validation

- The example in the docs is one `computer-needs.test.ts` runs.

## Resume
