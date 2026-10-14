---
title: ahpd paths sets the served folders
domain: daemon
status: active
priority: high
created: 2026-10-14
revalidated: 2026-10-14
refs:
  - "[code://packages/server/src/commands/configure.ts#L309-L321](../../../../packages/server/src/commands/configure.ts#L309-L321) - `askToServe`: `under`, the read and write of `paths`, and the push to the running list"
  - "[code://packages/server/src/commands/configure.ts#L219-L222](../../../../packages/server/src/commands/configure.ts#L219-L222) - the refusal of an empty `paths`"
  - "[code://packages/server/src/commands/plugin.ts#L117-L174](../../../../packages/server/src/commands/plugin.ts#L117-L174) - `plugin install` and `remove`: one declaration for the terminal and the served form, `oneAtATime`, and the restart line"
  - "[code://packages/server/src/commands/config.ts#L168-L199](../../../../packages/server/src/commands/config.ts#L168-L199) - a read declared for the terminal and HTTP, with `served` deciding the file"
  - "[code://packages/server/src/commands/registry.ts#L52-L69](../../../../packages/server/src/commands/registry.ts#L52-L69) - `cliRegistry`, where a terminal command is declared"
  - "[code://packages/server/src/commands/served.ts#L76-L87](../../../../packages/server/src/commands/served.ts#L76-L87) - the served registry"
  - "[code://packages/server/src/install.ts#L275-L310](../../../../packages/server/src/install.ts#L275-L310) - `readEntry`, `writeEntry` and `oneAtATime`"
---

## Goal

A client sets the folders a host serves with one command.
ahp-desk needs this for the folder step of Add host, which Softov noted on 2026-10-13.
Today only `ahpd configure` and the question at `ahpd start` write `paths`, and `--path` serves a folder for one run only.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "paths" packages/server/src/commands` - `configure` and `askToServe` write `paths`. No other command does.
- `rg -n "options.paths" packages/server/src` - the running daemon reads the list for `paths[0]`, for `running().paths` and for the plugins' frozen copy.
- `rg -n "not served" packages/sdk/src packages/server/src` - no session is refused for a folder outside `paths`.

### Runtime path

```
ahpd paths add <folder> -> resolve -> readEntry(config.json) -> writeEntry with the folder -> a restart line when a daemon is recorded
POST /v1/paths/add -> the same write to the daemon's config.json -> served.options.paths changes -> ahpd status shows it
```

### Gaps

- No command adds or removes a served folder without a question.
- A running daemon takes a new folder only from the question at `ahpd start`.

## Decisions locked in

| Decision | Source |
| --- | --- |
| [`ahpd paths list`, `add` and `remove` change the served folders, and none of them asks](../../../../docs/DAEMON.md) | Softov, 2026-10-14 |
| [`ahpd paths add` and `remove` at the terminal reach a running daemon by themselves](../../../../docs/DAEMON.md) | Softov, 2026-10-14 |

| What | Source | Task |
| --- | --- | --- |
| `add` refuses a folder that does not exist or is not a directory | a folder is served for agents to work in | 01 |
| `add` of a folder already under a served one changes nothing and says so | `under` in `askToServe` | 01 |
| `remove` refuses the last folder | `configure.ts:219-222`: an empty `paths` serves the current folder | 01 |
| Served, `add` and `remove` take the deployment's own token only | `plugin install` and `remove`: a change of what agents can reach | 02 |
| A served change rewrites `paths` in `daemon.json`, so `ahpd status --json` at the terminal shows it | Softov's Windows run, 2026-10-14: local status showed the old folders | 03 |

## Proposed architecture

- **Data flow** - one `declarePaths(registry, served?)` declares `paths list`, `paths add` and `paths remove`. At the terminal they edit the file the `configFile` field names. Served, they edit the daemon's file and change `served.options.paths`.
- **Layer responsibilities** - server only: a new `commands/paths.ts`, and one line each in `registry.ts` and `served.ts`.
- **Source-of-truth files** - `packages/server/src/commands/paths.ts`, which task 01 creates.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - ahpd paths lists, adds and removes a folder](task-01-ahpd-paths-lists-adds-and-removes-a-folder.md) | implemented | - |
| [02 - a served paths change reaches the running daemon](task-02-a-served-paths-change-reaches-the-running-daemon.md) | implemented | 01 |
| [03 - what the Windows run found in ahpd paths is fixed](task-03-what-the-windows-run-found.md) | implemented | 02 |

## Risks and tradeoffs

- A folder removed while the daemon runs stays the default folder if it was `paths[0]`, until the next start.
- A plugin keeps the list it loaded with until the next start.
- `paths` in a configuration layer other than the named file is not changed. `list` shows what every layer says.

## Resume state

- **Done so far:** planned 2026-10-14; tasks 01 to 03 implemented 2026-10-14; task 03 reviewed. `ahpd paths list`, `add` and `remove` are declared once and serve both surfaces. At the terminal they edit the file `--config-file` names. Served they edit the daemon's own file, and change the list that daemon serves, so `ahpd status` shows the change with no restart.
- **Next action:** the checks by hand, on Linux and on Windows. At the terminal, `ahpd paths add` and `remove` send the change to a running daemon that serves the HTTP API, and write the file otherwise.
- **Open questions:** none.
- **Watch out for:** the suite rewrites `packages/sdk/test/fixtures/wire.jsonl`. Restore it before a commit. `docs/DAEMON.md`'s `## Commands` block lists every verb, the three `paths` verbs included.

## Final verification checklist

- [ ] On a fresh folder, `ahpd paths add <folder>` writes `config.json`, and `ahpd start` serves the folder.
- [ ] With a daemon running and `http` on, a plain `ahpd paths add <folder>` makes `ahpd status --json` show the folder with no restart.
- [ ] `ahpd paths remove` of the last folder is refused, and of a folder not listed stops with no question.
- [ ] `plans/index.md` updated.
