---
title: The backend cases give a slow runner room
domain: daemon
status: built
priority: medium
created: 2026-10-29
revalidated: 2026-10-29
refs:
  - "[code://packages/server/test/daemon-backend.test.ts#L35-L60](../../../../packages/server/test/daemon-backend.test.ts#L35-L60) - `run`, which stops its daemon after 4000 ms"
  - "[code://packages/server/test/daemon-backend.test.ts#L62-L146](../../../../packages/server/test/daemon-backend.test.ts#L62-L146) - the cases: five on the suite's timeout, two on 10000 ms"
  - "[code://vitest.config.ts#L25-L34](../../../../vitest.config.ts#L25-L34) - `testTimeout`: 5 s, and 20 s on Windows, where a process starts several times slower"
  - "[code://packages/server/test/server-cli-service.test.ts](../../../../packages/server/test/server-cli-service.test.ts) - command-line cases that start a daemon, each with 60000 ms"
  - "git://afab59a2 - the logins tests' cooldowns, lengthened so a slow runner does not end them early"
---

## Goal

Each case in `daemon-backend.test.ts` runs a daemon to its own end on a slow runner.
A daemon that never ends is still stopped, and its case still fails on an assertion before its own timeout.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "setTimeout|10000" packages/server/test/daemon-backend.test.ts` - one wait, 4000 ms, and two cases with their own timeout.
- `git log --follow -S4000 -- packages/server/test/daemon-backend.test.ts` - the wait came with the file, in 7372905b, which took Claude out of the daemon and loaded it as a plugin.

### Runtime path

```
case -> run -> spawn the daemon on a pipe -> close its stdin -> wait 4000 ms for its exit, then kill it
daemon -> load its source through the loader -> read its plugins -> announce -> see the peer gone -> exit 0
```

### Gaps

- On a loaded machine the daemon takes more than 4 s to reach its end. The wait kills a daemon that was about to end, and the case fails.
- Five cases run on the suite's 5 s timeout, which leaves no room for a longer wait.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A test's timing outlasts a slow runner | afab59a2, the logins tests' cooldowns, 150 ms to 1500 ms | 01 |
| The wait stays below its case's timeout, so a daemon that never ends fails an assertion | The comment at the wait, `daemon-backend.test.ts` L55-L56 | 01 |
| A case that runs a daemon carries its own timeout | `daemon-backend.test.ts` L135 and L145, and the command-line cases' 60000 ms | 01 |
| The wait is 40 s, more than twice the slowest start seen on a busy machine, and a case 60 s, as a command-line case that starts a daemon | Starts past 15 s, with the file pinned to one CPU beside busy loops; `server-cli-service.test.ts` | 01 |

## Proposed architecture

- **Data flow** - one constant for the wait and one for a case's timeout, read by `run` and by every case.
- **Layer responsibilities** - server tests: `daemon-backend.test.ts`.
- **Source-of-truth files** - [`code://packages/server/test/daemon-backend.test.ts`](../../../../packages/server/test/daemon-backend.test.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The wait and the cases give a slow start room](task-01-the-wait-and-the-cases-give-a-slow-start-room.md) | done | - |

## Risks and tradeoffs

- A daemon that never ends holds its case for 40 s before the case fails.

## Resume state

- **Done so far:** planned and built 2026-10-29. See [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** a run pinned to one CPU is the slow runner on purpose; its loops are stopped by pid.

## Final verification checklist

- [x] Pinned to one CPU beside busy loops, the file fails before task 01 and passes after it.
- [x] Idle, the file passes before and after.
- [ ] The server suite passes. On a busy machine this file passes, and cases elsewhere fail at their own limits.
