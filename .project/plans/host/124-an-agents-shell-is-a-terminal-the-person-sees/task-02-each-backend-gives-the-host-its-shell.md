---
title: Each backend gives the host its shell
status: done
depends:
  - task-01-the-host-offers-the-agent-terminal-tool.md
layer: "agent-claude, agent-pi, agent-cofold, docs"
refs:
  - "[code://packages/agent-claude/src/options.ts#L123](../../../../packages/agent-claude/src/options.ts#L123) - `hostHoldsTasks`, the pattern for a host tool in place of Claude's own"
  - "[code://packages/agent-claude/src/session/query.ts#L95](../../../../packages/agent-claude/src/session/query.ts#L95) - `denyOption`, where `Bash` is denied and aliased"
  - "[code://packages/agent-claude/src/session/asking.ts#L553](../../../../packages/agent-claude/src/session/asking.ts#L553) - the owner's rules read `Bash`"
  - "[code://packages/agent-pi/src/tools.ts#L79](../../../../packages/agent-pi/src/tools.ts#L79) - where a tool with one of pi's names is dropped"
---

## Objective

A backend whose harness has its own shell lets the host's take its place, in the way that harness documents.
Every backend tells a host tool the call it runs for.

## Files

- `UPDATE: packages/agent-claude/src/options.ts:123` - `HOST_SHELL_TOOL` and `hostRunsShell` after `hostHoldsTasks`, read off `overridesBuiltInTool`.
- `UPDATE: packages/agent-claude/src/session/query.ts:95` - deny `Bash` and alias it to `mcp__ahp__bash` while the host runs the shell.
- `UPDATE: packages/agent-claude/src/session/asking.ts:553` - the owner's terminal rules approve the host's shell as they approve `Bash`.
- `UPDATE: packages/agent-claude/src/session/clienttools.ts` - pass the call id the CLI names to `run`.
- `UPDATE: packages/agent-pi/src/tools.ts:79` - keep a tool marked `overridesBuiltInTool`, and pass pi's call id to `run`.
- `UPDATE: packages/agent-cofold/src/tools.ts` - pass cofold's call id to `run`.
- `CREATE: packages/agent-claude/test/agent-claude-shell.test.ts` - the deny, the alias and the call id.
- `UPDATE: packages/agent-claude/test/agent-claude-autoapproval.test.ts` - an approved line of the host's shell runs without a question.
- `UPDATE: packages/agent-pi/test/agent-pi-tools.test.ts` - a marked `bash` is handed to pi and told its call.
- `UPDATE: packages/agent-cofold/test/agent-cofold-tools.test.ts` - a host tool is told its call.
- `UPDATE: packages/agent-claude/README.md` - the shell section.
- `UPDATE: packages/agent-pi/README.md` - the host's `bash` in place of pi's.

## Steps

1. Mark the six tools `overridesBuiltInTool`, as the reference marks them.
2. Read the mark on `bash` in `hostRunsShell`, and leave `Bash` alone for an unmarked tool of that name.
3. Add `Bash` to `disallowedTools` and set `toolAliases` to `{ Bash: 'mcp__ahp__bash' }` while it holds.
4. Let the owner's terminal rules approve the host's shell as they approve `Bash`.
5. Hand pi a marked tool under pi's own name, and drop an unmarked one as before.
6. Pass the call id in Claude's handler, pi's `execute` and cofold's `execute`.
7. Write the tests, then the two READMEs.

## Validation

- `packages/agent-claude/test/agent-claude-shell.test.ts` holds four cases: the deny and the alias, an unmarked `bash`, a person's deny list, and the call id.
- `packages/agent-claude/test/agent-claude-autoapproval.test.ts` runs an approved line of `mcp__ahp__bash` without a question.
- `packages/agent-pi/test/agent-pi-tools.test.ts` hands pi a marked `bash` and tells it the call `c1`.
- `packages/agent-cofold/test/agent-cofold-tools.test.ts` tells a host tool the call `c1`.
- `packages/sdk/test/shell-tools.test.ts` reads Claude's `disallowedTools` and `toolAliases` with the switch on and off.

## Resume

Done 2026-10-26.
pi 1.3.0 builds its tool registry from its built-ins and then sets each custom tool by name, so a custom `bash` replaces pi's own.
