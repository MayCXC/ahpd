---
title: The session tools can be switched off
status: todo
depends: []
layer: server
refs:
  - "[code://packages/server/src/commands/options.ts#L390-L590](../../../../packages/server/src/commands/options.ts#L390-L590) - `serverFields`; `advancedTools` is the nearest boolean, `http` the nearest object-or-boolean"
  - "[code://packages/server/src/commands/run.ts#L626](../../../../packages/server/src/commands/run.ts#L626) - the daemon passes `hostTools()` to every session"
  - "[code://packages/sdk/src/tools/index.ts#L24-L56](../../../../packages/sdk/src/tools/index.ts#L24-L56) - `hostTools`, the session, wakeup and artifact tools"
  - "[code://packages/sdk/src/host/tooling.ts#L1316-L1358](../../../../packages/sdk/src/host/tooling.ts#L1316-L1358) - `boundTools` and `offeredTools`, the tools one session is offered"
  - "[code://packages/sdk/src/host/tooling.ts#L1031-L1034](../../../../packages/sdk/src/host/tooling.ts#L1031-L1034) - `providerOf`, a session's provider"
  - "[code://packages/server/src/rootconfig.ts#L33-L42](../../../../packages/server/src/rootconfig.ts#L33-L42) - `DAEMON_KEYS` and `LIVE`"
  - "[code://packages/sdk/src/host/actions.ts#L429-L441](../../../../packages/sdk/src/host/actions.ts#L429-L441) - a live option applied to running sessions with `retool`"
---

## Objective

A daemon option `sessionTools` is `true` by default, `false` to offer no session tool, or a list of providers whose sessions get them.
The artifact tools, `schedule_wakeup` and `ahp_terminals` are not session tools and stay as they are.

## Files

- `UPDATE: packages/server/src/commands/options.ts:390-590` - `sessionTools`, type boolean or array of strings, default `true`.
- `UPDATE: packages/server/src/config.ts` - the option read from the config file.
- `UPDATE: packages/server/src/rootconfig.ts:33-42` - `sessionTools` in `DAEMON_KEYS` and `LIVE`.
- `UPDATE: packages/server/src/main.ts` - the option in the help text.
- `UPDATE: packages/sdk/src/types/host.ts:336` - the host option `sessionTools` beside `tools`.
- `UPDATE: packages/server/src/commands/run.ts:626` - the host is given `sessionTools`.
- `UPDATE: packages/sdk/src/host/tooling.ts:1316-1358` - `offeredTools` leaves out the nine session tools for a session whose provider is not offered them.
- `UPDATE: packages/sdk/src/host/actions.ts:429-441` - a change to `sessionTools` retools the running sessions.
- `UPDATE: docs/HOST.md` - the option.
- `UPDATE: docs/TOOLS.md` - which tools the option covers.
- `UPDATE: docs/DAEMON.md` - the option in the config reference.
- `UPDATE: packages/sdk/test/host-tools.test.ts` - the option cases below.

## Steps

1. Read the plan's *Decisions locked in* rows for task 03.
2. Add `sessionTools` to `serverFields` with type `['boolean', 'array']`, items string, default `true`.
3. Read it in `config.ts`, and add it to `DAEMON_KEYS` and `LIVE` in `rootconfig.ts`.
4. Add one help line in `main.ts`: `--session-tools  offer the session tools: true, false or providers`.
5. Add a host option `sessionTools?: boolean | string[]` beside `tools`, and pass it from `run.ts`.
6. Mark the nine session tools by name in one exported list in `tools/session.ts`.
7. In `offeredTools`, leave out the listed tools when `sessionTools` is `false`.
8. Leave them out also when `sessionTools` is a list without the session's provider from `providerOf`.
9. On a live change to `sessionTools`, dispatch `session/serverToolsChanged` and call `retool` for every running session, as for `advancedTools`.
10. Write the option in `docs/HOST.md`, `docs/TOOLS.md` and `docs/DAEMON.md`.

## Validation

- `host-tools.test.ts`: `sessionTools: false` offers no session tool and still offers `schedule_wakeup` and the artifact tools.
- `host-tools.test.ts`: `sessionTools: ['claude']` offers the session tools to a claude session and not to an acp session.
- `host-tools.test.ts`: a live change retools a running session.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume
