---
title: A path and its spec are compared as real paths
status: done
depends: []
layer: server
refs:
  - "[code://packages/server/src/install.ts#L630-L680](../../../../packages/server/src/install.ts#L630-L680) - `realOf` and `namesInstalled`"
  - "[code://packages/server/test/plugin-install.test.ts#L391-L426](../../../../packages/server/test/plugin-install.test.ts#L391-L426) - the two cases"
---

## Objective

`namesInstalled` names a path by the `file:` spec npm wrote for it.
It does so when a symbolic link is on the way to the plugin root or in the path.
It compares real paths, because npm writes the spec between real paths.

## Files

- `UPDATE: packages/server/src/install.ts:22` - import `realpathSync` from `node:fs`.
- `UPDATE: packages/server/src/install.ts:630-680` - add `realOf`, and compare the real paths of a spec and its source in `namesInstalled`.
- `UPDATE: packages/server/test/plugin-install.test.ts:1-5` - import `symlinkSync` and `posix`.
- `UPDATE: packages/server/test/plugin-install.test.ts:391-426` - a case with a link to the plugin root, and a case with a link in the path.

## Steps

1. Add a case where the configuration directory is a link to a folder two levels deeper.
2. Give the fake npm `@ahpd/sdk` and the spec from the real directory, as npm 11.19.0 wrote them.
3. Add a case where the path goes through a link to the folder that holds the plugin.
4. Run `plugin-install.test.ts`, and see both cases fail with "npm wrote no dependency".
5. Copy `realOf` from `packages/computer/src/gitdir.ts` into `install.ts`.
6. In `namesInstalled`, read the real path of the root once, before the sources.
7. Resolve each `file:` spec against that real path, and compare its real path with the real path of the source.
8. Run `plugin-install.test.ts` again, and see every case pass.

## Validation

- In `plugin-install.test.ts`, the two new cases fail without steps 6 and 7, and pass with them.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`, and see each exit 0.
- Run vitest on `packages/server` from the repository root.
- Install a plugin path with npm 11.19.0 and `XDG_CONFIG_HOME` behind a link, and see `plugins` name it.
- Install a plugin path that goes through a link, and see `plugins` name it.

## Resume

Done 2026-10-26.
Every step is built, and every check the Validation names was run.

`namesInstalled` reads the real path of the plugin root once.
It resolves each `file:` spec against that path, and compares the real path of the result with the real path of the source.
The comparison of a spec with the source as written is unchanged, and so is the fallback for one added dependency.

File by file:

- `packages/server/src/install.ts` - `realpathSync` joins the `node:fs` import. `realOf` is the helper of `packages/computer/src/gitdir.ts`, with its comment. The comment of `namesInstalled` and the comment at the comparison say how npm writes the spec, and the second one links npm's source.
- `packages/server/test/plugin-install.test.ts` - two cases after the one for a path and a tarball URL. The first makes the configuration directory a link to `deep/er/ahpd`, and the fake writes `file:../../../my-plugin` beside `@ahpd/sdk`. The second installs `link/my-plugin`, where `link` points at `deep/er`, and the fake writes `file:../deep/er/my-plugin`. Each link is a junction on Windows, as in `agent-pi-asking.test.ts`.

Judgement calls the plan does not decide, each visible in the file it is made in:

- The real path is read on both ends, and not only for the root. For a folder, npm writes the spec to its real path. For a tarball, npm keeps the path as written. Only a comparison of real paths matches both.
- The cases make the folder of the plugin, because npm installs only a folder that is there.
- No case for macOS: `tools/test-tmpdir.ts` reads the run's folder by its real path, so a case there compares the same paths as on Linux. The file passes with `TMPDIR` behind a link.
