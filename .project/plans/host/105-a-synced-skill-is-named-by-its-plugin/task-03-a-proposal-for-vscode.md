---
title: A proposal for VS Code
status: done
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

- **Done so far:** built 2026-10-16. `.project/proposals/vscode-synced-plugin-has-no-claude-name.md` is written in the form of `vscode-token-on-stdout.md` and `vscode-session-provider-read-from-scheme.md`: `title`, `target: https://github.com/microsoft/vscode`, `date` and `refs` in the frontmatter, then Summary, Where it comes from, Why it is worth a look, Suggested change and How a sibling project handles it. It names the cause as the two the plan did - the bundle carries only `.plugin/plugin.json`, and a revision is materialized under the nonce key - and proposes both routes, the bundle manifest first and a name at hand-over second. The row is in `.project/proposals/index.md` with `Filed` set to `no`.
- **Next action:** none. Nothing waits on this task.
- **Open questions:** none.
- **Watch out for:**
  - The proposal describes the double listing as what a host that also lists the bundle's own parts sees, not as something reproduced on VS Code. The plan's recon says VS Code's own Claude agent "likely" shows the same name; the nonce name is what was checked, so the second row is stated as a consequence of listing both rather than as a VS Code observation.
  - The references are the plan's, checked at the lines given. The CLI binary was read as `@anthropic-ai/claude-agent-sdk-linux-x64@0.3.301` rather than the 0.3.278 the plan's reconnaissance used.
