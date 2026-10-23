---
title: An adapter runs an action
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/types/connectors.ts#L1-L12](../../../../packages/sdk/src/types/connectors.ts#L1-L12) - the header to rewrite"
  - "[code://packages/sdk/src/types/connectors.ts#L101-L120](../../../../packages/sdk/src/types/connectors.ts#L101-L120) - `Adapter`, which gets `run`"
  - "[code://packages/sdk/src/connectors/channel.ts#L94-L112](../../../../packages/sdk/src/connectors/channel.ts#L94-L112) - `ConnectorsChannel`, which gets `run`"
  - "[code://packages/sdk/src/connectors/channel.ts#L274-L282](../../../../packages/sdk/src/connectors/channel.ts#L274-L282) - `mayRead`, the owner check"
  - "[code://packages/sdk/src/connectors/channel.ts#L325-L348](../../../../packages/sdk/src/connectors/channel.ts#L325-L348) - `close` and `openOne`, which keep the open connector"
  - "[code://packages/sdk/src/plugins/validate.ts#L535-L565](../../../../packages/sdk/src/plugins/validate.ts#L535-L565) - `checkAdapter`"
---

## Objective

An adapter may answer `run(connector, action, input)`.
`ConnectorsChannel.run(id, reader, action, input)` checks the connector live and calls it.

## Files

- `UPDATE: packages/sdk/src/types/connectors.ts:1-12` - the header says that an `action` runs through `run`.
- `UPDATE: packages/sdk/src/types/connectors.ts:101-120` - add `run?(connector: Connector, action: string, input: Record<string, unknown>): Promise<unknown>`.
- `UPDATE: packages/sdk/src/connectors/channel.ts:94-112` - add `run` to `ConnectorsChannel`.
- `UPDATE: packages/sdk/src/connectors/channel.ts:325-348` - the `open` map keeps the connector beside its stop.
- `UPDATE: packages/sdk/src/plugins/validate.ts:535-565` - `run`, where present, is a function.
- `UPDATE: packages/sdk/test/connectors-channel.test.ts` - the cases below.

## Steps

1. Add `run?` to `Adapter`, with a comment that says what the host gives it and what it answers.
2. Change the `open` map value to `{ connector: Connector; stop?: () => void | Promise<void> }`.
3. In `openOne`, keep the built `Connector` in that entry.
4. In `close`, read `stop` from the entry.
5. Add `run(id, reader, action, input)` to the channel.
6. Make `run` throw when the id is not in `open`.
7. Make `run` throw when the adapter has no `run`, or no `action` capability of that name.
8. Make `run` throw when `mayRead(id, reader)` is false.
9. Otherwise, call `adapter.run(entry.connector, action, input)` and answer its result.
10. Give each throw a message that names the reason, and no secret.
11. In `checkAdapter`, refuse a `run` that is not a function.
12. Add the tests, and run the sdk tests.

## Validation

- `connectors-channel.test.ts`: a call on an open connector reaches `adapter.run` with the resolved config.
- `connectors-channel.test.ts`: a call after a remove, or on a connector that never opened, fails.
- `connectors-channel.test.ts`: a reader with no `connector:list`, or another person's connector, fails.
- `connectors-channel.test.ts`: an action name that is not an `action` capability fails.
- `plugin-host.test.ts` or the `checkAdapter` test: `registerAdapter` refuses a `run` that is not a function.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume
