---
title: A service is installed under its name
status: done
depends: []
layer: server
refs:
  - "[code://packages/server/src/config.ts#L64-L80](../../../../packages/server/src/config.ts#L64-L80) - `PoliciesSetting`, the block the new `ServiceSetting` sits beside"
  - "[code://packages/server/src/commands/options.ts#L671-L680](../../../../packages/server/src/commands/options.ts#L671-L680) - the `policies` field and its description"
  - "[code://packages/server/src/service.ts#L33-L306](../../../../packages/server/src/service.ts#L33-L306) - the names, the calls, the files and their text"
  - "[code://packages/server/src/commands/service.ts#L62-L170](../../../../packages/server/src/commands/service.ts#L62-L170) - `service install` and `service uninstall`"
  - "[code://packages/server/test/service.test.ts](../../../../packages/server/test/service.test.ts) - the calls and the file text, through the `Run` seam"
  - "[code://packages/server/test/server-cli-service.test.ts](../../../../packages/server/test/server-cli-service.test.ts) - install and uninstall at the command line, against the stand-in `systemctl`"
---

## Objective

A configuration file may name the service that holds its daemon, as `"service": { "name": "two" }`.
`ahpd service install` and `ahpd service uninstall` then write, enable and take out `ahpd@two` or `dev.ahpd.daemon.two`.
The file of a named service sets `XDG_CONFIG_HOME`, so the daemon keeps to the folder of the install.
A configuration that names no service installs and takes out `ahpd` and `dev.ahpd.daemon`, as before.

## Files

- `UPDATE: packages/server/src/config.ts:64-80` - add `ServiceSetting`, with `name`, and `Config.service`.
- `UPDATE: packages/server/src/commands/options.ts:671-730` - add the `service` field, with the name's pattern, and add it to `FILE_ONLY`.
- `UPDATE: packages/server/src/commands/options.ts` - add `Options.serviceName`, read from `service.name`.
- `UPDATE: packages/server/src/service.ts:33-306` - add `serviceUnit` and `serviceLabel`, and give each call, file and text the name.
- `UPDATE: packages/server/src/commands/service.ts:62-170` - read the name from the configuration, and refuse a second service for one daemon.
- `UPDATE: packages/server/test/service.test.ts` - cases for a named service's calls, files and text.
- `UPDATE: packages/server/test/server-cli-service.test.ts` - a case that installs and takes out a named service.

## Steps

1. Add a case to `server-cli-service.test.ts` that installs with `"service": { "name": "two" }` in the configuration.
2. Expect the unit at `systemd/user/ahpd@two.service` under the case's configuration home, and `enable --now` with that path.
3. Run `server-cli-service.test.ts`, and see the case fail.
4. Add `ServiceSetting` to `config.ts`, and the `service` field with its pattern to `serverFields`.
5. Add `service` to `FILE_ONLY`, and read `serviceName` in `optionsFrom`.
6. Add `serviceUnit` and `serviceLabel` to `service.ts`: `ahpd@<name>` and `dev.ahpd.daemon.<name>`, and `UNIT` and `LABEL` without a name.
7. Give `managerCall`, `installCalls`, `uninstallCalls`, `unitFile`, `agentFile` and `installFile` an optional name.
8. In `installCalls`, enable a named unit by its path, and an unnamed one by its name as before.
9. Give `ServiceFacts` an optional `name` and `configHome`, which `unitOf` and `plistOf` write as the label and `XDG_CONFIG_HOME`.
10. In `service install`, read the name from the options, and refuse when the record names a service of another name.
11. In `service uninstall`, take the configuration file, read the name, and take out that service.
12. Add the cases to `service.test.ts`, and run both files again.

## Validation

- In `server-cli-service.test.ts`, the named case fails before steps 4 to 11, and passes after them.
- The cases that name no service pass unchanged.
- In `service.test.ts`, a named service's calls, files and text are what steps 6 to 9 say.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`, and see each exit 0.

## Resume

Done 2026-10-29.
Every step is built, and every check the Validation names was run.

`"service": { "name": "two" }` in the configuration file is `Options.serviceName`.
The install, the uninstall and each manager call take it: `ahpd@two` on systemd, and `dev.ahpd.daemon.two` on launchd.
A configuration that names none installs and takes out `ahpd` and `dev.ahpd.daemon`.

File by file:

- `packages/server/src/config.ts` - `ServiceSetting`, and `Config.service`.
- `packages/server/src/commands/options.ts` - the `service` field with the name's pattern, `service` in `FILE_ONLY`, and `Options.serviceName`.
- `packages/server/src/service.ts` - `serviceUnit`, `serviceLabel`, and `managedAs`, which names the unit or the label of a manager. `ownConfigHome` is the configuration home of the install when it is not `~/.config`. `installCalls` enables a unit by its path when it is asked to. `ServiceFacts` takes `name` and `configHome`, which `unitOf` and `plistOf` write as the label and as `XDG_CONFIG_HOME`.
- `packages/server/src/commands/service.ts` - the install reads the name, and refuses a daemon that a service of another name holds. From a configuration home of its own, it writes that home into the file and enables the unit by its path. The uninstall takes `--config-file`. It takes out the service the record of the held daemon names, or the one the configuration names when no daemon runs.
- `packages/server/test/service.test.ts` - a named service's names, calls, files and text, a unit under a configuration home of its own, and `ownConfigHome`.
- `packages/server/test/server-cli-service.test.ts` - a named install beside the plain one, the refusal, and both uninstalls. Each case has a configuration home of its own, so the plain cases expect the unit enabled by its path, and `XDG_CONFIG_HOME` in it.

Judgement calls the plan does not decide, each visible in the file it is made in:

- `XDG_CONFIG_HOME` is written by every install from a configuration home of its own, named or not. The daemon a manager starts has the manager's environment, and without the variable it keeps to `~/.config/ahpd`.
- The unit of such an install is enabled by its path, named or not. The folder it is written in is not one the user manager reads.
- The refusal names the unit or the label of the service that holds the daemon, so the person knows which one to take out.

