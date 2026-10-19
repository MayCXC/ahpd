---
title: A host path has a machine path
status: todo
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/src/machine.ts](../../../../packages/sdk/src/machine.ts) - beside `partTarget` and `PART_ROOT`"
  - "[code://packages/sdk/src/index.ts#L57](../../../../packages/sdk/src/index.ts#L57) - where `machine.ts` is re-exported"
---

## Objective

One pair of functions turns a host path into the path it has inside a machine, and back.

## Files

- `UPDATE: packages/sdk/src/machine.ts` - `machinePathOf` and `hostPathOf`.
- `UPDATE: packages/sdk/src/index.ts:57` - both exported.
- `CREATE: packages/sdk/test/machine-paths.test.ts` - both directions, on both platforms' rules.

## Steps

1. Add the pair to `machine.ts`, taking the platform as a parameter so both rules are tested on any host:

   ```ts
   /** A host path as it is inside a machine: `C:\a\b` is `/c/a/b` on Windows, and a POSIX path is itself. */
   export const machinePathOf = (path: string, platform: NodeJS.Platform = process.platform): string => {
     if (platform !== 'win32') return path;
     const drive = /^([A-Za-z]):[\\/]?(.*)$/.exec(path);
     if (drive === null) return path.replaceAll('\\', '/');
     return `/${(drive[1] as string).toLowerCase()}/${(drive[2] as string).replaceAll('\\', '/')}`.replace(/\/$/, '') || '/';
   };

   /** A machine path back as the host path it names: `/c/a/b` is `C:\a\b` on Windows, and itself elsewhere. */
   export const hostPathOf = (path: string, platform: NodeJS.Platform = process.platform): string => {
     if (platform !== 'win32') return path;
     const drive = /^\/([a-z])(?:\/(.*))?$/.exec(path);
     if (drive === null) return path;
     return `${(drive[1] as string).toUpperCase()}:\\${(drive[2] ?? '').replaceAll('/', '\\')}`;
   };
   ```

2. Export both from `index.ts` beside `partTarget`.
3. Test: `C:\Users\ana\proj` and `C:/Users/ana/proj` are `/c/Users/ana/proj`; `C:\` is `/c`; back again on `win32`; a POSIX path is itself on `linux` both ways; a machine path that is not drive-style, `/ahpd/pi`, comes back unchanged.
4. Run the sdk tests and the typecheck.
5. Set this task and the plan row to `implemented`.

## Validation

- `machine-paths.test.ts` passes on Linux and on Windows.
