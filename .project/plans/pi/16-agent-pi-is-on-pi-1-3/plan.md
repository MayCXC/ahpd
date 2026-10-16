---
title: agent-pi is on pi 1.3.0
domain: pi
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
changes: []
creates: []
refs:
  - "[code://packages/agent-pi/package.json#L47-L56](../../../../packages/agent-pi/package.json#L47-L56) - the engines and the two pi ranges, `^0.87.1`"
  - "[code://package.json#L39](../../../../package.json#L39) - the root dev dependency on pi-coding-agent, `^0.87.1`"
  - "[code://packages/agent-pi/src/backend.ts#L281](../../../../packages/agent-pi/src/backend.ts#L281) - `steer`, which pi 0.99.0 made return a disposition"
  - "[code://packages/agent-pi/src/machine.ts#L26](../../../../packages/agent-pi/src/machine.ts#L26) - `PI_KEY_VARIABLES`, which lacks `TYPESAFE_API_KEY`"
  - "[code://packages/agent-pi/test/fake-pi.ts#L102-L105](../../../../packages/agent-pi/test/fake-pi.ts#L102-L105) - the fake `agent_settled` events"
  - "[code://pnpm-workspace.yaml](../../../../pnpm-workspace.yaml) - `minimumReleaseAgeExclude`"
  - npm://@earendil-works/pi-coding-agent@1.3.0 - published 2026-10-15; its CHANGELOG.md holds pi-ai's changes too
  - https://github.com/earendil-works/pi - the pi repository
---

## Goal

agent-pi runs on `@earendil-works/pi-ai` and `@earendil-works/pi-coding-agent` 1.3.0.
A fresh install gets the versions the tests ran.
The brace-expansion audit finding under pi-coding-agent goes away, because 1.3.0 pins the fixed version.

## Reconnaissance

A trial upgrade on `c881ca4a` gave these results.

- Build fails at `backend.ts:281`: `session.steer()` returns `Promise<QueuedInputDisposition>`, not `Promise<void>` (pi 0.99.0).
- Typecheck fails at 32 test sites: `agent_settled` has a new required `aborted: boolean` (pi 1.1.0).
- One test fails, `agent-pi.test.ts:760`: pi-ai's `getApiKeyEnvVars` now lists `TYPESAFE_API_KEY` (pi 0.99.0).
- The other 196 tests pass, and every other pi name that agent-pi imports is unchanged.
- pi 1.3.0 declares `node >=22.19.0`.
- pnpm adds 7 release-age excludes, for pi-agent-core, pi-ai, pi-codemode, pi-coding-agent, pi-mcp, pi-telemetry and pi-tui at 1.3.0.

The other breaking changes from 0.87.1 to 1.3.0 do not touch agent-pi.
They are nested tool events from codemode, the MCP tool names, the `azure` provider name, `before_agent_start` and the `kimi-coding` base URL.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Both pi packages and the root dev dependency go to `^1.3.0` | Softov, 2026-10-16, "pi-coding-agent is on 1.3.0 make a plan to update it" | 01 |
| `steer` keeps its `Promise<void>` seam, and backend.ts drops the disposition | (defaulted: no caller reads it today) | 01 |
| `TYPESAFE_API_KEY` joins `PI_KEY_VARIABLES` in sorted order | the test at `agent-pi.test.ts:760`, which compares the list with pi-ai's | 01 |
| A fake `agent_settled` says `aborted: false`, and `aborted: true` where it models a cancel | pi 1.1.0 | 01 |
| agent-pi's `engines` is `>=22.19.0` | pi 1.3.0's own `engines` | 01 |
| The release-age excludes for the 7 pi packages go in `pnpm-workspace.yaml` | Softov, 2026-10-16, asked how to handle the release-age gate and chose "Add excludes" | 01 |
| pi's new features are not in this plan: `agent_settled.aborted`, the steer disposition, codemode, MCP and tool search in SDK sessions, and tool metadata | (defaulted: this plan is the version move) | - |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - agent-pi is on pi 1.3.0](task-01-agent-pi-is-on-pi-1-3.md) | done | - |

## Risks and tradeoffs

- A user's pi settings that name `azure-openai-responses` or a `kimi-coding` base URL without `/v1` break with pi itself, not with ahpd. The release notes say so.
- Node 22.0 to 22.18 can no longer run agent-pi.

## Resume state

- **Done so far:** built 2026-10-16. Task 01 is done, and the check by hand passed on 2026-10-16. See [implemented.md](implemented.md).
- **Next action:** none. pi's new features wait in [deferred.md](deferred.md).
- **Open questions:** none.
- **Watch out for:** the build stops at agent-pi, so the packages after it do not build until `backend.ts` is fixed.

## Final verification checklist

- [x] The gates pass: build, typecheck, boundary, schema and vitest on agent-pi.
- [x] `pnpm why brace-expansion` shows no version below 5.0.12 under pi-coding-agent.
- [x] By hand: a pi session runs one turn and one steer on Softov's daemon.
- [x] `plans/index.md` updated.
