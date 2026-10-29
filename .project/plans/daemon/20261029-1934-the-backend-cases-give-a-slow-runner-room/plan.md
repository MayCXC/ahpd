---
title: The backend cases give a slow runner room
domain: daemon
status: built
priority: medium
created: 2026-10-29
revalidated: 2026-10-29
refs:
  - "[code://packages/server/test/daemon-backend.test.ts#L35-L60](../../../../packages/server/test/daemon-backend.test.ts#L35-L60) - `run`, which stops its daemon if it has not ended"
  - "[code://packages/server/test/daemon-backend.test.ts#L62-L145](../../../../packages/server/test/daemon-backend.test.ts#L62-L145) - the cases"
  - "[code://vitest.config.ts#L25-L34](../../../../vitest.config.ts#L25-L34) - `testTimeout`: 5 s, and 20 s on Windows"
  - "[code://packages/server/test/cli.ts#L173](../../../../packages/server/test/cli.ts#L173) - the command-line harness stops a daemon that has not ended after 15000 ms"
  - "[code://packages/server/test/server-cli-restart.test.ts#L46](../../../../packages/server/test/server-cli-restart.test.ts#L46) - a case that starts a daemon carries 60000 ms, as in records-channels, policy-option and plugins-channel-stdio"
  - "git://afab59a2 - the logins tests' cooldowns, lengthened so a slow runner does not end them early"
---

## Goal

Each case in `daemon-backend.test.ts` runs a daemon to its own end on a slow runner.
A daemon that never ends is still stopped, and its case still fails on an assertion before its own timeout.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "setTimeout|10000" packages/server/test/daemon-backend.test.ts` - one wait, 4000 ms, and two cases with their own timeout.
- `rg -n "15000|60000" packages/server/test` - the harness's wait for a daemon, and the timeout of the cases that start one.

### Runtime path

```
case -> run -> spawn the daemon on a pipe -> close its stdin -> wait for its exit, then kill it
daemon -> load its source through the loader -> read its plugins -> announce -> see the peer gone -> exit 0
```

### Gaps

- On a loaded machine the daemon takes more than 4 s to reach its end. The wait kills a daemon that was about to end, and the case fails.
- Five cases run on the suite's 5 s timeout, which leaves no room for a longer wait.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A test's timing outlasts a slow runner | afab59a2, the logins tests' cooldowns | 01 |
| The wait for a daemon to end is the harness's, 15000 ms | `cli.ts` L173 | 01 |
| A case that runs a daemon carries 60000 ms | `server-cli-restart.test.ts` L46, and the other cases that start one | 01 |
| The wait stays below its case's timeout, so a daemon that never ends fails an assertion | The comment at the wait, `daemon-backend.test.ts` L55-L56 | 01 |

## Proposed architecture

- **Data flow** - the wait in `run` and each case's timeout, written as the suite writes them.
- **Layer responsibilities** - server tests: `daemon-backend.test.ts`.
- **Source-of-truth files** - [`code://packages/server/test/daemon-backend.test.ts`](../../../../packages/server/test/daemon-backend.test.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The wait and the cases give a slow start room](task-01-the-wait-and-the-cases-give-a-slow-start-room.md) | done | - |

## Risks and tradeoffs

- A daemon that never ends holds its case for 15 s before the case fails.

## Resume state

- **Done so far:** planned and built 2026-10-29. See [implemented.md](implemented.md).
- **Next action:** the checks below, on a quiet machine, before this is offered upstream.
- **Open questions:** none.
- **Watch out for:** nothing.

## Final verification checklist

- [ ] The file passes on a quiet machine.
- [ ] `pnpm -s typecheck` exits 0.
- [ ] The server suite passes on a quiet machine.
