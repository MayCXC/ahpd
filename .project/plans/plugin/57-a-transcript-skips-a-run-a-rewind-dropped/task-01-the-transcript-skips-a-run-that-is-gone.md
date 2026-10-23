---
title: The transcript skips a run that is gone
status: todo
depends: []
layer: "agent-cofold"
refs:
  - "[code://packages/agent-cofold/src/transcript.ts#L231-L276](../../../../packages/agent-cofold/src/transcript.ts#L231-L276) - the loop over the runs"
  - "[code://packages/agent-cofold/src/agent.ts#L786-L793](../../../../packages/agent-cofold/src/agent.ts#L786-L793) - the `not_found` check to copy"
  - "[code://packages/agent-cofold/test/agent-cofold-store.test.ts#L20-L35](../../../../packages/agent-cofold/test/agent-cofold-store.test.ts#L20-L35) - the wrapped `createFileStore`"
---

## Objective

`turnsOf` skips a run whose events the store answers with `not_found`.
The transcript then answers the turns that remain, and does not fail.

## Files

- `UPDATE: packages/agent-cofold/src/transcript.ts:231-276` - read the events first, and skip the run on `not_found`.
- `UPDATE: packages/agent-cofold/test/agent-cofold-store.test.ts` - a case where a run is gone between the run list and its events.
- `UPDATE: CHANGELOG.md` - a cofold transcript read during a rewind no longer fails.

## Steps

1. In the loop over the runs, call `store.runs.listEvents` first.
2. Catch an error whose `code` is `not_found`, and continue to the next run.
3. Throw every other error again.
4. Move the `usage`, `ending`, `model` and `duration` writes after the events read.
5. Add a comment on the catch that says a rewind can remove a run during the read.
6. Add a test that removes one run's folder after `runs.list` and before its `listEvents`.
7. Make the test expect the transcript to answer the turns, with no usage on the removed turn.
8. Add a test where `listEvents` throws another error, and expect the transcript to fail.
9. Add a changelog line.
10. Run the agent-cofold tests, and set this task and the plan row to `implemented`.

## Validation

- `agent-cofold-store.test.ts`: the transcript skips a run removed during the read, and answers the turns.
- `agent-cofold-store.test.ts`: an error other than `not_found` still fails the read.
- `agent-cofold-fork.test.ts` passes.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.
