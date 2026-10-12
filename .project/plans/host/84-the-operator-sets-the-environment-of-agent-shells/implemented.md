---
title: The operator sets the environment of agent shells - implemented
date: 2026-10-11
refs:
  - git://927c070
  - "[code://packages/sdk/src/shellenv.ts](../../../../packages/sdk/src/shellenv.ts)"
  - "[code://packages/agent-claude/src/session/config.ts](../../../../packages/agent-claude/src/session/config.ts)"
---

An operator sets `shellEnv` in the daemon's `config.json`: a map of variable to value, where `null` removes the variable. Host terminals start with that environment. Each Bash command that Claude runs starts with an `export` or `unset` line for each entry, before the session's own init scripts.

## What was built

- [`code://packages/sdk/src/shellenv.ts`](../../../../packages/sdk/src/shellenv.ts) - `ShellEnv`, `shellEnvOf` and `isShellName`.
- [`code://packages/sdk/src/terminals.ts`](../../../../packages/sdk/src/terminals.ts) - `shellTerminals` takes the map, and a terminal drops each variable left with no value.
- [`code://packages/server/src/config.ts`](../../../../packages/server/src/config.ts) - `Config.shellEnv` and `shellEnvProblems`.
- [`code://packages/server/src/commands/options.ts`](../../../../packages/server/src/commands/options.ts) - the key, with no flag, and the refusal in `checkConfig`.
- [`code://packages/sdk/src/host/spawn.ts`](../../../../packages/sdk/src/host/spawn.ts) - `Start.shellEnv` for each backend.
- [`code://packages/agent-claude/src/session/config.ts`](../../../../packages/agent-claude/src/session/config.ts) - the `PreToolUse` hook puts the lines in front of each Bash command.
- [`code://docs/HOST.md`](../../../../docs/HOST.md) - the key and an example.

## Verified

- `pnpm exec vitest run packages/sdk packages/server packages/agent-claude`: 4031 of 4032 tests pass. The one failure is `nested-start.test.ts`, which fails at times on main too.
- `shellenv.test.ts` is new, and `config-check.test.ts` and `agent-claude-options.test.ts` have the new cases.
- `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Departures from the plan

- A name that is not a shell variable name is refused by the daemon and left out by the Claude backend. The plan named only the value check.
- `packages/server/src/commands/options.ts` changed as well, because the key and its fold live there.

## Left for later

- The check by hand: a daemon with `"shellEnv": { "XDG_CONFIG_HOME": "/home/me/.config" }` opens a terminal where `echo $XDG_CONFIG_HOME` prints that path.
- The other backends - see [deferred.md](deferred.md).
