---
title: A harness and a scheme cannot share a name
status: done
depends: [task-01-one-reserved-list.md]
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/plugins/plugins.ts#L330-L382](../../../../packages/sdk/src/plugins/plugins.ts#L330-L382) - the fold, where a scheme or an agent clash is a problem"
  - "[code://packages/sdk/src/plugins/plugins.ts#L352](../../../../packages/sdk/src/plugins/plugins.ts#L352) - the agent provider clash this task mirrors"
---

## Objective

The fold refuses a harness whose name is a resource scheme, and a scheme whose name is a harness.
The daemon's own agents go through `reservedName` too.

## Files

- `UPDATE: packages/sdk/src/plugins/plugins.ts:330-382` - the fold compares the agent providers with the provider schemes, from the base and every plugin.
- `UPDATE: packages/sdk/src/host.ts` - `createHost` refuses a base agent whose `provider` `reservedName` answers for.
- `UPDATE: packages/sdk/test/plugin-validate.test.ts` - cases for both clashes.

## Steps

1. Collect the agent providers and the resource schemes in the fold, in lowercase.
2. Report a clash when a plugin's harness name is a scheme the base or an earlier plugin holds.
3. Report a clash when a plugin's scheme is a harness name the base or an earlier plugin holds.
4. Drop the later plugin's contribution, as an agent provider clash does now.
5. Check each base agent's `provider` with `reservedName` in `createHost`.
6. Throw at start for a reserved base agent, with the reason in the message.

## Validation

- Make sure the fold drops a plugin harness named `bot` beside the bot plugin, whichever loads first.
- Make sure the fold drops a plugin scheme named `claude` beside the Claude harness.
- `createHost` with a base agent named `ahp-root` throws.
- `pnpm exec vitest run packages/sdk packages/server` passes.

## Resume
