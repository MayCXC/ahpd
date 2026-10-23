---
title: A cofold transcript skips a run that a rewind dropped while it reads
domain: plugin
status: planned
priority: medium
created: 2026-10-23
revalidated: 2026-10-23
requires: []
changes: []
creates: []
refs:
  - "[code://packages/agent-cofold/src/transcript.ts#L197-L276](../../../../packages/agent-cofold/src/transcript.ts#L197-L276) - `turnsOf`, which lists the runs and then reads the events of each one"
  - "[code://packages/agent-cofold/src/agent.ts#L786-L793](../../../../packages/agent-cofold/src/agent.ts#L786-L793) - `delete`, the pattern: a `not_found` from the store means the row is gone"
  - "[code://packages/agent-cofold/src/agent.ts#L804-L808](../../../../packages/agent-cofold/src/agent.ts#L804-L808) - `transcript`, the one caller of `turnsOf`"
  - "[code://packages/agent-cofold/src/runs.ts#L43-L45](../../../../packages/agent-cofold/src/runs.ts#L43-L45) - a rewind calls `store.sessions.truncate`"
  - "[code://packages/agent-cofold/test/agent-cofold-fork.test.ts#L181-L197](../../../../packages/agent-cofold/test/agent-cofold-fork.test.ts#L181-L197) - the rewind test that polls the transcript during the rewind, and failed on CI"
  - "[code://packages/agent-cofold/test/agent-cofold-store.test.ts#L20-L35](../../../../packages/agent-cofold/test/agent-cofold-store.test.ts#L20-L35) - the test that wraps `createFileStore`, the pattern for a store that fails on one run"
  - "npm://@cofold/store-file@0.2.2 - `truncate` rewrites the messages, then removes the run folders one by one; `listEvents` throws `not_found` for a removed run"
  - "https://github.com/softov/ahpd/actions/runs/39895618696 - the CI run on PR 69 that failed with `StoreError: run ... not_found`"
---

## Goal

A cofold transcript read during a rewind answers the turns, and does not fail.
A run that the rewind removed between the run list and its events is skipped.

## Reconnaissance

The files read are the `refs` above, each with its note.
The first CI run on PR 69 failed on 2026-10-22 in `agent-cofold-fork.test.ts`, and passed on a rerun.

### Searches performed

- `rg -n "listEvents|requests.get" packages/agent-cofold/src/transcript.ts` - two store reads for each run, at lines 248 and 267.
- `rg -n "not_found" packages/agent-cofold/src` - `delete` already reads `not_found` as a row that is gone.
- `rg -n "not_found|async get" @cofold/store-file/dist/store.js` - `listEvents` throws `not_found` for a removed run, and `requests.get` answers `undefined`.

### Runtime path

```
client reads the transcript -> agent.transcript -> turnsOf: listMessages, runs.list
  rewind in the same time -> truncate: rewrite messages.jsonl, remove runs/<runId>/
turnsOf -> runs.listEvents(removed run) -> StoreError not_found -> the whole read fails
```

### Gaps

- `turnsOf` lets a `not_found` from `listEvents` end the read, so a client gets an error instead of the turns.
- The rewind test fails on CI when its poll reads the transcript during the rewind.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Plan the fix, not a problem file | Softov, 2026-10-23, "plan the fix" | - |
| A run whose events answer `not_found` is skipped whole, with no usage, end or duration for its turn | (defaulted: the run is gone, and the next read has no trace of it) | 01 |
| Every other store error still fails the read | (defaulted: only `not_found` means the row is gone, as in `delete`) | 01 |
| A session removed during the read is out of scope | (defaulted: `transcript` checks the session first, and a removed session is a separate case) | - |

## Proposed architecture

- **Data flow** - `turnsOf` reads the events of a run before it records anything about that run, and skips the run on `not_found`.
- **Layer responsibilities** - agent-cofold: the skip and its test. docs: the changelog.
- **Source-of-truth files** - [`code://packages/agent-cofold/src/transcript.ts`](../../../../packages/agent-cofold/src/transcript.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The transcript skips a run that is gone](task-01-the-transcript-skips-a-run-that-is-gone.md) | implemented | - |

## Risks and tradeoffs

- A read during a rewind can show the messages from before the cut, with no usage on the dropped turns.
  The next read shows the conversation after the cut.

## Resume state

- **Done so far:** task 01 is implemented. `turnsOf` reads a run's events before it records that run's usage, model, ending and duration. A `not_found` from the store skips the run, so a transcript read during a rewind answers the turns that remain. Every other store error still fails the read, which a `writer_busy` case pins. The changelog says so.
- **Next action:** the Final verification checklist, by hand, before the plan is reviewed.
- **Open questions:** none.
- **Watch out for:** the fork test passed five times here. The CI failure it came from is what the checklist has to confirm.

## Final verification checklist

- [ ] `agent-cofold-store.test.ts` has a case where a run is gone between the run list and its events, and the transcript answers the turns.
- [ ] `agent-cofold-fork.test.ts` passes on CI.
- [ ] `plans/index.md` updated.
