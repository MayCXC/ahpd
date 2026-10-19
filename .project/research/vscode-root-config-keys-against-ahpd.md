---
title: VS Code's agent host root config keys against what ahpd does
refs:
  - git://a959ba62444 - VS Code main at HEAD of the local checkout, 2026-10-14, where every VS Code line below is read
  - git://7516b04bc94 - VS Code 1.140, the Pass 5 checkpoint that the comments in vscoderootconfig.ts cite
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/agentHostSchema.ts#L867-L1136 - `platformRootSchema`, the root keys and their defaults
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/agentMerge.ts#L160-L197 - `agentMergeRootConfigSchema`
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/automationConfig.ts#L15-L25 - `automationRootConfigSchema`
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/agentHostCustomizationConfig.ts#L84-L85 - `defaultShell`
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/sessionPermissions.ts#L269-L449 - the approval checks that read the auto-approve keys
  - "[code://packages/sdk/src/vscoderootconfig.ts](../../packages/sdk/src/vscoderootconfig.ts) - the declared keys"
  - "[code://packages/sdk/src/host/root.ts#L266-L302](../../packages/sdk/src/host/root.ts#L266-L302) - the root schema, `defaultShell`, `workspaceTrust` and the host keys"
  - "[code://packages/sdk/src/host/gate.ts#L347-L353](../../packages/sdk/src/host/gate.ts#L347-L353) - the keys kept per connection"
  - "[code://packages/sdk/src/host/spawn.ts#L737-L755](../../packages/sdk/src/host/spawn.ts#L737-L755) - `getAutoApproval`, which reads the terminal and edit keys"
  - "[code://packages/sdk/src/host/trust.ts#L171-L172](../../packages/sdk/src/host/trust.ts#L171-L172) - `autoApproved`, which reads `globalAutoApproveEnabled`"
  - "[code://packages/sdk/src/host/merged.ts#L31-L33](../../packages/sdk/src/host/merged.ts#L31-L33) - the two merged-session keys"
  - "[code://packages/server/src/rootconfig.ts#L32](../../packages/server/src/rootconfig.ts#L32) - `DAEMON_KEYS`"
  - "[code://packages/server/src/commands/options.ts#L426-L670](../../packages/server/src/commands/options.ts#L426-L670) - the schemas of the daemon keys"
  - "[code://UPSTREAM.md](../../UPSTREAM.md) - Pass 4 to Pass 6, whose open items several rows cite"
---

This note compares each VS Code agent host root key with ahpd, read at VS Code `a959ba62444` and ahpd on 2026-10-18.
VS Code paths are relative to `src/vs/platform/agentHost/` unless they start with `src/`, and ahpd paths are relative to `packages/`.

