---
title: A proposal for VS Code
status: todo
depends: [task-01-the-copy-gets-a-claude-manifest.md]
layer: docs
refs:
  - "[code://.project/proposals/index.md](../../../proposals/index.md) - the proposals, and the form of one"
  - "[code://.project/proposals/vscode-token-on-stdout.md](../../../proposals/vscode-token-on-stdout.md) - a proposal for `microsoft/vscode`"
  - "file:///github/externals/vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/syncedCustomizationBundler.ts#L386-L388 - the manifest is `.plugin/plugin.json` only"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/agentPluginManager.ts#L191-L194 - the copy is named by the nonce"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/claude/claudeSdkOptions.ts#L195-L197 - the Claude agent hands the CLI that path"
---

## Objective

A proposal in `.project/proposals/` says that a synced skill gets a nonce for a name in VS Code's Claude agent.
It names the cause, a fix, and how ahpd fixed it.
This task is optional, and nothing waits on Softov to file the proposal.

## Files

- `CREATE: .project/proposals/vscode-synced-plugin-has-no-claude-name.md` - the proposal, in the form of the others.
- `UPDATE: .project/proposals/index.md` - a row for it, with `Filed` set to `no`.

## Steps

1. Read two proposals in `.project/proposals/`, and use their frontmatter and sections.
2. Set `target` to `https://github.com/microsoft/vscode`.
3. Write the summary: what a person sees in the slash list.
4. Name the cause: only `.plugin/plugin.json`, and a copy named by its nonce.
5. Propose the fix: write `.claude-plugin/plugin.json` in the bundle, or hand the CLI a name.
6. Say how ahpd fixed it, from task 01.
7. Cite only VS Code source, the Claude CLI's manifest path, and ahpd code.
8. Add the row to the index.
9. Set this task and the plan row to `implemented`.

## Validation

- The proposal has the frontmatter and sections of the others.
- The index lists it, with `Filed` set to `no`.
- The proposal cites no other project.

## Resume
