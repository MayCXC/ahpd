---
title: A session names its connectors
status: implemented
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

- **Done so far:** every step, 1 to 11, and their tests.
  - `packages/sdk/src/connectors/bindings.ts` holds `BINDINGS_KEY`, `BINDINGS_SCHEME`, `Binding`, `bindingTarget` and `bindingsOf`. A value is read only as `connectors://<adapter>/<id>` with both halves record slugs, and an alias only as a record slug; anything else is skipped rather than refused.
  - `connectors` is in `HOSTS_OWN`, `mineOf` keeps it when it is an object of strings, and `hostSchema` declares it as `{ type: 'object', title: 'Connectors', description: 'The connectors this session may use, by name.', additionalProperties: { type: 'string' }, sessionMutable: false }`.
  - `PluginHost.registerBindings(read)`, `BindingsReader`, `ServedBindings` and `Contribution.bindings` are in `types/plugin.ts`; `plugins.ts` refuses a second reader from one plugin, keeps every plugin's reader, and folds them into `HostOptions.bindings`.
  - `sessionBindings(uri)` in `tooling.ts` joins the plugin readers in fold order and the session's `connectors` key over them (the session key wins a shared alias), and is read live. `shapedDefinition` and `instructions` both pass `{ titleStrategy, config: kept.config(idOf(uri)), bindings }`.
  - Step 5, on Softov's answer of 2026-10-23: `HostOptions.connectors?: { refs: () => readonly ConnectorRef[] }` is added here (`{ refs }` only; task 03 extends it with `run`), `run.ts` passes `connectors: { refs: () => connectorLists.refs() }`, and `checkBindings(held, owner, refs)` in `bindings.ts` refuses a start in `openSession` whose value names no connector of that adapter, or one `sameOwnerOrHost` says the owner may not read. A host with no `connectors` option checks nothing, as `checkReferences` does with no listing.
  - Tests: `connectors-bindings.test.ts` (4), `plugin-fold.test.ts` (3 new), `host-sessionconfig.test.ts` (the schema and the kept map, and 3 new for the start: another person's connector, a connector this host does not serve, and the host's own taken), `host-tools.test.ts` (3 new: the key, a plugin reader with the key over it, and a reader read again for the next list). Build, typecheck and boundary pass; the five touched test files pass.
- **Next action:** task 03.
- **Files:** `packages/sdk/src/connectors/bindings.ts`, `packages/sdk/src/host/common.ts`, `packages/sdk/src/host/sessionconfig.ts`, `packages/sdk/src/types/plugin.ts`, `packages/sdk/src/plugins/plugins.ts`, `packages/sdk/src/types/host.ts`, `packages/sdk/src/host/tooling.ts`, `packages/sdk/src/index.ts`, `packages/server/src/commands/run.ts`, and - for the store fix under Departures - `packages/sdk/src/host/lifecycle.ts`, `packages/sdk/src/host/sessionmethods.ts`, `packages/sdk/src/host/automations.ts`. Tests: `packages/sdk/test/connectors-bindings.test.ts`, `packages/sdk/test/plugin-fold.test.ts`, `packages/sdk/test/host-sessionconfig.test.ts`, `packages/sdk/test/host-tools.test.ts`.
- **Open questions:** none.
- **Departures:** a session's config reaches `kept.config` only through `openSession`, and the three callers passed `backendsOwn(config)`, so `connectors` (now a host key) would never have been stored and `forSession` would never have seen it. `openSession` now stores the config it is given and hands the backend `backendsOwn(config)`, and the three callers pass the full config. That fix is accepted for now, to be reviewed in the diff. The start check also lives in `openSession` rather than in `sessionconfig.ts` as the Files list says, because `sessionconfig.ts` has no start hook and the owner the check reads is the one `openSession` is handed; the helper itself is in `bindings.ts`.
- **Watch out for:** `chatactions.ts` compares host-key values by identity against `settled`, so a client that re-sends the whole config bag with a fresh `connectors` object reads as a change and starts the session again - the same latent issue `worktreeIncludeFiles` already has with arrays. And `chatactions.ts:351` still drops host keys from a `session/configChanged` on a session with no agent, so a binding has to arrive on `createSession` rather than in a later config change.
