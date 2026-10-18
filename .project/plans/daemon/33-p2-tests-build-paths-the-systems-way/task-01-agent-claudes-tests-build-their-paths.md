---
title: agent-claude's tests build their paths
status: implemented
depends: []
layer: agent-claude
refs:
  - "[code://packages/agent-claude/src/session/customizations.ts#L55-L56](../../../../packages/agent-claude/src/session/customizations.ts#L55-L56) - `HOME`"
  - "[code://packages/agent-claude/test/agent-claude-agent-pick.test.ts#L212](../../../../packages/agent-claude/test/agent-claude-agent-pick.test.ts#L212) - `file:///dev/zero`"
---

## Objective

agent-claude reads the home folder from `os.homedir()`.
Its 17 failing tests build their paths and URIs the system's way.

## Files

- `UPDATE: packages/agent-claude/src/session/customizations.ts:55-56` - `os.homedir()` in place of `HOME`.
- `UPDATE: packages/agent-claude/test/customizations.test.ts:32-33` - the test sets the home folder for both systems.
- `UPDATE: packages/agent-claude/test` - each file in p1's failure list.

## Steps

1. Replace `process.env.HOME ?? ''` with `homedir()` from `node:os`.
2. Make `customizations.test.ts` set `USERPROFILE` beside `HOME`.
3. Read each failing test in p1's list, and find the literal that the code converts.
4. Build that value with `join`, `uriOf` or `localPath`.
5. Keep a literal that the code passes through unchanged.
6. Run the agent-claude tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The agent-claude tests pass on Linux.
- The Windows job passes the agent-claude tests.

## Resume

Done 2026-10-18. Not reviewed.

p1 is not built, so its failure list is not on disk. The files came from the plan's refs and the agent-claude tree, the same departure p5 took.

`customizations.ts` reads the home folder from `homedir()` in place of `process.env.HOME`.
`customizations.test.ts` sets `USERPROFILE` beside `HOME`, and restores both.
Its expected agent URI is built with `uriOf(join(home, '.claude', 'agents', 'Plan.md'))`.
The plugin agent's expected URI is built with `join`, because the code reports a path there.
`agent-claude-find.test.ts` builds its three `workingDirectories` values with `uriOf`.
`agent-claude-agent-pick.test.ts` builds every URI it sends with `uriOf`.
The `file:///dev/zero` case is now a folder named `zero`, because no two systems spell a device the same way.
`delete.test.ts` keeps `/home/softov`, and `agent-claude-tool-input.test.ts` keeps `/tmp/project`: the code passes both to a mocked SDK.

Gates run: `node tools/schema.mjs`, `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass.
Vitest on `packages/agent-claude` with `--maxWorkers=2 --testTimeout=10000`: 37 files and 329 tests pass.
The sdk run rewrote `packages/sdk/test/fixtures/wire.jsonl`, and the restore is denied here: Softov runs `git checkout -- packages/sdk/test/fixtures/wire.jsonl`.
