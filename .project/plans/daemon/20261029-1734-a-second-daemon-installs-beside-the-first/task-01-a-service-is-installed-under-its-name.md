---
title: A service is installed under its name
status: todo
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

