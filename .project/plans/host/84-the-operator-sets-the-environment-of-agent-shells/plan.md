---
title: The operator sets the environment of agent shells
domain: host
status: built
priority: medium
created: 2026-10-11
revalidated: 2026-10-11
refs:
  - "[code://packages/sdk/src/terminals.ts#L96-L106](../../../../packages/sdk/src/terminals.ts#L96-L106) - a terminal's environment: the daemon's, then the caller's"
  - "[code://packages/sdk/src/terminals.ts#L399](../../../../packages/sdk/src/terminals.ts#L399) - `shellTerminals`, the one store for client and session terminals"
  - "[code://packages/server/src/commands/run.ts#L556](../../../../packages/server/src/commands/run.ts#L556) - where the daemon makes the store"
  - "[code://packages/agent-claude/src/session/config.ts#L142-L165](../../../../packages/agent-claude/src/session/config.ts#L142-L165) - `sourceFirst`, which puts the session's init script before each Bash command"
  - "[code://packages/server/src/config.ts#L196-L202](../../../../packages/server/src/config.ts#L196-L202) - `clientToolTimeoutMs`, the pattern for a daemon key that reaches each backend"
  - "[code://packages/sdk/src/host/root.ts#L144-L165](../../../../packages/sdk/src/host/root.ts#L144-L165) - root config is what a client pushes, not the daemon's own settings"
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/agentHostSchema.ts - `shellInitScripts`, a client's script for one session's shell
---

## Goal

A daemon that runs with its own environment, such as a service unit with a private `XDG_CONFIG_HOME`, gives agent shells the environment the operator names.
The setting is the operator's, for the whole daemon, and a client that needs a variable in one session uses `shellInitScripts`.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "shellTerminals\(" packages` - the daemon makes one store, and client and session terminals both use it.
- `rg "env" packages/sdk/src/terminals.ts` - a terminal takes `process.env` whole, then the caller's `env`.

### Runtime path

```
config.json shellEnv -> run.ts -> shellTerminals -> every terminal's environment
config.json shellEnv -> HostOptions -> Start -> Claude's sourceFirst -> every Bash command
```

### Gaps

- An agent shell gets the daemon's whole environment, and the operator cannot change it.
- A variable that a caller sets to `undefined` is not removed.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| One map, `shellEnv`, of variable to value, where `null` removes the variable | Softov, 2026-10-11, to "What shape should the shell environment setting take?" - "General shell env map" | 01 |
| It reaches host terminals and Claude's Bash in this plan, and other backends later | Softov, 2026-10-11, to "Which shells should the setting reach?" - "Host terminals and Claude" | 02, 03 |
| It is a key in the daemon's `config.json`, not in root config, because a client with `config:change` writes root config | [`code://packages/sdk/src/host/root.ts#L144-L165`](../../../../packages/sdk/src/host/root.ts#L144-L165) | 02 |

## Proposed architecture

- **Data flow** - the daemon reads `shellEnv` once, gives it to the terminal store, and gives it to each backend on `Start`.
- **Layer responsibilities** - `packages/sdk`: the helper, the terminal store and the `Start` field · `packages/server`: the key · `packages/agent-claude`: the Bash hook.
- **Source-of-truth files** - [`code://packages/sdk/src/terminals.ts`](../../../../packages/sdk/src/terminals.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - One function gives an agent shell its environment](task-01-one-function-gives-a-shell-its-environment.md) | done | - |
| [02 - The daemon reads shellEnv, and its terminals use it](task-02-the-daemon-reads-shellenv.md) | done | 01 |
| [03 - Claude's Bash commands use it](task-03-claudes-bash-commands-use-it.md) | done | 02 |

## Risks and tradeoffs

- The plan changes three packages, one more than a single plan holds - the three tasks are small, and each package has one task.
- A value goes into a Bash command as text - task 03 quotes it, and refuses a variable name that is not a shell name.

## Resume state

- **Done so far:** every task is done, and the plan is built. See [implemented.md](implemented.md).
- **Next action:** Softov's check by hand: a daemon with a `shellEnv` opens a terminal that prints the value.
- **Open questions:** none.

## Final verification checklist

- [x] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk packages/server packages/agent-claude` pass.
- [ ] A daemon with `"shellEnv": { "XDG_CONFIG_HOME": "/home/me/.config" }` opens a terminal where `echo $XDG_CONFIG_HOME` prints that path.
- [x] `plans/index.md` updated.
