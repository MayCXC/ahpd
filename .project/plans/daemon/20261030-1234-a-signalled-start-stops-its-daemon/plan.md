---
title: A signalled start stops its daemon
domain: daemon
status: built
priority: medium
created: 2026-10-30
revalidated: 2026-10-30
refs:
  - "[code://packages/server/src/daemon.ts#L537-L595](../../../../packages/server/src/daemon.ts#L537-L595) - `start` spawns the detached daemon, waits for its announcement, and writes the record; it kills the child on a timeout or an early exit, and stops it on a failed claim"
  - "[code://packages/server/src/commands/restart.ts#L138-L178](../../../../packages/server/src/commands/restart.ts#L138-L178) - a daemon restarting itself runs `start` and stops the successor itself when a stop arrives meanwhile"
  - "[code://packages/server/test/cli.ts#L81-L94](../../../../packages/server/test/cli.ts#L81-L94) - `afterEach` stops the pids a case kept and the ones its log names"
  - "[code://packages/server/test/cli.ts#L153-L176](../../../../packages/server/test/cli.ts#L153-L176) - `cli` ends a command that outlives 15 s with SIGTERM"
  - "https://nodejs.org/api/child_process.html#optionsdetached - a detached child may keep running after its parent exits"
---

## Goal

An `ahpd start` that is signalled before it writes the record stops the daemon it started, and a
server test case leaves no daemon running however it ends.

## Reconnaissance

The files read are the `refs` in the frontmatter, each with its note.

### Runtime path

```
ahpd start -> spawn the daemon, detached -> poll the log for its announcement -> record -> exit
signal during the poll -> the default action ends start -> the daemon runs on, named nowhere
```

### Gaps

- `start` has no handler for a signal, so a SIGINT, SIGTERM or SIGHUP while it waits ends it and
  leaves the detached daemon running with no record naming its pid. A person's Ctrl-C does this, and
  so does `cli`'s SIGTERM to a command that outlives 15 s: five daemons were left running by one
  server run on 2026-10-30, each started by a `start` case that ran past 15 s.
- A case keeps its daemon's pid only after asserting the command's exit code, so a case that fails
  there leaves the daemon to `afterEach`, which reads neither the record nor a command still running.

## Answers

| What | Source | Task |
| --- | --- | --- |
| While no record names the child, a SIGINT, SIGTERM or SIGHUP nothing else answers stops the child as the two ways out of `start` already do (killed before its announcement, asked to stop after it), then ends `start` with the same signal | `start`'s own `.catch` and `unmade` | 01 |
| A signal something else answers is left to it: a daemon restarting itself answers a stop by stopping the successor once `start` returns | `restartInPlace` | 01 |
| `afterEach` asks every `cli` command still running to stop and waits for it, and stops the daemon the case's record names | `supervised` registers its child when it spawns it; `afterEach` already reaps what a case kept | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A start stops the daemon it made when it is signalled](task-01-a-start-stops-the-daemon-it-made-when-it-is-signalled.md) | done | - |

## Risks and tradeoffs

- A signal that ends `start` after the record is written leaves the daemon running, as it should: the
  record names it, and `ahpd stop` reaches it.

## Resume state

- **Done so far:** planned and built 2026-10-30. See [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the restart cases, whose daemon runs `start` with its own SIGINT and SIGTERM handlers.

## Final verification checklist

- [x] A `start` signalled while its daemon starts ends by that signal, and the daemon is gone.
- [ ] The server suite passes, and leaves no daemon running.
