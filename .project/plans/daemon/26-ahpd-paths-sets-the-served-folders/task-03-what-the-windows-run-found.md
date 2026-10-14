---
title: what the Windows run found in ahpd paths is fixed
status: implemented
depends: [task-02-a-served-paths-change-reaches-the-running-daemon.md]
layer: server
refs:
  - "[code://packages/server/src/commands/paths.ts](../../../../packages/server/src/commands/paths.ts) - the three verbs, `restartLine` and the live change"
  - "[code://packages/server/src/daemon.ts#L264-L285](../../../../packages/server/src/daemon.ts#L264-L285) - `recordOf`, which builds the record from the announcement"
  - "[code://packages/server/src/daemon.ts#L507-L516](../../../../packages/server/src/daemon.ts#L507-L516) - `claim`, the owner-only atomic write of the record"
  - "[code://packages/server/src/commands/run.ts#L1059](../../../../packages/server/src/commands/run.ts#L1059) - the `http on <url>` line of the announcement"
  - "[code://packages/server/src/commands/registry.ts#L100-L131](../../../../packages/server/src/commands/registry.ts#L100-L131) - `remoteRegistry`, how the terminal calls the API with a bearer token"
---

## Objective

A served `paths add` or `paths remove` also rewrites `paths` in `daemon.json`, so `ahpd status --json` at the terminal shows the new list.
At the terminal, `paths add` and `paths remove` send the change to a recorded daemon that serves the API.
They use the record's token, and do this only when no `--config-file` is given.
Otherwise they write `config.json` and say `Restart the daemon to apply the change: ahpd restart.`
`paths remove` has `effect: 'change'`, so nothing asks, and a folder not in `paths` is refused at once.

## Files

- `UPDATE: packages/server/src/daemon.ts:30-70` - `Running` gains `api?: string`, the API origin without `/api`, absent when the daemon serves no API.
- `UPDATE: packages/server/src/daemon.ts:264-285` - `recordOf` reads `api` from the `http on <url>` line of the announcement.
- `UPDATE: packages/server/src/daemon.ts:507-530` - a new `rewritePaths(pid, paths)` writes the record again with new `paths`, only when the record names `pid`.
- `UPDATE: packages/server/src/commands/paths.ts` - the served write calls `rewritePaths`; the terminal write forwards to the recorded daemon; `remove` gets `effect: 'change'`; `restartLine` names `ahpd restart` only.
- `UPDATE: packages/server/test/server-paths.test.ts` - cases for the record, the forward, the fallback, and `remove` with no question.
- `UPDATE: packages/server/test/server-commands.test.ts` - the effect of `paths.remove` is `change`.
- `UPDATE: packages/server/test/daemon.test.ts` - cases for `api` in `recordOf` and for `rewritePaths`.
- `UPDATE: docs/DAEMON.md:163-200` - the `## Commands` block lists `paths list`, `paths add` and `paths remove`, with one paragraph on the forward.

## Steps

1. Read the decisions `a-served-paths-change-reaches-the-running-daemon.md` and `ahpd-paths-lists-adds-and-removes-a-served-folder.md` in `.project/decisions/`.
2. Add a `daemon.test.ts` case: `recordOf` reads `api` as `http://127.0.0.1:9187` from `http on http://127.0.0.1:9187/api`.
3. Add a `daemon.test.ts` case: `recordOf` has no `api` when the announcement has no `http on` line.
4. Add a `daemon.test.ts` case: `rewritePaths` changes `paths` and keeps every other field, with mode 0600.
5. Add a `daemon.test.ts` case: `rewritePaths` leaves a record that names another pid unchanged.
6. Add a `server-paths.test.ts` case: a served `add` makes `running().paths` read from the file hold the new folder.
7. Add a case: a terminal `add` with a recorded `api` calls `POST <api>/api/paths/add` with the record's token.
8. Add a case: the forward sends the folder resolved to an absolute path, and writes no `config.json` itself.
9. Add a case: the daemon refuses a missing folder, and the terminal refuses with the daemon's sentence.
10. Add a case: a recorded daemon with no `api` writes `config.json` and says the restart line.
11. Add a case: a daemon that does not answer writes `config.json` and says the restart line.
12. Add a case: a terminal `add` with `--config-file` writes that file and does not forward.
13. Add a case: `paths remove` of a folder not in `paths` stops at once, with no `--yes` and no question.
14. Change the existing case at `server-paths.test.ts:196` to expect only `Restart the daemon to apply the change: ahpd restart.`
15. Run the cases and see them fail.
16. Add `api` to `Running` and read it in `recordOf` from the `http on` line, without the `/api` suffix.
17. Add `rewritePaths(pid, paths)` in `daemon.ts`, with the same atomic owner-only write as `claim`.
18. In the served write in `paths.ts`, call `rewritePaths(process.pid, live)` after the live list changes.
19. In the terminal write, forward when `configFile` is not given and `running()` has `api`.
20. Take the token from the `tkn` query of the record's `connectUrl`, and send it as `Authorization: Bearer`.
21. Use the `httpTransport` that `remoteRegistry` uses, or `fetch` with the same headers and a 10 second timeout.
22. Print the daemon's answer as the verb's own, and return its `paths`.
23. When the daemon does not answer, write `config.json` and say the restart line, as with no `api`.
24. Set `effect: 'change'` on `paths.remove`, and keep `resource: { kind: 'folder', key: 'folder' }`.
25. Change `restartLine` to `Restart the daemon to apply the change: ahpd restart.`
26. Change the `paths.remove` effect in `server-commands.test.ts` to `change`.
27. Add the three `paths` verbs to the `## Commands` block of `docs/DAEMON.md`, and one paragraph on the forward.
28. Run the cases again and see them pass.

