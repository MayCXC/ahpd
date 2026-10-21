---
title: The host says when memberships change
status: done
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/access/users.ts#L393](../../../../packages/sdk/src/access/users.ts#L393) - `fileUsers`"
  - "[code://packages/sdk/src/access/users.ts#L707](../../../../packages/sdk/src/access/users.ts#L707) - `write`, where the host changes the users file"
  - "[code://packages/sdk/src/types/users.ts#L252](../../../../packages/sdk/src/types/users.ts#L252) - `Users`, the port"
  - "[code://packages/sdk/src/types/events.ts#L29-L47](../../../../packages/sdk/src/types/events.ts#L29-L47) - `EventName`"
---

## Objective

A plugin hears `users_changed` when a person, a team, a project or a role changes.
The event fires for a hand edit of the users file and for a write the host makes.

## Files

- `UPDATE: packages/sdk/src/types/users.ts:252` - `Users` gets an optional `watch(onChange)` that answers a handle with `close()`.
- `UPDATE: packages/sdk/src/access/users.ts:393` - `fileUsers` implements `watch` with a watch on its file, and calls each listener after `write`.
- `UPDATE: packages/sdk/src/types/events.ts:29-47` - `EventName` gains `users_changed`, an event with no fields.
- `UPDATE: packages/sdk/src/host.ts` - the host watches its users directory when a plugin listens to `users_changed`, and closes the watch on close.
- `CREATE: packages/sdk/test/users-changed.test.ts` - a hand edit and a host write each fire the event once.

## Steps

1. Add `watch?(onChange: () => void): { close(): void }` to `Users`.
2. Implement `watch` in `fileUsers` with `node:fs` `watch` on the file's folder, filtered to the file name.
3. Coalesce the events of one save into one call.
4. Call each listener after `write` changes the file.
5. Add `users_changed` to `EventName` and to `HostEvent`.
6. In the host, open the watch only when a listener for `users_changed` exists.
7. Fire `users_changed` from the watch, and close the watch when the host closes.
8. Write the tests.

## Validation

1. Run `pnpm exec vitest run packages/sdk/test/users-changed.test.ts`.
2. Run `pnpm exec vitest run packages/sdk/test/plugin-events-fire.test.ts`, which must still pass.
3. Run `pnpm -s typecheck`.
