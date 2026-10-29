---
title: A second daemon installs beside the first
domain: daemon
status: active
priority: medium
created: 2026-10-29
revalidated: 2026-10-29
refs:
  - "[code://packages/server/src/service.ts#L33-L37](../../../../packages/server/src/service.ts#L33-L37) - `UNIT` and `LABEL`, the one unit and the one label every service is installed and reached under"
  - "[code://packages/server/src/service.ts#L69-L113](../../../../packages/server/src/service.ts#L69-L113) - `managerCall`, `installCalls` and `uninstallCalls`, each naming that unit or label"
  - "[code://packages/server/src/service.ts#L144-L154](../../../../packages/server/src/service.ts#L144-L154) - `unitFile` under the configuration home, and `agentFile` in the one folder launchd reads"
  - "[code://packages/server/src/service.ts#L157-L306](../../../../packages/server/src/service.ts#L157-L306) - `ServiceFacts`, `unitOf` and `plistOf`, the whole of what the file says"
  - "[code://packages/server/src/commands/service.ts#L62-L90](../../../../packages/server/src/commands/service.ts#L62-L90) - the install takes the configuration file alone, and refuses a daemon from `ahpd start`"
  - "[code://packages/server/src/daemon.ts#L80-L85](../../../../packages/server/src/daemon.ts#L80-L85) - `Running.service`, the manager a supervised daemon records itself under"
  - "[code://packages/server/src/daemon.ts#L775-L776](../../../../packages/server/src/daemon.ts#L775-L776) - a stop asks the manager by the service alone"
  - "[code://packages/server/src/commands/restart.ts#L587-L589](../../../../packages/server/src/commands/restart.ts#L587-L589) - a restart asks it the same way"
  - "[code://packages/server/src/commands/run.ts#L278-L279](../../../../packages/server/src/commands/run.ts#L278-L279) - the daemon reads its manager out of `AHPD_SERVICE`"
  - "[code://packages/server/src/commands/run.ts#L1890](../../../../packages/server/src/commands/run.ts#L1890) - and hands its own restart to that manager"
  - "[code://packages/server/src/doctor.ts#L234-L243](../../../../packages/server/src/doctor.ts#L234-L243) - the service check looks for the one file"
  - "[code://packages/server/src/commands/options.ts#L671-L680](../../../../packages/server/src/commands/options.ts#L671-L680) - `policies`, a block the configuration file alone sets, the pattern the new key copies"
  - "[code://packages/server/src/commands/options.ts#L730](../../../../packages/server/src/commands/options.ts#L730) - `FILE_ONLY`, the keys with no flag"
  - "[code://packages/server/src/scheduled.ts#L163](../../../../packages/server/src/scheduled.ts#L163) - `isAutomationId`, the shape of an id a person types"
  - "[code://packages/server/test/cli.ts#L137](../../../../packages/server/test/cli.ts#L137) - each command-line case has a configuration home of its own, and installs the plain service"
  - "[code://docs/plugins/COMPUTERS.md#L833](../../../../docs/plugins/COMPUTERS.md#L833) - a second daemon on one machine is one with an `XDG_CONFIG_HOME` of its own"
  - https://www.freedesktop.org/software/systemd/man/latest/systemctl.html - `enable PATH` links a unit file outside the unit folders, and `disable` undoes the link
  - https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html - `<prefix>@<instance>.service`, systemd's form for several of one service
---

## Goal

A person can run two ahpd daemons on one machine, each held by the machine's service manager.
Each daemon has a configuration home of its own, so its own folder, record, port and plugins.
The configuration file names the service that holds the daemon, and every command reaches that service.
A configuration that names no service installs and reaches exactly the service it does today.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "UNIT|LABEL" packages/server/src` - the two constants name every unit file, agent file and manager call.
- `rg -n "XDG_CONFIG_HOME" packages/server docs` - the configuration home is the one way to give a daemon a folder of its own.
- `rg -n "realManager|installFile" packages/server/src` - stop, restart, the daemon's own restart, install, uninstall and doctor reach the manager through these two.
- `rg -n "a-z0-9-" packages/server/src packages/bot/src` - an id a person types is lowercase letters, digits and dashes.

### Runtime path

```
ahpd service install -> commands/service.ts -> installFile + installText -> a file named UNIT or LABEL
  -> realManager().install -> systemctl --user enable --now ahpd | launchctl bootstrap gui/<uid> <plist>
