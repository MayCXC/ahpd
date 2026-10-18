---
title: The listing looks up recorded sessions
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/catalogue.ts#L812-L829](../../../../packages/sdk/src/host/catalogue.ts#L812-L829) - the nested block, the pattern to copy"
  - "[code://packages/sdk/src/host/history.ts#L275-L290](../../../../packages/sdk/src/host/history.ts#L275-L290) - `findOf`, the provider order and the folder for `find`"
  - "[code://packages/sdk/src/types/sessions.ts#L314](../../../../packages/sdk/src/types/sessions.ts#L314) - `nestedSessions`, the shape for a new list"
---

## Objective

`listing` adds a row for each recorded session in a folder that no answering backend read.
It finds the row with `agent.find(id, { workingDirectory })`, asking the recorded provider first.

## Files

- `UPDATE: packages/sdk/src/types/sessions.ts` - an optional store method that lists every recorded session id with its folder.
- `UPDATE: packages/sdk/src/sessions.ts` - the file store and its wrapper implement the new method.
- `UPDATE: packages/sdk/src/host/catalogue.ts` - the lookup block in `listing`, after the nested block.
- `UPDATE: packages/sdk/test` - the restart, refresh and worktree cases.

## Steps

1. Read how the file store keeps `workingDirectory` and `provider` for a session.
2. Add an optional `recordedFolders()` to the store type that returns each id with its folder.
3. Implement it in the file store and in the wrapper in `sessions.ts`.
4. In `listing`, collect each recorded id whose folder is not in `read`.
5. Skip an id in `claimed`, `offered` or `found`, and a nested id.
6. Ask the recorded provider's `find` first, then the other agents, as `findOf` does.
7. Run the lookups with `Promise.all`, and fold the answers in the order of the ids.
8. Pass each row that a lookup finds to `adopt`, and push it to `found`.
9. Ignore a lookup that throws or finds nothing.
10. Write the tests.
11. Set this task and the plan row to `implemented`.

## Validation

- A test: after a restart, a session recorded in a folder outside `paths` is in the first listing.
- A test: two refreshes keep the row and send no `root/sessionRemoved`.
- A test: the listing shows a session in a worktree folder in the same way.
- A test: a session already listed by a backend is not looked up.
- A test: a lookup that throws adds no row and leaves the record.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs` and the vitest gate pass.

## Resume

Not started.
