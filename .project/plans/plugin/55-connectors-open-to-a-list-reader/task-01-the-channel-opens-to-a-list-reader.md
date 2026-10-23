---
title: The connectors channel opens to a list reader
status: implemented
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/connectors/channel.ts#L216-L233](../../../../packages/sdk/src/connectors/channel.ts#L216-L233) - `mayRead` and the gate"
  - "[code://packages/sdk/src/resources/recordschannel.ts#L39](../../../../packages/sdk/src/resources/recordschannel.ts#L39) - the `mayRead` option"
  - "[code://packages/sdk/src/resources/recordschannel.ts#L114-L115](../../../../packages/sdk/src/resources/recordschannel.ts#L114-L115) - `readable`"
  - "[code://packages/sdk/src/resources/recordschannel.ts#L249-L262](../../../../packages/sdk/src/resources/recordschannel.ts#L249-L262) - `authorize`"
  - "[code://packages/sdk/test/connectors-channel.test.ts](../../../../packages/sdk/test/connectors-channel.test.ts) - the channel's tests"
---

## Objective

A `connector:list` holder subscribes to `x-ahpd-connectors` with no readable row and reads an empty list.
The handshake and a refusal name `connector:list`.
A `connector:all` holder still reads every row.

## Files

- `UPDATE: packages/sdk/src/resources/recordschannel.ts` - an option that sends every reader's rows through `mayRead`, the gate holder included.
- `UPDATE: packages/sdk/src/connectors/channel.ts:216-233` - the gate `connector:list`, the new option, and `authorize` for `connector:all`.
- `UPDATE: packages/sdk/test/connectors-channel.test.ts` - the cases below.

## Steps

1. Add an option to the records channel that makes `readable` ask `mayRead` for every reader.
2. Keep the people channel's behaviour, where the gate grant reads every row.
3. Make `connector:list` the connectors channel's gate grant.
4. Turn on the new option in the connectors channel.
5. Give the connectors channel an `authorize` that admits a `connector:all` holder without `connector:list`.
6. Check that `mayRead` still answers `true` for `connector:all`.
7. Update the comment above the gate to say the new rule.
8. Run the SDK tests, and set this task and the plan row to `implemented`.

## Validation

- `connectors-channel.test.ts`: a `connector:list` holder subscribes to an empty store and reads no rows.
- `connectors-channel.test.ts`: a `connector:list` holder reads its own and the host's rows, and not another person's.
- `connectors-channel.test.ts`: a role with only `connector:all` subscribes and reads every row.
- `connectors-channel.test.ts`: the host refuses a reader with neither grant, and the refusal names `connector:list`.
- `connectors-channel.test.ts`: the handshake's `ahpd.channels` names `connector:list` for `x-ahpd-connectors`.
- The people channel's tests pass unchanged.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** `recordsChannel` takes two new options. `mayReadEveryReader` sends every reader's rows through `mayRead`, the holder of `grant` included, and is off by default, so the people channel is unchanged. `alsoGrant` names a second grant that `authorize` admits without a readable row, and that keeps a filtered subscribe working on an empty store. The connectors channel now has `connector:list` as its gate, turns `mayReadEveryReader` on, and names `connector:all` as `alsoGrant`; the comment above the gate says the new rule. The handshake and the refusal pick the gate grant up, since both read `channel.grant`. Tests: a lister and an all-only role both read an empty list, the refusal names `connector:list`, and `ahpd.channels` carries it for `x-ahpd-connectors`. `mayRead` is unchanged and still answers `true` for `connector:all`.
- **Next action:** none for this task; task 02 is next in the plan.
- **Files:** `packages/sdk/src/resources/recordschannel.ts`, `packages/sdk/src/connectors/channel.ts`, `packages/sdk/test/connectors-channel.test.ts`, this task file and the plan. The session cannot commit, so they are left in the worktree.
- **Open questions:** none.
- **Departures:** `alsoGrant` is a second option beside the one the task names ("an option that makes `readable` ask `mayRead` for every reader"), because `authorize` cannot admit a `connector:all` holder on an empty store from `mayRead` alone.
- **Watch out for:** `connector:all` does not hold `connector:list` in `OPERATIONS`, so the gate alone refuses an all-only role. That role is admitted by `authorize`, which is asked only when the gate grant is missing.
