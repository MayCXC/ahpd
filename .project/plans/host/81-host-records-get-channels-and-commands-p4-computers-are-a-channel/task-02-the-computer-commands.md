---
title: The computer commands make, change and remove a machine
status: todo
depends: [task-01-the-computer-channel.md]
layer: "packages/computer"
refs:
  - "[code://packages/computer/src/provider.ts#L335-L430](../../../../packages/computer/src/provider.ts#L335-L430) - `write` and `remove`, whose rules the commands share"
---

## Objective

`x-ahpd/computers/create`, `start`, `stop`, `restart` and `remove` change a machine with the rules of the `computer:` scheme.

## Files

- `UPDATE: packages/computer/src/provider.ts:335-430` - `create`, `setState` and `destroy`, which `write` and `remove` call.
- `UPDATE: packages/computer/src/plugin.ts` - register the five methods with `host.registerMethod`.
- `CREATE: packages/computer/test/commands.test.ts` - each command beside its resource call.

## Steps

1. Move the create body of `write` into `create(name, manifest, owner)`.
2. Move the state body of `write` into `setState(name, state)`.
3. Move the body of `remove` into `destroy(name)`.
4. Call the three functions from `write` and `remove`, and keep every refusal sentence.
5. Register `create` with `{ name, manifest }`, and pass the caller as the owner.
6. Register `start`, `stop` and `restart` with `{ name }`, each on `setState`.
7. Register `remove` with `{ name }` on `destroy`.
8. Give `remove` the grant `computer:delete`, and give each other command `computer:put`.
9. Call `refresh` after each command.

## Validation

- `commands.test.ts` creates a machine with a command, and `resourceRead computer://<name>/state` reads it.
- A `create` with a body that a resource write refuses gets the same sentence.
- The host refuses `remove` from a caller without `computer:delete`.
- `pnpm exec vitest run packages/computer` passes.

## Resume

