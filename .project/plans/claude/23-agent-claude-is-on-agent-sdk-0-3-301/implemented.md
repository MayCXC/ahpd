---
title: agent-claude is on the Claude Agent SDK 0.3.301 - implemented
date: 2026-10-16
refs:
  - git://15ba262a
  - "[code://packages/agent-claude/package.json](../../../../packages/agent-claude/package.json)"
  - "[code://packages/agent-claude/src/probe.ts](../../../../packages/agent-claude/src/probe.ts)"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - the version agent-claude runs on
---

agent-claude runs on `@anthropic-ai/claude-agent-sdk` 0.3.301, and its tests run on that version.
The probe names its permission mode, so Claude Code does not choose one for it.

## What was built

- [`code://packages/agent-claude/package.json`](../../../../packages/agent-claude/package.json) and [`code://package.json`](../../../../package.json) - the SDK range is `^0.3.301`, in `15ba262a`. The lock moves from 0.3.278 to 0.3.301.
- [`code://pnpm-workspace.yaml`](../../../../pnpm-workspace.yaml) - the release-age excludes for the SDK and its 8 binaries at 0.3.301.
- [`code://packages/agent-claude/src/probe.ts`](../../../../packages/agent-claude/src/probe.ts) - the probe's query sends `permissionMode: 'default'`.

## Verified

- Build, typecheck, boundary and schema pass.
- The test gate passes with 5102 tests.
- By hand on 2026-10-16, on a test daemon built from `main` at `ba7daf5c`, on port 39222, with ahpc.
- The preset `claude-args` has the `extraArgs` value `{ "settings": { "permissions": { "allow": ["Bash(cat:*)"] } } }`.
- A turn on that preset ran a Bash tool call and returned the contents of the file.
- The CLI process started with `--settings {"permissions":{"allow":["Bash(cat:*)"]}}`.

## Departures from the plan

- The checks by hand ran on a test daemon, and not on Softov's daemon.

## Left for later

- The SDK's new features - see [deferred.md](deferred.md).
