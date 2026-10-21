---
title: One reserved list refuses a scheme and a harness
status: done
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/plugins/plugins.ts#L105-L115](../../../../packages/sdk/src/plugins/plugins.ts#L105-L115) - `reservedScheme`, which this task replaces"
  - "[code://packages/sdk/src/plugins/validate.ts#L86-L97](../../../../packages/sdk/src/plugins/validate.ts#L86-L97) - `checkAgent`"
  - "[code://packages/sdk/src/access/users.ts#L42-L60](../../../../packages/sdk/src/access/users.ts#L42-L60) - `SUBJECTS`"
---

## Objective

`reservedName(name)` says why a name is reserved, or answers nothing.
`registerResourceProvider` and `registerAgent` refuse a reserved name, and the plugin's contribution is dropped.

## Files

- `UPDATE: packages/sdk/src/plugins/plugins.ts:105-115` - `reservedScheme` becomes `reservedName`, which answers a reason or `undefined`.
- `UPDATE: packages/sdk/src/plugins/plugins.ts:918-929` - `registerResourceProvider` uses `reservedName` and puts the reason in its error.
- `UPDATE: packages/sdk/src/plugins/plugins.ts:883` - `registerAgent` refuses a `provider` that `reservedName` answers for.
- `UPDATE: packages/sdk/test/plugin-validate.test.ts` - cases for a reserved scheme and a reserved harness.

## Steps

1. Replace `reservedScheme` with `reservedName(name: string): string | undefined`.
2. Compare the name in lowercase.
3. Answer a reason for the prefixes `ahp-`, `ahpd-` and `x-`.
4. Answer a reason for `file`, `automations` and every entry in `SUBJECTS`.
5. Answer a reason for `http`, `https`, `ws`, `wss`, `data` and `mailto`.
6. Replace the call to `reservedScheme` in `registerResourceProvider` with a call to `reservedName`.
7. Call `reservedName` on `agent.provider` in `registerAgent`, after `checkAgent`.
8. Throw the same kind of error each registration throws now, with the reason in it.
9. Remove `reservedScheme`; `plugins.ts:921` is its only caller.

## Validation

- Make sure the fold drops a plugin with the scheme `ahp-root`, `ahpd-bots`, `x-thing`, `session` or `HTTPS`.
- Make sure the fold drops a plugin that registers the harness `ahp-chat`, `file`, `automations` or `user`, with one problem line.
- The harnesses `claude`, `pi`, `acp` and `cofold` and the schemes `bot`, `computer` and `push` still load.
- `pnpm exec vitest run packages/sdk packages/server` passes.

## Resume
