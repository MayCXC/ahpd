---
title: An ssh machine is listed from the options and answers over ssh
status: done
depends: [task-01-several-runtimes-on-one-host.md, task-04-the-ssh-fixture-and-tests.md]
layer: "computer"
refs:
  - "[code://packages/computer/src/plugin.ts#L92-L116](../../../../packages/computer/src/plugin.ts#L92-L116) - `optionsSchema`, where `ssh` is declared"
  - "[code://packages/computer/src/plugin.ts#L185-L198](../../../../packages/computer/src/plugin.ts#L185-L198) - the `devcontainer` option, an object with its own `command` and `args`, the shape to mirror"
  - "[code://packages/computer/src/runtime.ts#L325-L341](../../../../packages/computer/src/runtime.ts#L325-L341) - `ran`, one run of a program"
  - "[code://packages/computer/src/runtime.ts#L602-L620](../../../../packages/computer/src/runtime.ts#L602-L620) - docker's `list`, the `Machine` rows to match"
  - "[code://packages/computer/src/runtime.ts#L803-L825](../../../../packages/computer/src/runtime.ts#L803-L825) - docker's `stats`, the `MachineStats` to answer"
  - "[code://packages/computer/src/provider.ts#L379-L382](../../../../packages/computer/src/provider.ts#L379-L382) - the `state` leaf, read from the runtime and written through a verb an ssh machine refuses"
---

## Objective

`options.ssh.machines` names boxes, the ssh runtime lists them, and state, exec and stats each run one `ssh` command; a box's record is the operator's own option, nothing is labelled on the box, and nothing is made.

## Files

- `CREATE: packages/computer/src/ssh.ts` - `sshRuntime({ command, args, machines, pollSeconds? })` implementing `ComputerRuntime`, and `quote(word)`, the POSIX single-quote quoting every remote word goes through.
- `UPDATE: packages/computer/src/plugin.ts:92-116` - `ssh: { type: 'object', properties: { command, args, connectTimeout, pollSeconds, machines } }`; each machine `{ destination, port?, identity?, workdir?, host?, agents? }`; `runtime` enum gains `ssh`.
- `UPDATE: packages/computer/src/plugin.ts:325-341` - `sshOptionsOf`, which reads the whole option and drops one that names no box.
- `UPDATE: packages/computer/src/plugin.ts:725-741` - build `sshRuntime` beside docker, and put it in the router the plugin serves.
- `UPDATE: packages/computer/src/plugin.ts:925-937` - `meterRows`, which feeds the listing meter, and `made.list` through it.
- `UPDATE: packages/computer/src/plugin.ts:1125-1148` - the `pollSeconds` timer, armed only where a box exists, and the close hook that clears it.
- `UPDATE: packages/computer/src/runtime.ts:517-570` - `Ownership`, and the three typed methods on `ComputerRuntime`.
- `UPDATE: packages/computer/src/runtime.ts:1075-1200` - `stateOf` and `machineDirectory`, the helpers a machine's record is read through.
- `UPDATE: packages/computer/src/runtime.ts:3049-3059` - docker's `state`, `agents` and `owner`, each from its own record.
- `UPDATE: packages/computer/src/router.ts:174-177` - `state`, `agents` and `owner` through `about`, so the runtime an id names answers.
- `UPDATE: packages/computer/src/provider.ts:151-403` - `stateLine`, and the `state` leaf read from `runtime.state` rather than out of a record.
- `UPDATE: packages/computer/src/catalogue.ts:27-40` - `state` in the runtime this channel is given, and `find` reading it.
- `UPDATE: packages/computer/src/index.ts:7-9` - export `machineDirectory`, `stateOf` and the `Ownership` type.
- `UPDATE: packages/computer/test/computer-runtimes.test.ts` - the three methods on the router, and the faker's own answers.
- `UPDATE: packages/computer/test/computer-needs.test.ts` - docker's three answers, from a seeded record.
- `UPDATE: packages/computer/test/computer-ssh.test.ts` - the box's three answers, and the check timer on and off.
- `UPDATE: packages/computer/test/computer.test.ts` - the fake runtime's three answers.
- `UPDATE: packages/computer/test/catalogue.test.ts` - the fake runtime's three answers, `state` read from its record.

