---
title: ahpd doctor says what is wrong
domain: daemon
status: draft
priority: medium
created: 2026-10-15
revalidated: 2026-10-15
requires:
  - plans/daemon/28-setup-finds-the-runtimes-and-agents/plan.md
refs:
  - "[code://packages/server/src/commands/status.ts](../../../../packages/server/src/commands/status.ts) - `ahpd status` reads the daemon's record, and does not ask the daemon"
  - "[code://packages/server/src/commands/config.ts](../../../../packages/server/src/commands/config.ts) - `ahpd config` lists the files and which file set each key"
  - "[code://packages/server/src/commands/plugin.ts](../../../../packages/server/src/commands/plugin.ts) - `plugin list` resolves and imports each plugin without applying it"
  - "[code://packages/server/src/update.ts](../../../../packages/server/src/update.ts) - `updateLine`, the line that says a newer ahpd exists"
  - "[code://packages/server/package.json](../../../../packages/server/package.json) - `engines`: Node 22 or later"
---

## Goal

`ahpd doctor` runs every check on this machine and prints one line for each, with the fix when a check fails.
A person runs one command, and not `status`, `config` and `plugin list` one after the other.
`ahpd doctor --json` is the output for a support ticket.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "doctor" packages/server/src docs` - no doctor command exists.
- `rg -n "pattern:" packages/server/src/commands` - `status`, `config` and `plugin list` each report one part.

### Runtime path

```
ahpd doctor -> runtime, config, daemon, plugins, agents, update -> one line per check -> exit 1 when a check fails
```

### Gaps

- `ahpd status` reads the record that the daemon wrote. It does not find a daemon that is in the record but does not answer.
- No command checks that the agent CLIs in the configuration are on PATH.
- No command says what is wrong in one output.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpd gets a `doctor` command | Softov, 2026-10-15, to "The `ahpd doctor` question in plan 28 is my own speculation. What do I do with it?" - "we need a doctor command" | - |
| doctor is its own plan, and it uses the detection from plan 28 | Softov, 2026-10-15, to "Where does `ahpd doctor` go?" - "Its own plan, daemon/29" | - |

## Proposed architecture

- **Checks** - each check gives `ok`, `warn` or `fail`, one line of text, and a fix for `warn` and `fail`.
  - **Runtime** - the Node version against `engines`, and Bun when ahpd runs on Bun.
  - **Config** - each file that `loadConfig` reads, and whether it parses.
  - **Daemon** - the record, then a request to its URL. A record with no answer is `fail`, with `ahpd restart` as the fix.
  - **Plugins** - each plugin resolves and imports, as `plugin list` does.
  - **Agents** - each configured agent CLI is on PATH, from plan 28's lookup. A CLI found but not configured is `warn`, with `ahpd configure` as the fix.
  - **Update** - `updateLine`, as `warn`.
- **Output** - the lines in that order, then a count. The exit code is 1 when a check is `fail`.
- **JSON** - `--json` gives the same checks as an array, through the output contract.
- **Secrets** - doctor never prints the connection token or a plugin secret, as `status` and `config` do not.
- **Source-of-truth files** - CREATE: `packages/server/src/commands/doctor.ts`

## Tasks

Tasks are written when the plan moves to `planned`. The proposal is:

1. The checks, each a function that returns `ok`, `warn` or `fail`.
2. The `doctor` command, its text, its JSON and its exit code.
3. The docs page for the CLI describes doctor.

## Risks and tradeoffs

- A check that hangs stops the report - Each check has a time limit, and a check that is too slow is `fail`.
- The daemon check sends a request with the token from the record - The token is not printed, and the request reads only `/status`.

## Resume state

- **Done so far:** the proposal, 2026-10-15.
- **Next action:** Softov reviews the list of checks; then write the tasks and move the plan to `planned`.
- **Open questions:** none.
- **Watch out for:** plan 28 builds the PATH lookup; doctor uses it and does not copy it.

## Final verification checklist

- [ ] With the daemon stopped but its record left, doctor prints `fail` for the daemon and exits 1.
- [ ] `ahpd doctor --json` holds no token.
- [ ] `plans/index.md` updated.
