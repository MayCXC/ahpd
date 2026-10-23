---
title: A session names its connectors
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/sessionconfig.ts#L241](../../../../packages/sdk/src/host/sessionconfig.ts#L241) - `hostSchema`, where the key goes"
  - "[code://packages/sdk/src/types/sessions.ts#L173-L174](../../../../packages/sdk/src/types/sessions.ts#L173-L174) - `config(id)`, which the filter reads"
  - "[code://packages/sdk/src/types/host.ts#L800-L808](../../../../packages/sdk/src/types/host.ts#L800-L808) - `forSession`, which gets the bindings"
  - "[code://packages/sdk/src/host/tooling.ts#L459-L463](../../../../packages/sdk/src/host/tooling.ts#L459-L463) - `shapedDefinition`, one reader of `forSession`"
  - "[code://packages/sdk/src/host/tooling.ts#L1852-L1866](../../../../packages/sdk/src/host/tooling.ts#L1852-L1866) - `instructions`, the other reader"
  - "[code://packages/sdk/src/automations/automations.ts#L310-L345](../../../../packages/sdk/src/automations/automations.ts#L310-L345) - the pattern for a value that names a connector"
---

## Objective

A session config key `connectors` maps an alias to `connectors://<adapter>/<id>`.
A plugin can also answer a session's bindings, which the host reads live.
`forSession` sees the session's bindings, so a tool can read them.

## Files

- `UPDATE: packages/sdk/src/host/sessionconfig.ts` - the host's `connectors` key and its check.
- `UPDATE: packages/sdk/src/types/host.ts:800-808` - the `forSession` argument gets `config?: Record<string, unknown>`.
- `UPDATE: packages/sdk/src/host/tooling.ts` - every `forSession` reader passes `kept.config(idOf(uri))`.
- `CREATE: packages/sdk/src/connectors/bindings.ts` - `bindingsOf(config)`, which reads the key as `{ alias, adapter, id }` rows.
- `UPDATE: packages/sdk/src/types/plugin.ts:892` - `registerBindings(read)` beside `registerSessionMeta`, where `read(session)` answers an alias map or nothing.
- `UPDATE: packages/sdk/src/plugins/plugins.ts` - keep each plugin's reader, and refuse a second one from the same plugin.
- `UPDATE: packages/sdk/test/host-sessionconfig.test.ts` - the key and its check.

## Steps

1. Write `bindingsOf(config)` in the new file.
2. Make it skip a value that is not `connectors://<adapter>/<id>`, and an alias that is not a lowercase slug.
3. Add `connectors` to `hostSchema`, as an object of strings with `sessionMutable: false`.
4. Give the key the title "Connectors" and the description "The connectors this session may use, by name."
5. Refuse a start whose `connectors` value names a connector the owner may not read, as `checkReferences` does.
6. Add `registerBindings(read)` to `PluginHost`, where `read` is synchronous.
7. Write `sessionBindings(uri)`, which joins each plugin reader's map and the session's `connectors` key.
8. On a shared alias, keep the session key's value.
9. Add `bindings` to the `forSession` argument type.
10. Pass `sessionBindings(uri)` at each `forSession` call in `tooling.ts`, at each tool list.
11. Add the tests, and run the sdk tests.

## Validation

- `host-sessionconfig.test.ts`: the session schema has `connectors`, and a start with a valid map keeps it.
- `host-sessionconfig.test.ts`: the host refuses a start that names another person's connector.
- A `bindingsOf` test: it skips a bad URI and a bad alias, and reads the rest.
- `host-tools.test.ts`: a `forSession` gets the session's bindings, from the key and from a plugin reader.
- `host-tools.test.ts`: a reader that answers a new map changes the next tool list.
- `pnpm -s build` and `pnpm -s typecheck` pass.

## Resume
