---
title: Its daemon is reached under that name
status: todo
depends: [task-01-a-service-is-installed-under-its-name.md]
layer: server
refs:
  - "[code://packages/server/src/daemon.ts#L80-L85](../../../../packages/server/src/daemon.ts#L80-L85) - `Running.service`, which `serviceName` sits beside"
  - "[code://packages/server/src/daemon.ts#L313-L345](../../../../packages/server/src/daemon.ts#L313-L345) - `recordOf`, which the daemon writes its record with"
  - "[code://packages/server/src/daemon.ts#L429-L432](../../../../packages/server/src/daemon.ts#L429-L432) - `statusLine`, which names the manager"
  - "[code://packages/server/src/daemon.ts#L775-L776](../../../../packages/server/src/daemon.ts#L775-L776) - the stop through the manager"
  - "[code://packages/server/src/commands/restart.ts#L587-L589](../../../../packages/server/src/commands/restart.ts#L587-L589) - the restart through the manager"
  - "[code://packages/server/src/commands/run.ts#L278-L279](../../../../packages/server/src/commands/run.ts#L278-L279) - the daemon reads its manager"
  - "[code://packages/server/src/commands/run.ts#L1890](../../../../packages/server/src/commands/run.ts#L1890) - the daemon's own restart"
  - "[code://packages/server/src/doctor.ts#L234-L243](../../../../packages/server/src/doctor.ts#L234-L243) - the service check"
---

## Objective

A daemon a named service holds records the name beside its manager.
`ahpd stop`, `ahpd restart`, the daemon's own restart and `ahpd status` reach and name that service.
`ahpd doctor` looks for the file of the service its configuration names.

## Files

- `UPDATE: packages/server/src/daemon.ts:80-85` - add `Running.serviceName`.
- `UPDATE: packages/server/src/daemon.ts:313-345` - take the name in `recordOf`.
- `UPDATE: packages/server/src/daemon.ts:429-432` - name the service in `statusLine` when it has a name.
- `UPDATE: packages/server/src/daemon.ts:775-776` - stop through the manager with the recorded name.
- `UPDATE: packages/server/src/commands/restart.ts:587-589` - restart through the manager with the recorded name.
- `UPDATE: packages/server/src/commands/run.ts:278-279` - keep the name of a supervised daemon's service, and record it.
- `UPDATE: packages/server/src/commands/run.ts:1890` - hand the daemon's own restart to its service by that name.
- `UPDATE: packages/server/src/doctor.ts:234-243` - look for the file of the named service.
- `UPDATE: packages/server/test/daemon.test.ts` - a stop of a named service.
- `UPDATE: packages/server/test/doctor.test.ts` - the check for a named service's file.

## Steps

1. Add a case to `daemon.test.ts` that stops a record naming `launchd` and `two`, and expects the manager asked with `two`.
2. Add a case to `doctor.test.ts` that reads a configuration naming `two`, and expects the check to name that file.
3. Run both files, and see both cases fail.
4. Add `serviceName` to `Running`, take it in `recordOf`, and name it in `statusLine`.
5. Pass the recorded name to `manager.stop` and `manager.restart`.
6. In `run.ts`, keep `serviceName` for a daemon a manager started, record it, and restart through it.
7. In `doctor.ts`, read the name from the configuration, and look for that file.
8. Run both files again, and see every case pass.

## Validation

- The cases in `daemon.test.ts` and `doctor.test.ts` fail before steps 4 to 7, and pass after them.
- A record without `serviceName` stops, restarts and reads as before.
- Run `pnpm -s typecheck`, and see it exit 0.

## Resume

