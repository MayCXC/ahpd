---
title: The host keeps a session decision
status: done
depends: [task-01-claude-switches-a-builtin-plugin.md]
layer: sdk
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L1312-L1322](../../../../packages/sdk/src/host/chatactions.ts#L1312-L1322) - the refusal and the list sent again"
  - "[code://packages/sdk/src/host/tooling.ts#L530-L545](../../../../packages/sdk/src/host/tooling.ts#L530-L545) - `entriesFor`"
  - "[code://packages/sdk/src/host/tooling.ts#L823-L846](../../../../packages/sdk/src/host/tooling.ts#L823-L846) - `customizationUnder`"
  - "[code://packages/sdk/test/host-harness.test.ts#L680-L687](../../../../packages/sdk/test/host-harness.test.ts#L680-L687) - the refusal test"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostCustomizationEnablementService.ts#L112-L127 - VS Code keys a session decision by id"
---

## Objective

When a backend switches a customization for one session, the host keeps that decision by id.
`customizationUnder` returns it as `own`, so `withEntries` puts the `session` entry first.
The session's customizations then report the decision, and the switch does not move back.

## Files

- `UPDATE: packages/sdk/src/host/tooling.ts:823-846` - a backend customization answers the session decision as `own`.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1312-1322` - a switch that took keeps the decision and sends the list with it.
- `UPDATE: packages/sdk/test/host-harness.test.ts:680-687` - a plugin toggle that took is not refused.
- `UPDATE: packages/sdk/test/host-tools.test.ts` - a session toggle of a backend plugin stays off.

## Steps

1. Add a map of session decisions by id for each session, beside the store.
2. Write the decision in the map when `setCustomizationEnabled` answers `true`.
3. Make `customizationUnder` return that decision as `own` for a backend customization.
4. Send `session/customizationsChanged` with the list after a switch that took.
5. Keep the refusal for a switch that did not take.
6. Remove the session's decisions when the session closes.
7. Write the tests.
8. Set this task and the plan row to `implemented`.

## Validation

- A test: a session toggle of a backend plugin answers `true`, and `customizations()` reports a `session` entry with `enabled: false`.
- A test: a later snapshot of the session reports the same entry.
- A test: a skill toggle is still refused with `has no runtime switch`.
- A test: another session keeps the plugin on.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume

Implemented 2026-10-16.

`tooling.ts` holds a `decided` map beside the store, keyed by the session `heldAs` resolves a channel to and then by the customization's id. `keepDecision(uri, id, enabled)` writes it and is exported on `Tooling`, because the writing happens in `chatactions`: a decision about one session is the one scope the store cannot hold, so it is this host's to keep and this is where it keeps it.

The decision is read in two places, and it has to be both. `customizationUnder` returns it as `own` on the `backend` branch, which is what the loop over the other sessions reads when the store moves. And `withEntries` reads it as `ownIn(carried) ?? decisionOf(uri, id)`: the backend's own session entry where it gave one, this host's decision where it did not. Without the second the list a client draws the switch from would carry nothing, and the switch would be drawn back on by the very report that says the switch worked - a backend says whether a customization can be switched, not what it decided, and one that stopped loading a plugin reports nothing about it at all.

`chatactions.ts` now reads `on` once and, when the backend took the switch, keeps the decision before sending the list. The list goes out either way, which is what the refusal always did and what a switch that took needs too: the customization list is what a client draws the switch from, so it stands where the client put it when the decision was kept and returns when it was not. The refusal itself is unchanged, `no('<id> has no runtime switch')` after a backend that answered `false`.

Step 6 landed in `toolsServersGone`, which is the hook this file already has for a session that is over: `lifecycle.teardown` calls it where a session closes, beside `sessions.delete(uri)`. It takes the session's endpoints back and now its decisions with them - a session that is gone has no answer to give about one of its backend's customizations, and the store is where a decision that outlives a session lives. Its doc comment says both now.

The tests:

- `packages/sdk/test/support/claude-sdk.ts` gained a plugin list, the sources a switch has taken out of it, and a record of every flag setting handed to `applyFlagSettings`. The fake moves `enabledPlugins` the way the CLI's flag layer does - one assignment per key - and `reloadPlugins` answers the plugins that are left, which is what makes the harness case below a real round trip rather than a mock agreeing with itself.
- `packages/sdk/test/host-harness.test.ts` has a case beside the refusal: a plugin reported by the fake CLI, toggled off through the wire, is not refused, the flag setting carries `cc-plugin-agents-md@builtin: false`, and the last `session/customizationsChanged` carries the container with `enablement: [{ kind: 'session', enabled: false }]` although the CLI has stopped reporting the plugin. This is the whole plan end to end - agent-claude's switch and this host's decision, over a real session.
- `packages/sdk/test/host-tools.test.ts` has a `describe('a customization switched for one session')` with a `switchable()` harness whose backend reports a plugin with a skill under it and takes a switch on the plugin alone. Four cases: the decision reported off on the session that made it, the same entry in a later snapshot with nothing written to the store, another session left with the plugin on, and a skill still refused out loud with the list sent again.

Nothing here is committed: this preset allows neither `git add` nor `git commit`, so the work is left in the worktree to be reviewed and committed afterwards. The files this task changed:

- `UPDATE: packages/sdk/src/host/tooling.ts` - the `decided` map, `decisionOf`, `keepDecision` (declared on `Tooling` and returned), the two readers, and the teardown.
- `UPDATE: packages/sdk/src/host/chatactions.ts` - the decision kept on a switch that took, and the list sent either way.
- `UPDATE: packages/sdk/test/support/claude-sdk.ts` - the plugin list, the sources switched off, the flag settings recorded.
- `UPDATE: packages/sdk/test/host-harness.test.ts` - the plugin toggle that took.
- `UPDATE: packages/sdk/test/host-tools.test.ts` - the four cases for one session's own decision.
- `UPDATE: .project/plans/host/104-a-session-switch-on-a-builtin-stays/plan.md` - the Tasks table and the Resume state.

`pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs` and `git diff --quiet tools/` pass, and `pnpm exec vitest run packages/sdk --maxWorkers=2 --testTimeout=10000` passes whole - 149 files, 2984 cases. Without those flags `nested-start.test.ts` times out at the default five seconds on this box, which is the load flake it always is and not this task: run alone the same case takes 5.2s.

`packages/sdk/test/fixtures/wire.jsonl` is left dirty by the suite, as it is on every run: the endpoint, some config keys, a few tool entries and every id in it are rewritten. The restore is `git checkout -- packages/sdk/test/fixtures/wire.jsonl`, which this preset refuses, so it is written down here rather than done.
