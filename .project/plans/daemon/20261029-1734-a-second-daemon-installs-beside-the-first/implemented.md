---
title: A second daemon installs beside the first - implemented
date: 2026-10-29
refs:
  - git://8ee0eea5 - the last commit of the change, the docs
  - "[code://packages/server/src/service.ts#L48-L71](../../../../packages/server/src/service.ts#L48-L71) - `serviceUnit`, `serviceLabel`, `managedAs` and `ownConfigHome`"
  - "[code://packages/server/src/commands/service.ts#L96-L129](../../../../packages/server/src/commands/service.ts#L96-L129) - the install of a named service, and of one from a configuration home of its own"
  - "[code://packages/server/src/daemon.ts#L91](../../../../packages/server/src/daemon.ts#L91) - `Running.serviceName`"
---

A person can run a second ahpd daemon on a machine where one runs, each held by the service manager.
The second has a configuration home of its own, and its configuration file names its service: `"service": { "name": "two" }`.
`ahpd service install` then installs `ahpd@two` on systemd or `dev.ahpd.daemon.two` on launchd, beside the first one's service.
Every command run with that configuration home reaches that service.

## What was built

- [`code://packages/server/src/config.ts`](../../../../packages/server/src/config.ts) - `ServiceSetting`, and `Config.service`.
- [`code://packages/server/src/commands/options.ts`](../../../../packages/server/src/commands/options.ts) - the `service` key, which the configuration file alone sets, and `Options.serviceName`.
- [`code://packages/server/src/service.ts`](../../../../packages/server/src/service.ts) - the unit, the label, the calls and the files of a named service. An install from a configuration home of its own writes `XDG_CONFIG_HOME` into the file, and enables a unit by its path.
- [`code://packages/server/src/commands/service.ts`](../../../../packages/server/src/commands/service.ts) - the install and the uninstall of a named service, and the refusal of a second service for one daemon.
- [`code://packages/server/src/daemon.ts`](../../../../packages/server/src/daemon.ts), [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) and [`code://packages/server/src/commands/restart.ts`](../../../../packages/server/src/commands/restart.ts) - the name in the record, and the stop and the restarts through it.
- [`code://packages/server/src/doctor.ts`](../../../../packages/server/src/doctor.ts) - the Service check for the file of the named service.
- [`code://docs/server/RUN.md`](../../../../docs/server/RUN.md) and [`code://docs/server/CONFIGURE.md`](../../../../docs/server/CONFIGURE.md) - *More than one daemon*, `XDG_CONFIG_HOME` in the file of a service, and the `service` key.

## Verified

- Task 01's cases, in `service.test.ts` and `server-cli-service.test.ts`: 15 fail without its code, and pass with it. Two of the 15 are the plain install and uninstall at the command line. Each case has a configuration home of its own, so they expect the unit enabled by its path, with `XDG_CONFIG_HOME` in it.
- Task 02's cases, in `daemon.test.ts`, `doctor.test.ts` and `server-cli-restart.test.ts`: 4 fail without its code, and pass with it.
- The five files together: 160 pass, and 1 skips.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` exit 0.
- Vitest at one worker: `packages/server` 1651 pass and 2 skip, `packages/sdk` 3688 pass and 2 skip, and `packages/agent-claude` 423 pass.
- The prose lint finds nothing new in `RUN.md` and `CONFIGURE.md`.
- By hand on macOS 26.5.1, with the change built from a checkout and run on Bun 1.3.13. A daemon that launchd holds as `dev.ahpd.daemon` ran on port 9187 throughout. A configuration home of its own named its service `probe`, on port 9198. `service install` loaded `dev.ahpd.daemon.probe`, whose file sets `XDG_CONFIG_HOME`, and its daemon recorded `serviceName: "probe"`. `restart` started it again under a new pid, and `stop` took it out. A second `service install` loaded it again, and `service uninstall` stopped it and removed its file. The first daemon kept its pid through all of it.
- systemd ran only as the stand-in of the command-line cases.

## Departures from the plan

- Task 01, steps 8 and 9 - an install from a configuration home of its own writes `XDG_CONFIG_HOME`, and enables the unit by its path. This holds for a plain service too. Without the variable, a plain service from a private configuration home keeps to `~/.config/ahpd`. Without the path, its unit is in a folder the user manager does not read.
- Task 02, step 4 - `statusLine` names the manager, as for every service, and not the name. The configuration names the service, and *More than one daemon* gives its unit and label.

## Left for later

- none.
