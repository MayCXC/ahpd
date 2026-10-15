---
title: status shows the start folder
status: done
depends: [task-04-the-first-add-keeps-the-start-folder.md]
layer: server
refs:
  - "[code://packages/server/src/commands/status.ts#L28-L55](../../../../packages/server/src/commands/status.ts#L28-L55) - the text and the `output` field list, where `startFolder` was missing"
  - "[code://packages/server/src/commands/served.ts#L29-L43](../../../../packages/server/src/commands/served.ts#L29-L43) - `ServedRunning`, what a served `GET /status` reads"
  - "[code://packages/server/src/commands/run.ts#L407-L416](../../../../packages/server/src/commands/run.ts#L407-L416) - the daemon's `running()`"
  - "[code://packages/server/src/commands/paths.ts#L161-L190](../../../../packages/server/src/commands/paths.ts#L161-L190) - `forward`, which prints the \"on the running daemon\" line"
  - "[code://packages/server/src/commands/paths.ts#L51-L56](../../../../packages/server/src/commands/paths.ts#L51-L56) - `addedLine`, the add line for the file write and the forward"
---

## Objective

`ahpd status --json` and a served `GET /status` show `startFolder` when the daemon serves its start folder, and have no such key otherwise.
The plain `ahpd status` text has a `start folder <folder>` line beside the `sessions in` line.
A forwarded `ahpd paths add` names the start folder when the daemon wrote it, in the words of the file write.

## Files

- `UPDATE: packages/server/src/commands/status.ts:28-55` - a `start folder` line in the text, and `startFolder` in the output when the record has it.
- `UPDATE: packages/server/src/commands/served.ts:29-43` - `ServedRunning` gains `startFolder?: string`.
- `UPDATE: packages/server/src/commands/run.ts:407-416` - the daemon's `running()` gives `options.startFolder`.
- `UPDATE: packages/server/src/commands/paths.ts:51-315` - the add answers `startFolder` when it wrote it, and `forward` says it in the words of the file write.
- `UPDATE: packages/server/test/server-paths.test.ts` - status cases at the terminal and served, and the start folder in the add answers and the forwarded line.
- `UPDATE: docs/server/REFERENCE.md:218` - one sentence on how `ahpd status` shows the start folder.

## Steps

1. Add a terminal case: a record with `startFolder` makes `status --json` show it, and the text show a `start folder` line.
2. Add a terminal case: a record with no `startFolder` makes `status --json` have no key, and the text no line.
3. Add served cases: `GET /status` shows `startFolder` when `running()` has it, and has no key otherwise.
4. Change the served add case: the answer has `startFolder` when the add wrote it.
5. Change the forwarded add case: the line names the start folder, and the answer has `startFolder`.
6. Run the cases and see them fail.
7. Add `startFolder` to `ServedRunning`, and give it from `options.startFolder` in the daemon's `running()`.
8. In `status.ts`, print `start folder <folder>` after the `sessions in` line, and add `startFolder` to the output when the record has it.
9. In `paths.ts`, build the add line in one function that takes the start folder and the place.
10. Answer `startFolder` from the add when it wrote the start folder.
11. In `forward`, read `startFolder` from the answer, say it with the same function, and pass it on.
12. Add the sentence to `docs/server/REFERENCE.md`, in the paragraph's own style.
13. Run the cases again and see them pass.

## Validation

- `packages/server/test/server-paths.test.ts` holds the new cases, and they fail before step 7.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run `pnpm exec vitest run packages/server packages/sdk` from the repository root; all pass.
- By hand on Windows: start a daemon with no `paths`, and run `ahpd status --json`; it names `startFolder`.

## Resume

Implemented 2026-10-14. Every step is built, and every case the Validation names passes.

File by file:

- `packages/server/src/commands/served.ts` and `run.ts` - step 7. `ServedRunning.startFolder` is the daemon's `options.startFolder`, absent when the daemon names its folders.
- `packages/server/src/commands/status.ts` - step 8. The text has `start folder <folder>` after the `sessions in` line, and the output has `startFolder` only when the record or the daemon has it.
- `packages/server/src/commands/paths.ts` - steps 9 to 11. `addedLine(folder, start, where)` builds the add line for the file write and for the forward. The add answers `startFolder` when it wrote the start folder. `forward` reads that key, says the line with `on the running daemon`, and passes the key on.
- `docs/server/REFERENCE.md` - step 12. One sentence at the end of the start folder paragraph. The file has no list of the status fields.
- Tests - steps 1 to 5. Four status cases in a new `describe` in `server-paths.test.ts`, two at the terminal and two served. The served add case and the forwarded add case now expect `startFolder`, and the forwarded case checks the line. Four cases failed before step 7, and the two cases with no start folder passed before and after.

What the plan did not know:

- `ahpd status` prints `pid`, `url`, `paths`, `startedAt` and `automations`, and not `api`, `argv` or `skipped`. So this task does not add `api`.
- The start folder stays in status after the first add, because the daemon was still started in it. The next start reads the `paths` the add wrote, and then has no start folder.

Validation:

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` each exit 0.
- `pnpm exec vitest run packages/server packages/sdk`: 201 files, 3943 tests, all pass.
- The by-hand line on Windows is left for Softov.