## Validation

- The new cases in `daemon.test.ts` and `server-paths.test.ts` pass, and they fail without steps 16 to 25.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` from the repository root; all pass.
- By hand on Windows, with `http` on: a plain `ahpd paths add <folder>` makes `ahpd status --json` show the folder with no restart.
- By hand on Windows: `ahpd paths remove <folder not listed>` stops at once and asks nothing.

## Resume

Implemented 2026-10-14. Every step is built, and the cases the Validation names pass.

File by file:

- `packages/server/src/daemon.ts` - steps 16 and 17. `Running` gains `api?: string`, the origin this daemon's API answers on without the `/api` its routes hang off, and `apiOf` reads it off the `http on <url>` line of the announcement, taking the suffix off by `API_SUFFIX`, which is the one place the string is written. The prefix is written out rather than imported from `http.ts`, which reaches this file through `served.ts` and the commands a served request runs. `rewritePaths(pid, paths)` reads the record, returns when it names another pid, and writes it back whole with the new `paths`, through the same `sweepTemps` and `writeJsonAtomic(..., { mode: 0o600 })` as `claim`, because `connectUrl` and `control` are in that file.
- `packages/server/src/commands/paths.ts` - steps 18 to 25. `forward(verb, folder, say)` reads `running()` and returns nothing when the record has no `api` or the daemon does not answer, `stop`s with the daemon's own `message` on a refusal, and otherwise says `Added <folder> to "paths" on the running daemon.` and returns the daemon's `paths` as this verb's data. The request is `POST <api>/api/paths/<verb>`, with the token from the `tkn` query of the record's `connectUrl` as `authorization: Bearer`, `accept` and `content-type` as `@cofold/remote`'s `httpTransport` sends them, and `AbortSignal.timeout(10_000)`. The address comes from `reachable(api)`, which is the record's own except when it is a bind address. The terminal write asks for the forward when no `--config-file` is given; the served write calls `rewritePaths(process.pid, live)` after the live array changes, which is what `ahpd status --json` at the terminal reads. `paths.remove` is `effect: 'change'`, keeping `resource: { kind: 'folder', key: 'folder' }`, and `restartLine` is `Restart the daemon to apply the change: ahpd restart.` alone.
- `packages/server/test/daemon.test.ts` - steps 2 to 5. Two `recordOf` cases, one that `api` is the origin with the `/api` off it and one that a record of a daemon serving none has no `api`; two `rewritePaths` cases, one that the folders change and every other field and the 0600 mode stay, one that a record naming another pid is left byte for byte.
- `packages/server/test/server-paths.test.ts` - steps 6 to 14. The `listening` helper mounts the handler `apiHandler` builds over `servedRegistry` on a real port and keeps every request, and `record` writes the `api` a case names. Six terminal cases: the change is sent with the token the record carries, the folder sent is the one resolved, a refusal is the daemon's own sentence and nothing is written, a daemon serving no `api` writes the file and says the restart line, a daemon that does not answer does the same, and `--config-file` writes the file it names and sends nothing. One case that `paths remove` of a folder not in `paths` stops at once with no question, and one served case that the record is rewritten, so a terminal reading it lists the folder too. The case at old line 196 now expects the restart sentence alone. Two more from the review: a record naming `http://0.0.0.0:<port>` reaches a daemon listening on the loopback, and `reachable` maps the three wildcard shapes and leaves a name, a loopback and an IPv6 loopback alone.
- `packages/server/test/server-commands.test.ts` - step 26. The pinned manifest row is `['paths.remove', 'change', { kind: 'folder', key: 'folder' }]`.
- `docs/DAEMON.md` - step 27. `paths list`, `paths add <folder>` and `paths remove <folder>` are in the `## Commands` block, with one paragraph under it on the forward and its fallbacks.

