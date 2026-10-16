---
title: A session on an ssh machine runs nested over ssh
status: done
depends: [task-02-ssh-machine-is-listed-from-the-options.md]
layer: "computer | sdk"
refs:
  - "[code://packages/sdk/src/types/computers.ts#L110-L143](../../../../packages/sdk/src/types/computers.ts#L110-L143) - `how` and `nested` on the port"
  - "[code://packages/sdk/src/computers.ts#L103-L129](../../../../packages/sdk/src/computers.ts#L103-L129) - `computersFor`, which spreads the port"
  - "[code://packages/sdk/src/host/spawn.ts#L332-L334](../../../../packages/sdk/src/host/spawn.ts#L332-L334) - the nested route, chosen by `runsNested` alone"
  - "[code://.project/plans/container/04-a-cofold-session-in-a-computer/task-17-a-backend-names-its-nested-plugin.md](../04-a-cofold-session-in-a-computer/task-17-a-backend-names-its-nested-plugin.md) - removes the `@ahpd/agent-<provider>` default this task would otherwise lean on"
  - "[code://packages/sdk/src/nested.ts#L115-L129](../../../../packages/sdk/src/nested.ts#L115-L129) - `startInside`, which spawns what `nested` answers"
  - "[code://packages/computer/src/plugin.ts#L210-L224](../../../../packages/computer/src/plugin.ts#L210-L224) - `within`, which has nothing to read for an ssh machine"
---

## Objective

`how` and `nested` for an ssh machine answer an `ssh` descriptor whose remote command carries the directory and the variables, and the host runs every backend nested in a machine the port says is off this host.

## Files

- `UPDATE: packages/computer/src/ssh.ts` - `how(id, asked)` and `hostCommand(id)`.
- `UPDATE: packages/sdk/src/types/computers.ts:118-143` - `remote?(id: string): boolean`, whether a machine is on another host.
- `UPDATE: packages/computer/src/plugin.ts:648-662` - `remote` answers the routed runtime's `remote` for the id's prefix.
- `UPDATE: packages/sdk/src/host/spawn.ts:332-334` - nested when the backend says `runsNested` or the port says `remote(id)`.
- `UPDATE: packages/sdk/test/nested-start.test.ts`.

## Steps

1. `how` answers `{ command: 'ssh', args: [...flags, destination, '--', 'cd <q(dir)> && env <q(K=V)>... <q(cmd)> <q(arg)>...'] }`; `dir` is the machine's `workdir`, never `asked.cwd`, which is a path on this host; with no `workdir` the `cd` is left out and the login directory stands.
2. `nested` sends no `env`: the box's ahpd uses what it was configured with there.
3. `hostCommand` is the machine's `host`, default `['ahpd']`, so the plugin's `nestedHost` answers `ssh ... -- 'cd <workdir> && ahpd --stdio --plugin <each>'`.
4. For now non-secret variables are written inline, and a secret env need, one whose value is named from the vault, is refused for an ssh machine with a sentence naming the need and not its value. The refusal is one check in `how`, and it applies to the host's exec tools (a terminal, a command run in the machine): a session never reaches it, since a session on a remote machine runs nested and `nested` sends no env. What a nested session's credentials may carry is p12 task 03's.
5. `computersFor` keeps `remote` as it spreads the port; a backend without `runsNested` in a remote machine is wrapped by `nestedAgent` with the plugin that registered it, as the host records it (container/04 task 17, [the decision](../04-a-cofold-session-in-a-computer/plan.md)).

## Validation

- `computer-ssh.test.ts`: `how` with `cwd: '/home/me/repo'` and `env` answers the `cd <workdir>` and quoted `env` string; `nested` answers `ahpd --stdio --plugin @ahpd/agent-cofold` with no env.
- `nested-start.test.ts`: a fake port with `remote` true makes a session of a backend without `runsNested` a nested one, loading the package that registered the backend.
- `computer-ssh.test.ts`: an exec tool asked with a vault-named env value on an ssh machine is refused naming the need, and the value is in no argv.

## Resume

- **Done** 2026-10-12 in git://dfbc5409, after review.
- `ComputerPort.remote?(id)` is new, and `computersFor` keeps it by spreading the port, so nothing changed there.
- The plugin answers `remote` as `made.runtimeFor(id)?.remote === true`, so only a runtime that calls itself off this host answers true.
- `spawn.ts` nests a session when the backend says `runsNested` or the port says `remote(id)`.
- The port is asked once, at the one place every road to a running backend passes.
- `noVaultInline(id, named)` refuses a vault-named value for a machine off this host, and it names the variables rather than their values.
- It is one function called from two roads: the port's `how` in `reach`, and the `exec` a tool runs a command through.
- The plan says the refusal is one check in `how`.
- A terminal reaches the box through the plugin's `exec`, which is not `how`, so the same check is called there too.
- A value the operator wrote in the clear still goes inline, because the check reads the vault-named variables alone.
- `nestedHost` sends an off-host start through `made.how` directly, and a start on this host through `reach` as before.
- That off-host road reads no vault and passes no `env`, so a nested session in the box sends no secret, which the plan decided.
- `ssh.ts` gained nothing: task 02 built `how` and `hostCommand` with the runtime, so this task's `UPDATE` of that file was already done.
- `computer-ssh.test.ts` gained four cases: the remote string, the nested start, the `remote` answer and the refusal.
- The first holds `cd <workdir> && env <quoted K=V> <quoted argv>` and holds that this host's path is in no argv.
- The second holds `ahpd --stdio --plugin @ahpd/agent-cofold` with no env and no working directory.
- The refusal case runs `computer_exec` on the box, and holds that the sentence names `BOX_TOKEN` and no value appears.
- `nested-start.test.ts` gained one case: a fake port whose `remote` is true nests a backend that never declared `runsNested`.
- The port is asked for the plugin that registered the backend, which is `@ahpd/agent-cofold`.
- `pnpm -s typecheck`, `pnpm -s boundary`, `pnpm -s schema` and the gate suite pass, the last at 268 files and 4740 tests.
- What is left: nothing of this task's Validation.
- The Files line ranges moved with tasks 01 and 02: `types/computers.ts:118-143` is now 212-224, and `spawn.ts:332-334` is now 422-436.
- `plugin.ts:648-662` is now 1379-1411, the two helpers this task added, with `reach` at 1443, `nestedHost` at 1461 and the port at 1566.
- The end-to-end case task 04 deferred to "once task 03 lands" is in neither this task's Files, Steps nor Validation.
- It is not built, and task 04 is closed with it waiting, so it belongs to whoever takes that case up.
- `packages/sdk/test/fixtures/wire.jsonl` is dirty from the gate suite, at the endpoint line and 32 `ahpd.` `_meta` lines.
- A restore is denied in this permission mode, so Softov restores it.