## Steps

1. Every call is `ssh -T -o BatchMode=yes -o ConnectTimeout=<n> [-p port] [-i identity] <destination> -- <one quoted string>`; the program and its leading `args` are the option's, default `ssh`.
2. `list` answers one row per configured machine; its status is `running` when `ssh ... true` exits 0 and `unreachable: <ssh's last line>` otherwise, checked in parallel and bounded. `running` is what `isRunning` (`runtime.ts:629-630`) reads as up; a bare `Up` is not, since it tests `startsWith('Up ')`.
3. `inspect` answers the operator's own record and never reaches the box, and `undefined` for a name not configured; every runtime answers `state()`, `agents()` and `owner()`, and no caller reads Docker's record any more.
4. `exec(id, argv)` runs `cd <workdir> && <quoted argv>`, and answers the output and the exit code as docker's does.
5. `stats` runs one remote command that reads `/proc/stat` twice half a second apart, `/proc/meminfo` and `nproc`, and answers `MachineStats`; a box without `/proc` answers `undefined`.
6. `run`, `start`, `stop`, `restart` and `remove` throw "an ssh machine is listed in the options, not made by this host"; `capabilities()` answers `{ runtime: 'ssh', actions: ['exec'], resources: ['status', 'capabilities', 'stats'] }`.
7. An ssh machine's `owner()` answers nothing, so the machine is the host's own, `root:<host>`. Its up time is metered from a listing's reachability, by task 01's step 4.
8. The ssh runtime takes a `pollSeconds` option. Unset, only a listing moves the meter. Set, the plugin checks each machine over ssh at that interval, and clears the timer when it is disposed.

## Validation

- `packages/computer/test/computer-ssh.test.ts` with the fixture from task 04: a listing of two machines, one unreachable; `exec` argv; `stats` from fixed `/proc` text; a write to the `state` leaf refused.
- A listing that sees a machine `running` opens a stretch for it charged to the host, `isRunning` answers true for that row, and a listing that sees it unreachable closes it.
- A box answers `state`, `agents` and `owner` for itself, and reaches the box once for the state alone; a machine this host does not serve answers nothing to all three.
- The router sends `state`, `agents` and `owner` to the runtime the id names, and Docker answers them from its own record.
- With `pollSeconds` set, a check finds a box no listing saw and the metering test's stretch is written with it; unset, no check happens between two listings; and a closed plugin checks nothing again.
- `quote` holds `'`, `$()`, a backtick, `;`, a newline and a space.

## Resume