Review of 2026-10-14, kept at implemented:

- A wildcard bind is sent to the loopback. A daemon bound to every address announces `0.0.0.0`, `::`, or nothing at all, and `0.0.0.0` names no one machine: on Windows a fetch to it fails, and on Linux, where it does connect, the `Host` it sends is not one the API answers to, so the daemon refused the change and the run fell back to the file and a restart line. `reachable(api)` sends those three shapes to `127.0.0.1` or `[::1]` at the same port, the way `personalUrl` in `config.ts` stands a machine's own name in for a wildcard. It is pure and exported, so every shape is testable without a socket, and the case that reaches a real listener through a record naming `0.0.0.0` fails with `This API does not answer to 0.0.0.0:<port>` when `forward` sends to the record's address as written.
- `API_SUFFIX` in `daemon.ts` is read by `apiOf` rather than being a declaration nothing uses.
- The two verb descriptions and `docs/DAEMON.md` said the change goes to "a daemon running that serves this terminal's own file". Nothing checks that: what is checked is that no `--config-file` was given and that the record names a daemon with an `api`. Both say that now, and the paragraph names the wildcard case too.

Judgement calls the plan does not decide:

- The forward is asked before the one-at-a-time chain is taken. `oneAtATime` orders this process's writes to a file, and a forwarded change is not one of them: the daemon's own chain orders the file the daemon writes. Asked first, this process holds its turn while the daemon waits for its own, which is what every forwarding case did - each hung for the whole ten seconds and then fell back to writing the file and saying the restart line. Two processes never wait on each other, so the case is a test's; the chain is still taken for every write this process makes itself.
- The forwarded change says a line naming the daemon rather than a file: `Added <folder> to "paths" on the running daemon.` The record holds no configuration file path, and the daemon's sentence is not in its answer, which is `result?.data ?? null`. The answer's `paths` is the data, so with `--json` it is stdout and the line goes to stderr.
- The record's token in `server-paths.test.ts` defaults to `root-secret`, which is every daemon in that file's own token, because a record is written by the daemon it names. The first run of the cases had `the-token` there and the API answered `A connection token is required`; the case about the token now uses a third string, so the header it reads can only have come from the record.

What the plan did not know:

- Step 1 names `ahpd-paths-add-at-the-terminal-reaches-a-running-daemon.md` and `ahpd-paths-remove-asks-nothing.md`. Neither is in the worktree: they were folded into `a-served-paths-change-reaches-the-running-daemon.md` and `ahpd-paths-lists-adds-and-removes-a-served-folder.md`, which are the two the step's own prose goes on to describe.
- The older case `writes the file and says that a restart applies the change, when a daemon is recorded` is now the no-`api` case, because the record it writes carries none. It is the shape a daemon without `http` leaves.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by the suite on every run and is left dirty. `git restore packages/sdk/test/fixtures/wire.jsonl` is denied in this mode, so Softov has to run it before a commit.

Validation:

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` each exit 0. The schema was generated before the suite was run, as `pnpm -s schema` did here.
- Vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp` from the repository root, in one command with `--maxWorkers=2 --testTimeout=10000`: 244 files and 4399 tests pass. That run is after the review's fixes.
- The two touched test files alone are 82 cases, all passing. Before steps 16 to 25 they reported `Tests 10 failed | 70 passed (80)`: the ten are the new cases that need one of the new paths, and the two that passed are cases about sending nothing, which the older code satisfied. The two from the review were added after that run.
- Both ends of a forwarding case are real: the daemon's end is a listener on a port, and the terminal's end is the same declaration a served request runs.

Left:

- The two by-hand lines on Windows, which no machine here runs.
- The plan's Final verification checklist and the review, which are not a task's.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten and not restored, because every command that would put it back is denied in this mode.
