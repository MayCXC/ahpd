---
title: agent-claude is on the Claude Agent SDK 0.3.301
domain: claude
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
changes: []
creates: []
refs:
  - "[code://packages/agent-claude/package.json#L59](../../../../packages/agent-claude/package.json#L59) - the SDK range, `^0.3.278`"
  - "[code://package.json#L38](../../../../package.json#L38) - the root dev dependency on the SDK, `^0.3.278`"
  - "[code://packages/agent-claude/src/probe.ts#L58](../../../../packages/agent-claude/src/probe.ts#L58) - the probe's query, which sets no `permissionMode`"
  - "[code://packages/agent-claude/src/session/query.ts#L363](../../../../packages/agent-claude/src/session/query.ts#L363) - a session sends its `permissionMode`"
  - "[code://pnpm-workspace.yaml](../../../../pnpm-workspace.yaml) - `minimumReleaseAgeExclude`"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - published 2026-10-15
  - https://github.com/anthropics/claude-agent-sdk-typescript - the SDK's CHANGELOG
---

## Goal

agent-claude runs on `@anthropic-ai/claude-agent-sdk` 0.3.301.
The range admits it already, so a fresh install gets a version the tests never ran until the lock moves.

## Reconnaissance

A trial upgrade on `c881ca4a` was green: build, typecheck, boundary, agent-claude 305 tests and `host-tools.test.ts` 66 tests.
pnpm adds 9 release-age excludes, for the SDK and its 8 platform binaries at 0.3.301.
The peers are unchanged, and zod `^4.4.3` still fits.

These changes do not fail a test, and they are the ones to know.

- 0.3.286: an omitted `permissionMode` lets Claude Code choose, so a session can start in `auto`. Every ahpd session sends one, and the probe runs no turn.
- 0.3.300: a hook's `updatedInput` is checked, and an unknown key is dropped. The `sourceFirst` hook changes only `command`.
- 0.3.300: `thinking: { type: 'disabled' }` runs as adaptive thinking on a model that cannot turn thinking off.
- 0.3.295: named options go as `--flag=value`, which touches the `extraArgs` path at `src/options.ts:147`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The SDK range and the root dev dependency go to `^0.3.301` | Softov, 2026-10-16, "also to update claude and acp if any update" | 01 |
| The probe sends `permissionMode: 'default'`, as a session does | (defaulted: from 0.3.286 an omitted mode is Claude Code's choice) | 01 |
| The release-age excludes for the SDK and its 8 binaries go in `pnpm-workspace.yaml` | Softov, 2026-10-16, asked how to handle the release-age gate and chose "Add excludes" | 01 |
| The SDK's new features are not in this plan: `prewarm()`, per-tool `permission_policy`, `verbatimPrompts`, `readMcpResource()` and the new task fields | (defaulted: this plan is the version move) | - |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - agent-claude is on the Agent SDK 0.3.301](task-01-agent-claude-is-on-agent-sdk-0-3-301.md) | done | - |

## Risks and tradeoffs

- A preset with `extraArgs` can now reach the CLI in another form. A check by hand covers it.

## Resume state

- **Done so far:** built 2026-10-16. Task 01 is done, and the checks by hand passed on 2026-10-16. See [implemented.md](implemented.md).
- **Next action:** none. The SDK's new features wait in [deferred.md](deferred.md).
- **Open questions:** none.
- **Watch out for:** the root `package.json` has its own SDK range, and it moves with the package's.

## Final verification checklist

- [x] The gates pass: build, typecheck, boundary, schema and vitest on agent-claude and `host-tools.test.ts`.
- [x] By hand: a Claude session runs one turn and one tool call on Softov's daemon.
- [x] By hand: a preset with `extraArgs` starts.
- [x] `plans/index.md` updated.