- **Done** 2026-10-12 in git://889649df, after review.
- `ssh.ts` is new, and it holds `sshRuntime(options)`, `quote(word)`, `statsFrom(said)`, `machinesOf(value)` and `STATS`, the probe text and its three marks.
- `sshRuntime` implements `ComputerRuntime`: `kind` is `ssh`, `remote` is true, and `capabilities()` answers `{ runtime: 'ssh', actions: ['exec'], resources: ['status', 'capabilities', 'stats'] }`.
- Every remote word goes through `quote`, so the box's shell reads one word where the caller wrote one. `test/computer-ssh.test.ts` round-trips ten words through `/bin/sh` to hold that.
- `list` checks each machine in parallel with one bounded `ssh ... true`, and answers `running` or `unreachable: <last line>`.
- `exec` runs `cd <workdir> && env K=V <quoted argv>` and answers `{ output, code }`; `stats` runs the probe and answers `MachineStats`; a box without `/proc` answers `undefined`.
- A row carries no owner, so the machine is the host's and the host is charged `root:<host>`.
- `how` and `hostCommand` are built here, though task 03's Files name them: the runtime is not complete without them.
- `how` is the option's program, its `args` and the whole argv. `hostCommand` is the machine's `host` or `['ahpd']`.
- A caller's `cwd` is left out, because a path on this host is not a path on the box.
- `plugin.ts` declares `ssh` in `optionsSchema`, adds `ssh` to the `runtime` enum, and reads the option with `sshOptionsOf`.
- `apply` builds the ssh runtime beside docker when `machines` is not empty, and `made.list` feeds the listing meter.
- `test/fixtures/ssh.mjs` gained `SSH_FAKE_UNREACHABLE_FILE`, read on every call, so that a machine can go down between two listings inside one plugin load.
- `test/computer-ssh.test.ts` covers the listing of two machines with one unreachable, the `exec` argv and its refusal, `stats` from fixed `/proc` text, and `quote`.
- The same file holds the five refusals, the other members, the plugin's provider and its refusal of the `state` leaf.
- The metering case opens a stretch at +300s and closes it at +600s.
- `pnpm -s typecheck`, `pnpm -s boundary`, `pnpm -s schema` and the five-package gate suite pass, the last at 268 files and 4750 tests after the rework.
- What is left: nothing of this task. Task 03 takes the `remote` answer on the port and the nested route, and is implemented in its own file.
- **Reworked** 2026-10-12, after a review: the plan's two rows of 2026-10-10 (plan.md lines 122 and 123) are now built, and Steps 3, 7 and 8 say what they say.
- Row 122: each runtime answers `state()`, `agents()` and `owner()`, and no caller reads Docker's `inspect` record any more.
- `inspect` on a box answers the operator's own line, `{ id, destination, port?, identity?, workdir?, host?, agents? }`, and reaches nothing; the Docker-shaped answer is gone.
- `state()` on a box is one bounded reach, `running` or `stopped`; `agents()` is the machine's own option, empty for a box prepared for nobody; `owner()` answers nothing, which the plugin reads as the host's own.
- Docker answers all three from its own record, through `stateOf`, `preparedFor` and `claimedOf`, so the three facts are asked of a runtime rather than read out of a shape.
- The readers moved with them: `claimOf` asks `computerRouter.owner`, the port's `agents` asks `made.agents`, `nestedHost` reads a machine's directory through `machineDirectory`, the provider's `state` leaf and the computer channel read `runtime.state`.
- Row 123: `pollSeconds` is a field of the `ssh` option, and the plugin owns the timer rather than the runtime, because the plugin is the object with a close hook.
- The timer lists the boxes alone and not every runtime, so no `docker ps` runs on an interval nothing asked for, and it is unref'd and cleared in `host.registerClose`.
- Neither row is a file in `.project/decisions/`, so no code comment cites one by slug: the comments name the plan's row instead.
- The rework's tests: `computer-runtimes.test.ts` routes the three methods by id; `computer-needs.test.ts` reads docker's three out of a seeded record; `computer-ssh.test.ts` covers the box's three and the timer set, unset and cleared; `computer.test.ts` and `catalogue.test.ts` gained the three on their fakes.
- The timer's case moves the fake clock one interval at a time, because a check is a real `ssh` and the plugin reads the clock when the check's answer arrives rather than when it was asked.
- `SshOptions` gained `env`, fed from the plugin's own `env`, so an operator and a test can set how `ssh` itself is reached.
- The task's Files name only `command`, `args` and `machines`; the docker tests set `env` the same way.
- `made.list` feeds the meter because the startup listing alone would open a stretch that nothing closes. An ssh machine changes state only when a listing sees it.
- Members the Steps do not name answer the smallest thing that cannot lie.
- `putIn` and `takeOut` throw, `bringBack` answers `undefined`, `follow` does nothing, `hasImage` answers false, and `buildImage` throws.
- A row's `image` and `created` are empty, because the plugin's options hold neither.
- The Files list names `test/computer-ssh.test.ts`, which task 04 shares; `test/fixtures/ssh.mjs` stays task 04's.
- `index.ts` exports nothing of `ssh.ts`, because only `plugin.ts` imports it. Task 04 adds nothing there either, so the runtime is reached through the plugin alone.
- The `plugin.ts` ranges in Files are the current ones: they moved when task 01 grew the file, and again with the rework.
- `packages/sdk/test/fixtures/wire.jsonl` is dirty from the gate suite, at the endpoint line and 32 `ahpd.` `_meta` lines. A restore is denied in this permission mode, so Softov restores it.
