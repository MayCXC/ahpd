---
title: The sender hears its unchanged set
status: done
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/host/actions.ts#L713-L714](../../../../packages/sdk/src/host/actions.ts#L713-L714) - the silence guard"
  - "[code://packages/sdk/src/host.ts#L746-L757](../../../../packages/sdk/src/host.ts#L746-L757) - `refuse`, the shape of a message to the sender only"
  - "[code://packages/sdk/test/presence.test.ts#L121-L142](../../../../packages/sdk/test/presence.test.ts#L121-L142) - the tests to extend"
---

## Objective

An unchanged `session/activeClientSet` gets an echo with its `origin` to its sender only.
The other clients get nothing, as now.

## Files

- `UPDATE: packages/sdk/src/host.ts:746-757` - a helper beside `refuse` sends an accepted envelope to one peer, under the alias that peer watches.
- `UPDATE: packages/sdk/src/host/actions.ts:713-714` - the guard sends the echo to the sender before it returns.
- `UPDATE: packages/sdk/test/presence.test.ts:121-142` - the sender gets the echo and the other client gets nothing.

## Steps

1. Add a helper beside `refuse` that sends an envelope to one peer at the current `serverSeq`.
2. Do not move `serverSeq`, and do not put the envelope in the replay buffer.
3. Call the helper from the silence guard with the action and the sender's `origin`.
4. Leave `held`, `dispatch` and `retool` unchanged for a changed set.
5. Keep the log of a failed `setTools` in `retool` as it is.
6. Extend the test of the silence with the echo to the sender.
7. Set this task and the plan row to `implemented`.

## Validation

- `presence.test.ts`: an unchanged set gets one echo with its `clientSeq` and the current `serverSeq` on the sender's peer.
- `presence.test.ts`: the second client gets no action for the unchanged set.
- `presence.test.ts`: a changed set still reaches both clients.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume

Built 2026-10-16, uncommitted. The worktree holds `packages/sdk/src/host.ts`, `packages/sdk/src/host/context.ts`, `packages/sdk/src/host/actions.ts` and `packages/sdk/test/presence.test.ts`. `packages/sdk/test/fixtures/wire.jsonl` is dirty with the suite's own regeneration, which is not this task's; the restore command is denied here, so it is Softov's to run.

### What changed, file by file

- `packages/sdk/src/host.ts` - `echoTo(peer, channel, action, origin)`, beside `refuse`, sends one accepted envelope to one peer at the current `serverSeq`, under the name that peer watches the channel by, and without touching the replay buffer. The alias lookup `refuse` had inline is now `watchedAs(peer, channel)`, which both use (step 1, 2). `echoTo` is handed out on `ctx` beside `refuse`.
- `packages/sdk/src/host/context.ts` - `echoTo` on `HostContext`, documented as the accepted half of what `refuse` is the refused half of.
- `packages/sdk/src/host/actions.ts` - the silence guard in the `session/activeClientSet` handler echoes the action to its sender before it returns (step 3). `held`, `dispatch` and `retool` are untouched, and so is the log of a failed `setTools` (step 4, 5).
- `packages/sdk/test/presence.test.ts` - a new `envelopes` helper reads a whole envelope, for its `serverSeq` and its `origin`. The old *says nothing* case is now *echoes an unchanged announcement to its sender, and to nobody else*: a second client watches the same session, the sender hears the change plus one echo per unchanged announcement, each carrying the `clientSeq` it sent and the sequence the host is still at, and the other client hears the change alone (step 6). The changed-set case gained the same second client, which hears both changes.

### Verified

- `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs` and `git diff --quiet tools/` all clean.
- `pnpm -s exec vitest run packages/sdk --maxWorkers=2 --testTimeout=10000`: 149 files, 2979 tests, all pass.

### Decided while building

- The echo carries the action the client sent, not the `activeClient` this host rebuilt out of it. That is what the task says to hand the helper, and what `refuse` sends on the other path.
