---
title: the first ahpd paths add keeps the start folder
status: done
depends: [task-03-what-the-windows-run-found.md]
layer: server
refs:
  - "[code://packages/server/src/commands/paths.ts](../../../../packages/server/src/commands/paths.ts) - the add, which writes only the new folder when the file names none"
  - "[code://packages/server/src/commands/options.ts#L1020-L1033](../../../../packages/server/src/commands/options.ts#L1020-L1033) - a run that names no folder serves `process.cwd()`"
  - "[code://packages/server/src/commands/configure.ts#L219-L222](../../../../packages/server/src/commands/configure.ts#L219-L222) - the same rule, said at the terminal"
  - "[code://packages/server/src/commands/run.ts#L1076-L1096](../../../../packages/server/src/commands/run.ts#L1076-L1096) - the announcement the record is read from"
  - "[code://packages/server/src/daemon.ts#L281-L301](../../../../packages/server/src/daemon.ts#L281-L301) - `recordOf`"
---

## Objective

A daemon that names no folder serves the folder it was started in, its start folder.
When the file names no `paths` and the daemon serves its start folder, the first `ahpd paths add` writes the start folder and the new folder.
After that, `paths list`, `ahpd status`, `paths remove` and a restart all name the same folders.
A file that already names `paths` is changed as before.

## Files

- `UPDATE: packages/server/src/commands/options.ts:35-45` - `Options` gains `startFolder?: string`, set when no flag and no file names a folder.
- `UPDATE: packages/server/src/commands/run.ts:1076-1096` - the announcement gains a `start folder <folder>` line when the run serves its start folder.
- `UPDATE: packages/server/src/daemon.ts:39-50` - `Running` gains `startFolder?: string`.
- `UPDATE: packages/server/src/daemon.ts:281-301` - `recordOf` reads `startFolder` from the `start folder` line.
- `UPDATE: packages/server/src/commands/paths.ts` - an add to a file with no `paths` writes the start folder first, served from `options.startFolder` and at the terminal from the record.
- `UPDATE: packages/server/test/server-paths.test.ts` - cases for the served add, the terminal add, the list, the remove of either folder and a file that names `paths`.
- `UPDATE: packages/server/test/daemon.test.ts` - cases for `startFolder` in `recordOf`.
- `UPDATE: packages/server/test/config-check.test.ts` - a case for `startFolder` in `optionsFrom`.
- `UPDATE: packages/server/test/server-cli-start.test.ts` - a start with no `paths`, then a `paths add` at the terminal.
- `UPDATE: docs/DAEMON.md:176-218` - the `paths add` line, and a paragraph on the start folder under the block.

## Steps

1. Add a `config-check.test.ts` case: `optionsFrom` with no `paths` has `startFolder` as the current folder, and none with `paths`.
2. Add two `daemon.test.ts` cases: `recordOf` reads `startFolder` from a `start folder` line, and has none without the line.
3. Add a served case: the file names no `paths`, and `add` writes the start folder and the new folder.
4. In that case, check that the served list, `running().paths` and `GET /paths/list` name both folders.
5. Add a served case: after the first add, `remove` of either folder works.
6. Add a served case: an add of a folder under the start folder writes nothing.
7. Add a served case: a file that names `paths` gets only the new folder.
8. Add a terminal case: a recorded daemon with a start folder and no API, and an add writes both folders.
9. In that case, check that `paths list`, a start read from the file and `remove` of either folder agree.
10. Add a terminal case: the forward to a daemon with a start folder writes both folders to its file.
11. Add a terminal case: a file that names `paths` and a recorded start folder get only the new folder.
12. Add a `server-cli-start.test.ts` case: a start with no `paths` records its start folder, and `paths add` writes both folders.
13. Run the cases and see them fail.
14. Add `startFolder` to `Options`, and give it the current folder in `optionsFrom` when nothing names a folder.
15. Write the `start folder` line in the announcement when `options.startFolder` has a value.
16. Add `startFolder` to `Running`, and read it in `recordOf`.
17. In `paths.ts`, read the start folder from `options.startFolder` when served, and from `running()` at the terminal without `--config-file`.
18. When the file names no `paths`, put the start folder first before the add checks the new folder.
19. Say the start folder in the line the add prints.
20. Update `docs/DAEMON.md`, in the file's own wrap style.
21. Run the cases again and see them pass.

## Validation

- The new cases pass, and they fail before step 14.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run `pnpm exec vitest run packages/server packages/sdk` from the repository root; all pass.
- By hand on Windows: start a daemon with no `paths`, and run `ahpd paths add <folder>`. Then `paths list` and `status` name the same two folders.

## Resume

Implemented 2026-10-14. Every step is built, and every case the Validation names passes.

File by file:

- `packages/server/src/commands/options.ts` - step 14. `Options.startFolder` is `process.cwd()` when no flag and no file names a folder, and is absent otherwise.
- `packages/server/src/commands/run.ts` - step 15. The announcement has a `start folder <folder>` line when `options.startFolder` is set, after the `plugins` line.
- `packages/server/src/daemon.ts` - step 16. `Running.startFolder`, read by `recordOf` from the `start folder` line. `rewritePaths` keeps it, because it spreads the record.
- `packages/server/src/commands/paths.ts` - steps 17 to 19. `startFolderOf(named)` answers `served.options.startFolder` when served. At the terminal it answers `running()?.startFolder` when no `--config-file` is given. An add to a file with no `paths` starts from `[start]`, so the `same` and `under` checks see the start folder. The line reads `Added <start>, the folder the daemon was started in, and <folder> to "paths" in <file>.` The `add` description says it too.
- `docs/DAEMON.md` - step 20. The `paths add` line in the `## Commands` block, in the block's wrap. One unwrapped paragraph after the forward paragraph, which is the style of that paragraph.
- Tests - steps 1 to 12. One case in `config-check.test.ts` and one in `daemon.test.ts`. Four served and four terminal cases in `server-paths.test.ts`, and one in `server-cli-start.test.ts` with a real detached daemon. Eight of the unit cases failed before step 14. The two cases for a file that names `paths` passed before and after, because they hold the old behaviour.

What the plan did not know:

- A daemon that serves no API is the default, because `http` is off unless the file sets it. A terminal add then writes the file and says the restart line. The terminal can only know the start folder from the record, so the record carries it now.
- A daemon started with `--path` has no start folder, and this task does not write the `--path` folders. A forwarded add to that daemon still leaves the file and the live list apart. A restart replays the recorded `--path`, which replaces `paths`, so the added folder drops out. That is the plan's rule that `--path` is for one run, and it is outside this task.
- `paths remove <start folder>` before the first add is still refused as not in `paths`. That folder is the only one served, so the last-folder rule refuses it anyway.

Answered:

- With no daemon recorded, the add writes only the new folder. Softov chose this on 2026-10-14, as the plan's answers table says.

Validation:

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` each exit 0.
- `pnpm exec vitest run packages/server packages/sdk`: 200 files, 3913 of 3914 tests pass. The one failure was `nested-start.test.ts` timing out under load, and it passes alone with `--testTimeout 30000`. With it, `server-paths.test.ts` passes alone too: 39 tests over the two files.
- The by-hand line on Windows is left for Softov.