the daemon a manager starts -> run.ts reads AHPD_SERVICE -> records service -> hand: realManager().restart(service)
ahpd stop | ahpd restart -> daemon.ts | restart.ts -> manager.stop(service) | manager.restart(service) -> UNIT or LABEL
```

### Gaps

- A second daemon installs over the first one's service: both are `ahpd` and `dev.ahpd.daemon`.
- The file a service runs sets no `XDG_CONFIG_HOME`, so the daemon a manager starts keeps its state in `~/.config/ahpd`.
- A unit under a configuration home that is not systemd's own is outside its unit folders, and `enable` by name does not find it.
- `ahpd stop`, `ahpd restart` and the daemon's own restart reach `UNIT` or `LABEL`, never the service that holds a second daemon.
- `Not found: a name for a service - searched "service", "label", "instance" in packages/server/src/config.ts and packages/server/src/commands/options.ts.`

## Answers

| What | Source | Task |
| --- | --- | --- |
| One daemon on a machine is the default, and never the only case | Aaron Paterson, 2026-10-28: "the sane default assumption is one per machine or container but not necessarily just one" | - |
| The configuration file names the service, in a block it alone sets | The install takes the configuration file alone ([code://packages/server/src/commands/service.ts#L62-L72](../../../../packages/server/src/commands/service.ts#L62-L72)); `policies` is such a block | 01 |
| A configuration that names none installs `ahpd` and `dev.ahpd.daemon`, as every case already does | [code://packages/server/test/cli.ts#L137](../../../../packages/server/test/cli.ts#L137) | 01 |
| A named service is `ahpd@<name>` on systemd and `dev.ahpd.daemon.<name>` on launchd | systemd's instance form, https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html, and one more part of a reverse-DNS label | 01 |
| A name is a lowercase letter or digit, then up to 39 letters, digits and dashes | [code://packages/server/src/scheduled.ts#L163](../../../../packages/server/src/scheduled.ts#L163) | 01 |
| A named service's file sets `XDG_CONFIG_HOME` to the configuration home of the install | [code://docs/plugins/COMPUTERS.md#L833](../../../../docs/plugins/COMPUTERS.md#L833) | 01 |
| systemd enables a named unit by its path, which links it into its unit folder | https://www.freedesktop.org/software/systemd/man/latest/systemctl.html | 01 |
| An install refuses a second service for a daemon that a service already holds | The refusal of a daemon from `ahpd start` ([code://packages/server/src/commands/service.ts#L80-L90](../../../../packages/server/src/commands/service.ts#L80-L90)) | 01 |
| The daemon records the name, and stop and restart reach the service by it | [code://packages/server/src/daemon.ts#L80-L85](../../../../packages/server/src/daemon.ts#L80-L85) | 02 |

## Proposed architecture

- **Data flow** - `service.name` in the configuration file, then `Options.serviceName`, then the install's file name, label and environment, the daemon's record and each manager call.
- **State flow** - the record holds `serviceName` beside `service`, and a stop and a restart read both.
- **Layer responsibilities** - server: `config.ts`, `commands/options.ts`, `service.ts`, `commands/service.ts`, `daemon.ts`, `commands/run.ts`, `commands/restart.ts` and `doctor.ts` · docs: `docs/server/RUN.md` and `docs/server/CONFIGURE.md`.
- **Source-of-truth files** - [`code://packages/server/src/service.ts`](../../../../packages/server/src/service.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A service is installed under its name](task-01-a-service-is-installed-under-its-name.md) | todo | - |
| [02 - Its daemon is reached under that name](task-02-its-daemon-is-reached-under-that-name.md) | todo | 01 |
| [03 - The docs say how a second daemon runs](task-03-the-docs-say-how-a-second-daemon-runs.md) | todo | 01, 02 |

## Risks and tradeoffs

- A name changed in the file while its service runs is the name the next stop reaches. The install refuses a second service for one daemon, so the person takes the old one out first.
- systemd reads a named unit from its daemon's configuration home, so that folder must be there when the user manager starts.

## Resume state

- **Done so far:** planned 2026-10-29.
- **Next action:** [task-01-a-service-is-installed-under-its-name.md](task-01-a-service-is-installed-under-its-name.md).
- **Open questions:** none.
- **Watch out for:** each command-line case has a configuration home of its own, and still installs the plain service.

## Final verification checklist

- [ ] A case installs a named service, sees `ahpd@two` enabled by its path, and fails without task 01.
- [ ] The plain install's calls and file are unchanged, and the existing cases pass untouched.
- [ ] Stop, restart and uninstall of a named service reach `ahpd@two` and `dev.ahpd.daemon.two`.
- [ ] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` exit 0, and the server suite passes.
