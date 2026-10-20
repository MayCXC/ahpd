---
title: The sdk's tests build their paths
status: done
depends: []
layer: sdk
refs:
  - "[code://packages/sdk/test/fileuri.test.ts#L42](../../../../packages/sdk/test/fileuri.test.ts#L42) - a split on `/`"
  - "[code://packages/sdk/test/attachments.test.ts#L44](../../../../packages/sdk/test/attachments.test.ts#L44) - a label from a split on `/`"
---

## Objective

The sdk tests in p1's failure list that fail on a path build their paths and URIs the system's way.

## Files

- `UPDATE: packages/sdk/test` - each file in p1's failure list whose cause is a path.

## Steps

1. Sort p1's sdk failures by cause, and keep the ones that fail on a path.
2. Find the literal in each one that the code converts.
3. Build that value with `join`, `uriOf`, `localPath` or `basename`.
4. Split a path with `sep`, or with `basename`, in place of `/`.
5. Keep a literal that the code passes through unchanged.
6. Run the sdk tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The sdk tests pass on Linux.
- The Windows job passes every sdk test that failed on a path.

## Resume

Done 2026-10-18. Not reviewed.

p1 is not built, so its failure list is not on disk. The files came from p3's Resume, which names the sdk files that build `file://` URIs by hand, and from p5's Resume.

`fileuri.test.ts` builds its decoded and round-trip paths from `join(tmpdir(), ...)`, and splits with `/[/\\]/`.
`attachments.test.ts` builds file URIs with `uriOf`, and a label with `basename`.
`sessions.test.ts` builds the two listed folders with `uriOf`.
`nested-proxy.test.ts` builds the scripted session's folders and the two working directories with `uriOf`.
`host-files.test.ts` reads this checkout through `uriOf(join(REPO, ...))`, and its folder sets from `join(tmpdir(), ...)`.
That file also resolves the drive root with `uriOf(parse(REPO).root)`, which is `/` on POSIX and `C:/` on Windows.
`changes-refresh.test.ts` and `changes-uris.test.ts` build every `file:` URI with `uriOf`, and keep `..` as text.
`host-terminals.test.ts` starts its hosts and shells in `tmpdir()`, which exists on both systems.
`sessiontools.test.ts` builds the spaced folder with `join(tmpdir(), ...)` and its URIs with `uriOf`.
`users-gate-names.test.ts` builds the automation's folder with `uriOf`.

A literal stays where the code passes it through.
These are the message's agent pick and the stored record in `sessions.test.ts`, and the `/etc/hostname` probe in `nested-proxy.test.ts`.
They are also the channel names in `users-gate-names.test.ts`, and the malformed URIs `fileuri.test.ts` reads as text.
The relative test values in `host-files.test.ts` stay: `file://src` and `file://packages/...` are refused as they are.

p3's Resume names files outside this task's Files line: `bot-provider.test.ts`, `agent-cofold-store.test.ts` and `scheduled.test.ts`, plus three agent-acp files.
They are outside `packages/sdk/test`, so they are left for a task whose Files line names their packages.
p5's `host-terminals` failures on cleanup (`EPERM`) and on `undefined.success` are not path causes, and p5's terminal task owns that file.
Its two `sessiontools` timeouts are not path cases and are left.

Gates run: `node tools/schema.mjs`, `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.
Vitest on `packages/sdk` with `--maxWorkers=2 --testTimeout=10000`: 160 files, 3137 tests pass and 1 skips.
Vitest on `packages/agent-claude`: 37 files and 329 tests pass.
The suite rewrote `packages/sdk/test/fixtures/wire.jsonl`, and the restore is denied here: Softov runs `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.

Closed 2026-10-19: the `check-windows` job of PR #30 passed the sdk tests, in run 39344018005.