| Key | VS Code does | ahpd does | Verdict |
| --- | --- | --- | --- |
| `http.proxy` | `node/agentHostProxyResolver.ts:161` gives the host's own network requests this proxy URL. | The agents inherit `HTTPS_PROXY` from the daemon environment (`agent-claude/src/spawn.ts:157`), and `sdk/src/host/vscodemethods.ts:441` reports it. ahpd's `proxy` key is the model proxy, which is a different thing. | `same job, no key` |
| `http.proxyKerberosServicePrincipal` | `node/agentHostRequestService.ts:101` and `node/agentHostProxyResolver.ts:228` use it for Kerberos proxy authentication. | No code reads a Kerberos principal. | `ahpd lacks it` |
| `http.noProxy` | `node/agentHostProxyResolver.ts:163` gives the proxy resolver its bypass list. | The agents inherit `NO_PROXY` from the daemon environment (`agent-claude/src/spawn.ts:157`). | `same job, no key` |
| `disableRepoInfoTelemetry` | `node/copilot/copilotAgentSession.ts:7089` stops the Copilot repository telemetry. | ahpd runs Copilot through the `copilot` preset of `agent-acp` (`agent-acp/src/presets.ts:113`), and does not pass this to the CLI. | `ahpd lacks it` |
| `telemetryLevel` | `node/agentServiceFoundation.ts:155` sets the level of VS Code telemetry. | ahpd sends no telemetry to a vendor. | `not applicable` |
| `editTelemetryEnabled` | `node/agentService.ts:1157` and `node/shared/editArcReporter.ts:247` switch edit attribution telemetry. | ahpd sends no telemetry to a vendor. | `not applicable` |
| `sessionSyncEnabled` | `node/copilot/copilotSessionLauncher.ts:1360` exports Copilot CLI sessions to the remote sync. | ahpd runs Copilot through the `copilot` preset of `agent-acp` (`agent-acp/src/presets.ts:113`), and does not pass this to the CLI. | `ahpd lacks it` |
| `codexAgentEnabled` | `node/agentHostMain.ts:185` registers the Codex provider. | ahpd runs Codex through `agent-acp` (`agent-acp/src/presets.ts:86`), when the `codex` preset is in its options. No code reads this key. | `ahpd lacks it` |
| `terminalAutoApproveEnabled` | `node/sessionPermissions.ts:342` and `:409` skip the terminal rules when it is `false`. | `sdk/src/host/spawn.ts:743` skips the rules when the starting connection pushed `false`. | `acted on` |
| `globalAutoApproveEnabled` | `node/sessionPermissions.ts:269` approves every tool call, and `sessionWorkspaceConversionService.ts:464` skips the trust question. | `sdk/src/host/trust.ts:171` skips only the trust question, from `sdk/src/host/chatactions.ts:663` and `sdk/src/host/lifecycle.ts:861`. No code approves tool calls from it. | `acted on` |
| `autoApprovePolicyRestricted` | `node/sessionPermissions.ts:449` and `node/claude/claudeAgent.ts:2313` limit approval modes under a managed policy. | ahpd has no managed policy layer, and UPSTREAM.md Pass 5 calls enterprise controls not a host feature. | `not applicable` |
| `workspaceTrust` | `node/codex/codexAgent.ts:8081` answers folder trust from it for the Codex hooks. | `sdk/src/host/trust.ts:137` answers folder trust from the value of the starting connection, which `sdk/src/host/gate.ts:347` keeps. | `acted on` |
| `autoReplyEnabled` | `node/copilot/copilotAgentSession.ts:6719` answers `ask_user` without the user in Copilot sessions only. | ahpd runs Copilot through `agent-acp` (`agent-acp/src/presets.ts:113`), and `agent-claude/src/session/asking.ts:331` always sends a question to a person. | `ahpd lacks it` |
| `systemProxyEnabled` | `node/copilot/copilotAgent.ts:1323` lets Copilot sessions discover the system proxy. | ahpd runs Copilot through the `copilot` preset of `agent-acp` (`agent-acp/src/presets.ts:113`), and does not pass this to the CLI. | `ahpd lacks it` |
| `githubMcpServerEnabled` | `node/claude/claudeAgentSession.ts:884` and `node/copilot/copilotAgent.ts:1327` add a GitHub MCP server with the Copilot token. | No default GitHub MCP server is added, but a person can put one in `mcpServers`. | `ahpd lacks it` |
| `mcpToolRoutingEnabled` | `node/copilot/copilotAgentSession.ts:1675` routes Copilot MCP tools from cached metadata. | ahpd runs Copilot through the `copilot` preset of `agent-acp` (`agent-acp/src/presets.ts:113`), and does not pass this to the CLI. | `ahpd lacks it` |
| `mcpConnectorsEnabled` | `node/copilot/copilotSessionLauncher.ts:805` adds Copilot Connector MCP servers. | ahpd runs Copilot through the `copilot` preset of `agent-acp` (`agent-acp/src/presets.ts:113`), and does not pass this to the CLI. | `ahpd lacks it` |
| `markdownPlanRichLinksEnabled` | `node/chatContributions/markdownPlanRichLinks/markdownPlanRichLinksContribution.ts:44` adds plan link instructions to each turn, for every agent. | No turn instruction about plan links exists. | `ahpd lacks it` |
| `workspaceSnapshotEnabled` | `node/chatContributions/workspaceContext/workspaceContextContribution.ts:394` adds a file snapshot to the first turn of a `copilotcli` chat only. | ahpd runs Copilot through the `copilot` preset of `agent-acp` (`agent-acp/src/presets.ts:113`), and does not pass this to the CLI. | `ahpd lacks it` |
| `agentOrchestrationLimits` | `node/agentServiceComposition.ts:179` and `node/shared/sessionServerTools.ts:1926` turn the session tool limits off at `off`. | `sdk/src/host/tooling.ts:39-45` and `:1490` always enforce depth and count limits. `sessionTools` and `sessionToolsProviders` only choose who gets the tools. UPSTREAM.md Pass 5 has this open. | `same job, no key` |
| `artifactTools` | `node/agentService.ts:1717` offers the artifact tools only when it is `true`. | `sdk/src/tools/index.ts:26` always offers the artifact tools. | `same job, no key` |
| `canvasesEnabled` | `node/agentService.ts:5450` and `node/copilot/copilotSessionLauncher.ts:1101` allow Canvas content. | No canvas support exists, and UPSTREAM.md Pass 5 and Pass 6 leave it out. | `ahpd lacks it` |
| `autoAttachPullRequests` | `node/agentHostGitStateService.ts:320` finds the pull request of the checked-out branch unless it is `false`. | `sdk/src/host/facts.ts:410-422` always asks GitHub for the pull requests of the branch. `pullRequestLookup` only chooses how merged sessions read state. | `same job, no key` |
| `overlapProviderPreparation` | `node/agentSideEffects.ts:2159` prepares the turn while the checkpoint is captured. | No turn preparation step exists. | `ahpd lacks it` |
| `migrateLegacyCopilotCliEnabled` | `node/agentService.ts:4742` shows old Copilot CLI sessions as adoptable sessions. | ahpd runs Copilot through the `copilot` preset of `agent-acp` (`agent-acp/src/presets.ts:113`), and does not pass this to the CLI. | `ahpd lacks it` |
| `sessionCatalogEnabled` | At `7516b04bc94`, `node/agentService.ts:4137` chose the central catalog, and `85e195f2594` removed the key. | UPSTREAM.md Pass 4 calls the central catalog VS Code's own cache. | `not applicable` |
| `showExternalSessions` | `node/agentService.ts:4549-4553` shows sessions made outside the host. | ahpd runs Copilot and Codex through `agent-acp`, so their session stores are on the host machine. No code lists sessions from those stores. | `ahpd lacks it` |
| `autoArchiveMergedSessionsAfterDays` | `node/agentHostSessionLifecycle.ts:124` archives inactive sessions whose pull requests are merged. | `sdk/src/host/merged.ts:232` does the same, and `sdk/src/host/actions.ts:367` runs a pass on a push. | `acted on` |
| `autoDeleteArchivedMergedSessionsAfterDays` | `node/agentHostSessionLifecycle.ts:125` deletes those sessions some days after the archive. | `sdk/src/host/merged.ts:233` does the same. | `acted on` |
| `copilotMultiRootEnabled` | `node/copilot/copilotAgent.ts:1780` lets the Copilot provider advertise multiple folders. | ahpd runs Copilot through the `copilot` preset of `agent-acp` (`agent-acp/src/presets.ts:113`), and does not pass this to the CLI. | `ahpd lacks it` |
| `claudeMultiRootEnabled` | `node/claude/claudeAgent.ts:738` lets the Claude provider advertise multiple folders. | `agent-claude/src/claude.ts:399` always advertises multiple folders. | `same job, no key` |
| `codexMultiRootEnabled` | `node/codex/codexAgent.ts:4293` lets the Codex provider advertise multiple folders. | ahpd runs Codex through the `codex` preset of `agent-acp` (`agent-acp/src/presets.ts:86`), and does not pass this to the CLI. | `ahpd lacks it` |
| `editAutoApprovePatterns` | `node/sessionPermissions.ts:776` approves a write permission whose path matches a pattern. | `sdk/src/host/spawn.ts:748` and `sdk/src/commandautoapprover.ts:726` check only the write targets of a shell command. | `acted on` |
| `terminalAutoApproveRules` | `node/sessionPermissions.ts:413` matches shell commands against these rules. | `sdk/src/host/spawn.ts:744` matches against the rules of the starting connection. `terminalAutoApproveDefaults` sets the rules when none were pushed. | `acted on` |
| `mcpServers` | `node/copilot/copilotAgent.ts:8853` and `node/codex/codexAgent.ts:1706` give these servers to every session. | ahpd's own daemon key has the same name and fields, and `sdk/src/host/tooling.ts:1731` gives them to every session. | `acted on` |
| `agentMerge.enabled` | `node/agentMergeController.ts:508` and `node/agentService.ts:4758` switch the Agent Merge loop on. | `sdk/src/changes.ts:1209` and `:1216` refuse Agent Merge. UPSTREAM.md Pass 4 calls it a Copilot service, but the controller is in the host. | `ahpd lacks it` |
| `agentMerge.addressReviews`, `fixCI`, `resolveConflicts`, `mergePullRequest`, `replyAttribution` | `node/agentMergeConfiguration.ts:11-16` sets what the Agent Merge loop does. | No Agent Merge loop exists. | `ahpd lacks it` |
| `agentMerge.mergeMethod` | `node/agentHostPullRequestLifecycleOperationHandler.ts:166` picks the method when the host merges a pull request. | No merge operation exists, and `sdk/src/changes.ts:1208` sends no merge methods. | `ahpd lacks it` |
| `automationsEnabled` | `node/agentHostAutomationService.ts:469` refuses the automation catalog unless it is `true`. | `server/src/commands/run.ts:826` always gives the host an automation store. The `automations` key only chooses `file` or `memory`. | `same job, no key` |
| `automationRunTimeoutMinutes` | `node/agentHostAutomationService.ts:1075` cancels a run after this many minutes. | No run timeout exists. | `ahpd lacks it` |
| `defaultShell` | `node/agentHostTerminalManager.ts:932` opens host terminals with this shell. | `sdk/src/terminals.ts:107-113` uses the value of the connection, which `sdk/src/host/gate.ts:347` keeps. | `acted on` |

