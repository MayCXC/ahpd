---
title: The host publishes each agent account
status: done
depends: [task-01-the-claude-probe-reports-its-account.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host.ts#L1023-L1043](../../../../packages/sdk/src/host.ts#L1023-L1043) - the boot probe loop"
  - "[code://packages/sdk/src/host.ts#L570-L593](../../../../packages/sdk/src/host.ts#L570-L593) - the filter per connection"
  - "[code://packages/sdk/src/host/gate.ts#L355-L356](../../../../packages/sdk/src/host/gate.ts#L355-L356) - `seesConfig`"
  - "[code://packages/sdk/src/access/users.ts#L30-L61](../../../../packages/sdk/src/access/users.ts#L30-L61) - the roles and the subjects"
---

## Objective

The host keeps one account per agent and publishes it as a root config value shaped like `vscode.codexAccount`.
A connection that is not root and does not hold `account:read` gets no account value.

## Files

- `UPDATE: packages/sdk/src/host.ts:1023-1043` - the probe loop keeps `offered.account` per agent.
- `UPDATE: packages/sdk/src/host.ts:570-593` - the filter drops the account values for a connection without the grant.
- `UPDATE: packages/sdk/src/host/root.ts:233-344` - the account keys are root config values that a client cannot write.
- `UPDATE: packages/sdk/src/host/gate.ts:355-356` - `seesAccount` beside `seesConfig`.
- `UPDATE: packages/sdk/src/access/users.ts:43-61` - the `account` subject, with `account:read`.
- `UPDATE: packages/sdk/src/types/agent.ts:492-504` - an event that a running agent sends when its account changes.
- `UPDATE: packages/sdk/test` - the account reaches a connection with the grant and not one without it.

## Steps

1. Read decision `an-agent-account-is-shown-to-account-readers.md`.
2. Keep the account of each agent from its probe.
3. Add the event that a running agent sends when its account changes.
4. Publish the Codex account under `vscode.codexAccount`, and the others under an ahpd key named after it.
5. Refuse a client write to an account key.
6. Add the `account` subject to `users.ts`, with `read` as its one operation.
7. Filter the account values for each connection with `seesAccount`.
8. Filter the snapshot of the root state the same way.
9. Write the tests.
10. Set this task and the plan row to `implemented`.

## Validation

- A test: a root connection gets the account in its snapshot and in each change.
- A test: a guest connection gets no account value in its snapshot or in a change.
- A test: a member given `account:read` gets the account.
- A test: the host refuses a client write to an account key.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary`, the schema gate and the vitest gate pass.

## Resume

Done. One account per backend is kept in `Learned.account` (`packages/sdk/src/host/state.ts`), which is the map `ctx.about(provider)` answers, and the account is published as a root config value under `accountKey(provider)`: `vscode.codexAccount` for Codex, which is where VS Code's own window reads it, and `ahpd.<provider>Account` for every other backend, because VS Code has a name for Codex only. The key is deliberately not declared in `ROOT_CONFIG_SCHEMA`, so step 5 needs no new code: a client push naming it is refused by the path every undeclared key takes (`root config does not declare ahpd.claudeAccount`), which is also what VS Code's own host does with the value - it publishes it into `config.values` with `publishRootTransientValues` and declares no property for it.

Two paths fill it, both ending in the same call:

- the boot probe loop (`host.ts`), which keeps `offered.account` when the probe had one;
- a running session, through the new `Start.onAccount(account)` event, mirrored on `SessionOptions`, wired in `spawn.ts` where the other backend events are.

`learnAccount(provider, account)` in `packages/sdk/src/host/catalogue.ts`, beside `learnModels`, records the value and dispatches a partial `root/configChanged` carrying the one key, which merges. `seesAccount` in `host/gate.ts` is the gate, asked as `account:status`; the snapshot overlay is in `host/root.ts` (`accountValues`), and the per-change filter is in `seenBy`, where the value is dropped for a connection without the grant - the same shape the daemon's own keys already take.

**Deliberate deviation, step 6:** the task says the `account` subject has `read` as its one operation. It has `status` instead, in the read group, and the gate asks `account:status`. `read` and `write` are the two groups and are operations nowhere - `users.test.ts:714-737` asserts this of every subject in the table, and the comment on `OPERATIONS` says it in so many words - so a subject with an operation called `read` would make `account:read` mean one act and the whole of what a role may read at once. A role holding `account:read` still covers the read, through `holds`, which is what the plan's answer asks for.

Files this task changed, so the work can be committed on its own:

- `packages/sdk/src/types/agent.ts` - `Start.onAccount`
- `packages/sdk/src/types/session.ts` - the mirror of it
- `packages/sdk/src/host/state.ts` - `Learned.account`
- `packages/sdk/src/host/gate.ts` - `seesAccount`
- `packages/sdk/src/host/root.ts` - `accountKey`, `accountValues`, the snapshot overlay
- `packages/sdk/src/host/catalogue.ts` - `learnAccount`
- `packages/sdk/src/host/spawn.ts` - the `onAccount` wiring
- `packages/sdk/src/host.ts` - the probe loop, `isAccountKey`, the `seenBy` filter
- `packages/sdk/src/access/users.ts` - the `account` subject and its `SUBJECTS` entry
- `packages/sdk/test/root-account.test.ts` (new), `packages/sdk/test/users-host.test.ts` (the two key lists)
- `docs/sdk/USERS.md` - the row and the count, which `users.test.ts` reads the table against
- `.project/plans/host/99-a-client-sees-the-agent-account/plan.md` and this file

Gates at this state: `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs` and `git diff --quiet tools/` pass. `pnpm -s exec vitest run packages/sdk` passes 2982 of 2983, the one failure being `nested-start.test.ts` timing out at the 5s default - it passes in 8.7s with `--testTimeout=20000`, and it is the known load flake, not this change. `packages/sdk/test/fixtures/wire.jsonl` was rewritten by the run and could not be restored here (`git checkout --` is denied in this mode); nothing in it carries an account key, because the recording's client is not root and holds no `account:read`.
