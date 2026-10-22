---
title: A plugin command marks a restart for every client
status: todo
depends: [task-04-a-client-lists-the-plugins.md]
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/host/actions.ts#L418](../../../../packages/sdk/src/host/actions.ts#L418) - the one place that sets `restartNeeded` today, after a root configuration write"
  - "[code://packages/sdk/src/host/root.ts#L625](../../../../packages/sdk/src/host/root.ts#L625) - where the root state carries `ahpd.restartNeeded`"
  - "[code://packages/sdk/src/host.ts#L1027](../../../../packages/sdk/src/host.ts#L1027) - `restartNeeded: false`, what a new host starts with"
  - "[code://packages/server/src/pluginschannel.ts#L181-L273](../../../../packages/server/src/pluginschannel.ts#L181-L273) - `enable`, `disable` and `options`, which answer `restart: true`"
---

## Objective

After `x-ahpd/plugins/enable`, `disable` or `options` changes the configuration, the root state carries `ahpd.restartNeeded`.
Every client sees it, not only the client that sent the command.
A restarted daemon starts without it.

## Files

- `UPDATE: packages/sdk/src/host.ts` - a host call that sets `restartNeeded` and sends the root state to every client.
- `UPDATE: packages/sdk/src/types/host.ts` - the type of that call.
- `UPDATE: packages/server/src/pluginschannel.ts:181-273` - each command calls it after the write.
- `UPDATE: packages/server/src/commands/run.ts` - give the plugin channel that call once the host exists.
- `UPDATE: packages/server/test/plugins-channel.test.ts` - the cases below.

## Steps

1. Add a host call that sets `restartNeeded` and sends the changed root state to every client.
2. Call it from `enable`, `disable` and `options` after each command writes the configuration file.
3. Do not call it when the host refuses a command.
4. Give the plugin channel the call in `run.ts`, because `run.ts` makes the channel before the host.
5. Run the SDK and server tests, and set this task and the plan row to `implemented`.

## Validation

- `plugins-channel.test.ts`: after `enable`, a second client that sent nothing sees `ahpd.restartNeeded` on the root state.
- `plugins-channel.test.ts`: a refused `options` call does not set `ahpd.restartNeeded`.
- `plugins-channel.test.ts`: a new host over the same configuration starts without `ahpd.restartNeeded`.
- `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** a daemon restart clears the mark because `restartNeeded` lives only in memory; nothing writes it to disk.
