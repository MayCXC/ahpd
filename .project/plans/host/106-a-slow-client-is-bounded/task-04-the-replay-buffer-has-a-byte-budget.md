---
title: The replay buffer has a byte budget
status: done
depends: [task-02-the-limits-are-host-config-keys.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host.ts#L370-L379](../../../../packages/sdk/src/host.ts#L370-L379) - `REPLAY` and `replayable`"
  - "[code://packages/sdk/src/host.ts#L644-L646](../../../../packages/sdk/src/host.ts#L644-L646) - the clone and the shift"
  - "[code://packages/sdk/src/host/handshake.ts#L463-L490](../../../../packages/sdk/src/host/handshake.ts#L463-L490) - the oldest entry decides between replay and snapshots"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L404](../../../../packages/sdk/src/host/sessionmethods.ts#L404) - another reader of `replayable`"
  - "file:///github/agent-host-protocol/docs/specification/lifecycle.md - a gap past the buffer gets snapshots"
---

## Objective

The replay buffer drops its oldest envelopes while it holds more bytes than `replayBytes`, as it does past its count.

## Files

- `UPDATE: packages/sdk/src/host.ts:370-379` - a running byte total beside `REPLAY`, checked against `replayBytes`.
- `UPDATE: packages/sdk/src/host.ts:644-646` - add the size of a new envelope, and drop the oldest past either limit.
- `UPDATE: packages/sdk/test` - large actions shorten the buffer, and a reconnect past it gets snapshots.

## Steps

1. Keep each envelope's size beside it in `replayable`.
2. Measure the size once, as the length of the envelope's serialised text, when the host buffers it.
3. Add the size to a running total, and subtract it when the buffer drops the envelope.
4. Drop the oldest envelope while the count or the total is past its limit.
5. Read the budget from the reader of task 02 at each push.
6. Keep the newest envelope, even when it is larger than the budget alone.
7. Check that `handshake.ts` and `sessionmethods.ts` read nothing that the new field breaks.
8. Write the tests.
9. Set this task and the plan row to `implemented`.

## Validation

- A test: actions larger than the budget over ten leave fewer than ten envelopes in the buffer.
- A test: a client that reconnects from before the oldest envelope gets snapshots.
- A test: small actions still keep 1000 envelopes.
- `pnpm -s build`, `pnpm -s typecheck` and the vitest gate pass.

## Resume

- **Done so far:** built 2026-10-16. `host.ts` keeps a `weights: number[]` in step with `replayable` and a running `weight`, measured once at each push as the length of the envelope's serialised text, and the drop loop past either limit reads `replayBytes(ctx.rootConfig)` at that push, so a pushed value applies to the next action. The newest envelope is kept whatever it weighs on its own (`replayable.length > 1`), because one action heavier than the whole budget is still the state this host holds. The size is held beside the buffer rather than on the envelope, which is what step 7 decides: `seenBy` hands most held entries back to a client verbatim, so a `size` field would be a field no client declared - `handshake.ts` and `sessionmethods.ts` read only `channel` and `serverSeq` off an entry, so neither is affected either way. Tests: two in `host-handshake.test.ts` under 'a client that dropped, coming back' - ten `annotations/set` actions of ~300 KiB each against a pushed `replayBytes` of 1 MiB leave the buffer shorter than ten (a reconnect from before it gets a snapshot, one from inside it a replay), and 1100 small `session/isReadChanged` actions still keep the thousand, so a gap of exactly 1000 replays and 1001 snapshots.
- **Next action:** build task 05.
- **Open questions:** none.
- **Watch out for:** the test pushes `replayBytes: 1024 * 1024`, the floor, because ten of those actions would not pass the 32 MiB default; the same test with the default pushed fails, which is how the budget was confirmed to bite. `annotations/set` is the action used because it is accepted repeatedly, where a `chat/turnStarted` is refused while a turn runs and the buffer never fills. `packages/sdk/test/fixtures/wire.jsonl` is dirty from the runs and needs `git checkout -- packages/sdk/test/fixtures/wire.jsonl`, which is denied in this session.
