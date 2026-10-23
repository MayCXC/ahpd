---
title: A piece is an adapter
status: todo
depends:
  - task-01-the-plugin-loads-pieces-in-a-child.md
layer: "connector-activepieces"
refs:
  - "[code://packages/sdk/src/types/connectors.ts#L25-L49](../../../../packages/sdk/src/types/connectors.ts#L25-L49) - `Capability`, with `input`"
  - "[code://packages/sdk/src/types/connectors.ts#L101-L120](../../../../packages/sdk/src/types/connectors.ts#L101-L120) - `Adapter`"
  - "[code://packages/sdk/src/plugins/validate.ts#L535-L565](../../../../packages/sdk/src/plugins/validate.ts#L535-L565) - `checkAdapter`, which each adapter must pass"
---

## Objective

Each piece that loads is one adapter, `ap-<name>`.
Its schema comes from the piece's `auth`, and each action is an `action` capability with an `input` schema.

## Files

- `CREATE: packages/connector-activepieces/src/mapping.ts` - `schemaOf(auth)`, `inputOf(props)` and `adapterOf(piece)`.
- `UPDATE: packages/connector-activepieces/src/plugin.ts` - register one adapter for each described piece.
- `CREATE: packages/connector-activepieces/test/mapping.test.ts` - the cases below.

## Steps

1. Name the adapter `ap-` and the package name after `@activepieces/piece-`.
2. For an array `auth`, use its first entry that is not `OAUTH2`.
3. Map `SECRET_TEXT` to one required `writeOnly` string, `secret_text`, with the auth's `displayName` as its title.
4. Map `CUSTOM_AUTH` to its props, with each `SECRET_TEXT` prop `writeOnly` and each required prop in `required`.
5. Skip a piece with no `SECRET_TEXT` or `CUSTOM_AUTH` entry, and report it.
6. Map `SHORT_TEXT` and `LONG_TEXT` to `string`, `NUMBER` to `number`, and `CHECKBOX` to `boolean`.
7. Map `ARRAY` to `array`, and `OBJECT`, `JSON` and `DYNAMIC` to `object`.
8. Map `STATIC_DROPDOWN` to a `string` with an `enum` of its option values.
9. Map `DROPDOWN` to a `string`, and add "Give the id." to its description.
10. Map `DATE_TIME` to a `string` with `format: date-time`.
11. Leave out each `MARKDOWN` prop and each optional `FILE` prop.
12. Leave out an action with a required `FILE` prop, and report it once for each piece.
13. Use `aiMetadata.description` as the capability's description when it exists, and the action's `description` if not.
14. Use the action's `name` as the capability's `name`, and its `displayName` as the `title`.
15. Add the tests, and run the package tests.

## Validation

- `mapping.test.ts`: a `SECRET_TEXT` auth gives one `writeOnly` field, `secret_text`.
- `mapping.test.ts`: Slack's array auth gives the `CUSTOM_AUTH` fields `botToken` and `userToken`, both `writeOnly`, with `botToken` required.
- `mapping.test.ts`: an `OAUTH2`-only piece gives no adapter.
- `mapping.test.ts`: each prop type gives its JSON type, and a `MARKDOWN` prop is not in the input.
- `mapping.test.ts`: an action with a required `FILE` prop is not a capability.
- `mapping.test.ts`: `checkAdapter` accepts each adapter.
- `pnpm -s typecheck` passes.

## Resume
