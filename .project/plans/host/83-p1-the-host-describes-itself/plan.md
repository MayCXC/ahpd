---
title: The host describes itself as VS Code's host does
domain: host
status: built
priority: high
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/host/83-the-host-matches-vscodes-host/plan.md
decisions:
  - decisions/ahpd-says-it-is-a-native-host.md
refs:
  - "[code://packages/sdk/src/host/root.ts#L436-L495](../../../../packages/sdk/src/host/root.ts#L436-L495) - the root `_meta` that gets `vscode.agentHost.resources` and `hostBuild`"
  - "[code://packages/sdk/src/host/handshake.ts#L210-L218](../../../../packages/sdk/src/host/handshake.ts#L210-L218) - `completionTriggerCharacters`, `/` and `@` today"
  - "[code://packages/sdk/src/host/handshake.ts#L267-L297](../../../../packages/sdk/src/host/handshake.ts#L267-L297) - the initialize `_meta` that gets `vscode.ahpSessionUris`"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L441](../../../../packages/sdk/src/host/sessionmethods.ts#L441) - the completions command, which answers `@` with files"
  - "[code://packages/sdk/src/version.ts](../../../../packages/sdk/src/version.ts) - the version `hostBuild` sends"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostResources.ts - how VS Code's host measures the machine
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/meta/vscode/agentHostResources.ts - the shape and its allowed values
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostFileCompletionProvider.ts - `#` answers files as `@` does
---

## Goal

The host tells VS Code what machine it runs on and which build it is, and `#` completes a file name.

## Reconnaissance

### Searches performed

- `rg -n "agentHost.resources|hostBuild|ahpSessionUris" packages` - nothing.

### Runtime path

```
root state -> _meta['vscode.agentHost.resources'] and _meta.hostBuild -> VS Code filters delegation targets and logs the version
initialize -> completionTriggerCharacters ['/', '@', '#'] -> VS Code asks completions for # -> files
```

### Gaps

- No resources, no build, and `#` is not a trigger.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [ahpd says it is a native host, and keeps its session URIs](../../../decisions/ahpd-says-it-is-a-native-host.md) | Softov, 2026-10-11 |

| What | Source | Task |
| --- | --- | --- |
| `platform` is left out on a system VS Code has no value for | the allowed values are `windows`, `linux` and `macos` | 01 |
| Memory is the smaller of the total and the process limit | VS Code's `agentHostResources.ts` | 01 |
| A space is not a trigger character | (defaulted: only VS Code's Copilot provider uses it, for command arguments) | 03 |

## Proposed architecture

- **Data flow** - resources are measured once when the host starts; the build comes from `version.ts`.
- **Layer responsibilities** - `packages/sdk`: every change.
- **Source-of-truth files** - [`code://packages/sdk/src/host/root.ts`](../../../../packages/sdk/src/host/root.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The root state says what machine the host runs on](task-01-the-root-state-says-what-machine.md) | done | - |
| [02 - The host sends its build and keeps its session URIs](task-02-the-host-sends-its-build.md) | done | - |
| [03 - A hash sign completes a file](task-03-a-hash-sign-completes-a-file.md) | done | - |

## Risks and tradeoffs

- `hostBuild` changes how VS Code builds session URIs - task 02 sends both keys in one commit, and a test checks both.

## Resume state

- **Done so far:** every task is done, and the plan is built. See [implemented.md](implemented.md).
- **Next action:** Softov's check by hand: vS Code's window shows the host version in its Output channel.
- **Open questions:** none.
- **Watch out for:** a key in root `_meta` must also be in the handshake test that reads root state.

## Final verification checklist

- [x] `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk` pass.
- [ ] VS Code's window shows the host version in its Output channel.
- [x] `plans/index.md` updated.
