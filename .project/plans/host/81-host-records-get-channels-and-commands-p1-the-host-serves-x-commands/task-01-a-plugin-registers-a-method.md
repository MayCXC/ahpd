---
title: A plugin registers a method, and the daemon passes its own
status: todo
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L176-L262](../../../../packages/sdk/src/types/plugin.ts#L176-L262) - the channel types this task mirrors"
  - "[code://packages/sdk/src/plugins.ts#L957-L982](../../../../packages/sdk/src/plugins.ts#L957-L982) - `registerChannel`"
  - "[code://packages/sdk/src/validate.ts#L271](../../../../packages/sdk/src/validate.ts#L271) - `checkChannel`"
---

## Objective

`PluginHost.registerMethod(name, method)` records a served method, and `HostOptions.methods` holds the daemon's and every plugin's.

## Files

- `UPDATE: packages/sdk/src/types/plugin.ts` - `PluginMethod`, `ServedMethod`, `registerMethod`, and `methods` in the fold's result.
- `UPDATE: packages/sdk/src/types/host.ts:132-138` - `HostOptions.methods`, beside `channels`.
- `UPDATE: packages/sdk/src/validate.ts` - `checkMethod`, beside `checkChannel`.
- `UPDATE: packages/sdk/src/plugins.ts` - `registerMethod`, and the fold seeds `methods` from `base.methods`.
- `UPDATE: packages/sdk/src/index.ts` - export the new types.
- `UPDATE: packages/sdk/test/plugins.test.ts` - cases for the registration.

## Steps

1. Add `PluginMethod` with `grant`, an optional `authorize(params, reader)`, `handle(params, reader, client)` and an optional `describe()`.
2. Add `ServedMethod` with `by`, `name` and `method`.
3. Add `methods?: Record<string, ServedMethod>` to `HostOptions`.
4. Add `registerMethod(name, method)` to `PluginHost`, with a comment that names decision `a-plugin-serves-an-x-command`.
5. Remove `registerMethod` from the "Not here yet" comment on `PluginHost`.
6. Write `checkMethod` to refuse a name without `x-`, a bad grant and a missing `handle`.
7. In `plugins.ts`, seed `methods` from `base.methods`, the same as `channels`.
8. Refuse a name that the daemon or another plugin already serves, and name the holder.
9. Return `methods` from the fold beside `channels`.

## Validation

- `plugins.test.ts` registers `x-test/echo` and finds it in the fold's `methods`.
- A name without `x-`, a second `x-test/echo`, and a name the base holds are each refused with a sentence.
- `pnpm exec vitest run packages/sdk` passes.

## Resume