## ahpd's own keys

- `paths` - the folders the host serves.
- `port` - the port the daemon listens on.
- `host` - the address the daemon binds.
- `http` - the HTTP API and its listener.
- `routes` - where plugin routes are served.
- `updateCheck` - whether npm is asked about a newer version.
- `advancedTools` - whether tools that need advanced permission are offered.
- `sessionTools` - whether the session tools are offered.
- `sessionToolsProviders` - which providers get the session tools.
- `closedChats` - whether a closed chat is kept or deleted in the backend.
- `archiveDirtyWorktree` - whether archive keeps a dirty worktree or commits it and removes it.
- `pullRequestLookup` - how merged sessions read the state of a pull request.
- `wire` - the file that records every frame.
- `changeWords` - where commit and pull request words come from.
- `clientQueueBytes` - how much the host queues for a client that does not read.
- `replayBytes` - how much the host keeps for a client to replay.

## Candidates for parity

- `http.proxy` - ahpd would set the agents' proxy variables from the pushed value, not only from the daemon environment.
- `http.noProxy` - ahpd would set the agents' bypass list from the pushed value, not only from the daemon environment.
- `agentOrchestrationLimits` - ahpd would skip the depth and count limits in `sdk/src/host/tooling.ts` when the value is `off`.
- `artifactTools` - ahpd would offer the artifact tools only when the value is `true`, which is VS Code's default of off.
- `autoAttachPullRequests` - ahpd would skip the branch lookup in `sdk/src/host/facts.ts` when the value is `false`.
- `claudeMultiRootEnabled` - the Claude backend would advertise multiple folders only when the value is `true`, which is VS Code's default of off.
- `automationsEnabled` - ahpd would refuse the automation commands unless the value is `true`, which is VS Code's default of off.
- `systemProxyEnabled` - the Copilot preset of `agent-acp` would let the CLI use the system proxy, if the CLI over ACP takes such a switch.
- `copilotMultiRootEnabled`, `codexMultiRootEnabled` - the two ACP presets would advertise multiple folders, if their CLIs over ACP take more than one folder.

## Open

The rows for Copilot and Codex keys say what ahpd passes today.
Whether the Copilot and Codex CLIs take each setting over ACP is not checked.
