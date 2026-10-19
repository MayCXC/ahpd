---
title: The daemon reads the new names
status: todo
depends: []
layer: "packages/server"
refs:
  - "[code://packages/server/src/config.ts](../../../../packages/server/src/config.ts) - `Config` and the file read"
  - "[code://packages/server/src/commands/options.ts](../../../../packages/server/src/commands/options.ts) - the fields, `FILE_ONLY`, the checks and the run"
  - "[code://packages/server/src/rootconfig.ts](../../../../packages/server/src/rootconfig.ts) - `DAEMON_KEYS` and the write"
---

## Objective

The daemon declares `httpApi` and `modelProxy` in place of `http` and `proxy`.
It still reads the old names, and warns at start for each one it finds.

## Files

- `UPDATE: packages/server/src/config.ts` - rename the two keys in `Config`, and map the old names when the file is read.
- `UPDATE: packages/server/src/commands/options.ts` - rename the two fields, `FILE_ONLY`, the checks and the reads.
- `UPDATE: packages/server/src/rootconfig.ts` - rename the keys in `DAEMON_KEYS`, and remove an old name on a write.
- `UPDATE: packages/server/src/proxy` - rename each read of the configuration key, and keep the `proxy` grant.
- `UPDATE: packages/server/test` - rename the keys in the tests, and add the cases below.

## Steps

1. Rename `http` to `httpApi` and `proxy` to `modelProxy` in `Config`, the fields, `FILE_ONLY` and `DAEMON_KEYS`.
2. Keep the titles "HTTP API" and "Model proxy" on the two fields.
3. Make the file read map `http` to `httpApi` and `proxy` to `modelProxy`.
4. Make the read return one warning for each old name: "`http` is now `httpApi`; rename it in <file>."
5. Show each warning with the other start warnings.
6. Stop the start when the file has an old name and its new name, and name both keys.
7. Make a client write of `httpApi` or `modelProxy` remove the old name from the file.
8. Rename the keys in each error message that names them.
9. Keep the `proxy` grant, the `proxy:call` operation and the `proxy` match type of a policy as they are.

## Validation

- A test starts from a file with `http` and `proxy`, and gets two warnings and the same settings.
- A test starts from a file with `http` and `httpApi`, and the start stops.
- A test writes `httpApi` through root config, and the file has no `http` after it.
- `server-root-config.test.ts` names `httpApi` and `modelProxy`.
- The gates pass.

## Resume
