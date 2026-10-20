---
title: A failure has a JSON shape under --json
domain: daemon
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
refs:
  - "[idea: a failure has a JSON shape under --json](https://github.com/softov/ahpd/blob/5e5f35ce034f24747bd952d4dfdadf2763740cbb/.project/ideas/failures-have-a-json-shape.md) - the request, and where the work is"
  - file:///github/cofold/.project/plans/commands/06-a-failure-has-a-json-shape/plan.md - the cofold plan that gives `@cofold/terminal` the shape
  - npm://@cofold/terminal@^0.4.0 - `failureOf`, `writeFailure` and the JSON failure of `runEntry`
  - "[code://packages/server/package.json#L50](../../../../packages/server/package.json#L50) - `@cofold/terminal` is `^0.3.0` now"
  - "[code://packages/server/src/main.ts#L193-L205](../../../../packages/server/src/main.ts#L193-L205) - the group hint, written before `runEntry`"
  - "[code://packages/server/src/main.ts#L65-L82](../../../../packages/server/src/main.ts#L65-L82) - a failure to read the command surface of a remote daemon"
  - "[code://packages/server/src/main.ts#L103-L125](../../../../packages/server/src/main.ts#L103-L125) - `tokenFor`, three failures of the remote credential"
  - "[code://packages/server/src/main.ts#L135-L138](../../../../packages/server/src/main.ts#L135-L138) - `warnCleartext`, a warning and not a failure"
  - "[code://packages/server/src/main.ts#L54-L63](../../../../packages/server/src/main.ts#L54-L63) - the check run of a restart, read by a parent process and not a person"
  - "[code://packages/server/src/main.ts#L217](../../../../packages/server/src/main.ts#L217) - `runEntry`"
  - "[code://packages/server/src/commands/status.ts#L28-L34](../../../../packages/server/src/commands/status.ts#L28-L34) - `status` writes `{\"running\":false}` on stdout, then fails"
  - "[code://packages/server/src/commands/stop.ts#L21-L26](../../../../packages/server/src/commands/stop.ts#L21-L26) - `stop` writes `{\"stopped\":false}` on stdout, then fails"
  - "[code://packages/server/src/commands/options.ts#L203-L205](../../../../packages/server/src/commands/options.ts#L203-L205) - `conflict`, the kind `conflict` with the status 409"
  - "[code://packages/server/test/server-cli-verbs.test.ts#L94](../../../../packages/server/test/server-cli-verbs.test.ts#L94) - the test of the group hint"
  - "[code://docs/server/RUN.md#L72-L87](../../../../docs/server/RUN.md#L72-L87) - `Output for scripts`"
---

## Goal

Under `--json`, every failure of `ahpd` is one JSON line with the sentence, the kind and the exit code.
That includes the failures that `main.ts` writes before `runEntry`, such as the group hint and the remote credential.
A script that runs `ahpd --json ...` then reads prose from no failure.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "process.stderr.write" packages/server/src/main.ts` - six writes before `runEntry`: the check run, the remote surface, three token failures, and the cleartext warning.
- `rg -n "context.write\('\{" packages/server/src/commands` - `status` and `stop` write a JSON result before they fail.
- `rg -n "@cofold/terminal" packages/*/package.json` - only `@ahpd/server` uses it.

### Where the change lives

- The shape and the failures of `runEntry` and `Program.run` are in `@cofold/terminal`, in the cofold plan commands/06.
- ahpd needs its own change for three reasons. `main.ts` writes six lines before `runEntry`. `status` and `stop` write a result before a failure. The dependency needs a bump.

### Runtime path

```
ahpd --json <words> -> main.ts (group hint, remote, token) -> runEntry -> Program.run -> command throws -> writeFailure -> stderr line -> exit code
```

### Gaps

- The failures in `main.ts` are plain lines in every mode.
- The remote surface failure exits 2 for every error, and `exitCodeFor` gives 4 for an unreachable daemon.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The work is in `@cofold/terminal`, then a bump in ahpd | the idea, 2026-09-26 | 01 |
| The group hint, the remote surface and the three token failures use `writeFailure` | (defaulted: the idea names the group hint, and the others are failures of the same line) | 02 |
| The cleartext warning stays a plain line on stderr | (defaulted: a warning is not a failure, and the command still runs) | - |
| The check run stays a plain line | (defaulted: a parent process reads only its exit code) | - |
| Each failure keeps its exit code | (defaulted: scripts switch on them) | 02 |
| `--json` is found with the same tokens that find the group hint | (defaulted: `tokenize` already reads the line in `main.ts`) | 02 |
| `status` and `stop` keep `{"running":false}` and `{"stopped":false}` on stdout, and the failure goes to stderr | Softov, 2026-10-16, chose the recommended answer for "Do `status` and `stop` keep their JSON result before the failure?" | 03 |
| The remote surface failure exits with `exitCodeFor`, so an unreachable daemon exits 4 | Softov, 2026-10-16, chose the recommended answer for "Does the remote surface failure keep exit 2?" | 02 |
| A failure goes to stderr as a flat `{ message, kind, exitCode }` line | cofold commands/06, answered by Softov on 2026-10-16 | 01 |

## Proposed architecture

- **Data flow** - `main.ts` builds an error for each failure, gives it to `writeFailure` with the mode of the line, and exits with `exitCodeFor`.
- **Result and failure** - `status` and `stop` keep their result on stdout, and the JSON failure goes to stderr.
- **Layer responsibilities** - server: `main.ts`, `status`, `stop` and the docs. sdk: nothing. cofold: the shape, in its own plan.
- **Source-of-truth files** - [`code://packages/server/src/main.ts`](../../../../packages/server/src/main.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - ahpd takes @cofold/terminal 0.4](task-01-ahpd-takes-cofold-terminal-0-4.md) | done | - |
| [02 - The failures in main.ts take the shape](task-02-the-failures-in-main-take-the-shape.md) | done | 01 |
| [03 - Status and stop under --json keep their result](task-03-status-and-stop-under-json-fail-once.md) | done | 01 |
| [04 - RUN.md shows a failure under --json](task-04-run-shows-a-failure-under-json.md) | done | 02, 03 |

## Relations

- **Requires:** cofold commands/06, released by Softov as `@cofold/terminal` 0.4.0.
- **Blocks:** nothing.

## Risks and tradeoffs

- A script greps `ahpd:` under `--json` - RUN.md names the change, and the line without `--json` stays the same.
- The tests of the group hint read the plain line - they keep that case and add one under `--json`.

## Resume state

- **Done so far:** the plan, 2026-10-16. Softov answered the open questions on 2026-10-16. Tasks 01 to 04 implemented on 2026-10-18, in `20edee91` on `main`. Softov reviewed them and approved the close on 2026-10-19. The plan is built: see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** without `--json`, the group hint is a plain line on stderr with exit 2. The cleartext case in `server-cli.test.ts` expects exit 4, because the remote surface failure uses `exitCodeFor`.

## Final verification checklist

- [x] `ahpd --json plugin` writes one JSON line with the kind `argument` and exits 2.
- [x] `ahpd --json --remote http://127.0.0.1:1 status` writes one JSON line.
- [x] `ahpd status --json` with no daemon writes `{"running":false}` on stdout and one JSON failure on stderr, and exits 1.
- [x] Without `--json`, every failure writes the line of today.
- [x] `plans/index.md` updated.
