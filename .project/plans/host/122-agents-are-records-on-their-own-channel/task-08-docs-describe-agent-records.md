---
title: The docs describe agent records
status: implemented
depends: [task-07-presets-become-records.md]
layer: "docs"
refs:
  - "[code://docs/plugins/PLUGINS.md#L1331](../../../../docs/plugins/PLUGINS.md#L1331) - the part on agents and unloads"
---

## Objective

PLUGINS.md and the agent plugin READMEs say what an agent record and a kind are.
They also name the fields that only a host agent may set.

## Files

- `UPDATE: docs/plugins/PLUGINS.md` - add `registerAgentKind` and the channel `x-ahpd-agents`, and remove `presets`.
- `UPDATE: packages/agent-claude/README.md` - the kind, its template and its host-only fields.
- `UPDATE: packages/agent-acp/README.md` - the kind, its templates and its host-only fields.
- `UPDATE: packages/agent-cofold/README.md` - the kind and its fields.
- `UPDATE: packages/agent-pi/README.md` - the kind and its key variables.

## Steps

1. Describe the channel, its grants and its owners in PLUGINS.md.
2. Describe `registerAgentKind` and each field of `AgentKind` in PLUGINS.md.
3. Remove every `presets` example from the four READMEs.
4. Give each README one record example, with a `$secret` key.
5. Name the host-only fields and the key variables of each kind.

## Validation

- `rg -n "presets" docs packages/agent-*/README.md` finds no option that is gone.
- By hand, each README example puts with `x-ahpd-agents` with no error.

## Resume

- **Done so far:** PLUGINS.md registers `registerAgentKind` in the registration
  table, carries `agentKinds` in the contracts table, and has a new
  `### An agent kind of your own` with a TypeScript example and a bullet for
  each `AgentKind` field - `name`, `title`, `description`, `icons`, `schema`,
  `templates`, `hostOnly`, `keyVariables` and `open`. "What a client sees" now
  names four channels, and a new `### x-ahpd-agents` gives the row shape and
  `state`, health, the `agent:list`/`agent:all`/`?owner=me` rules, the three
  commands with their grants, the owner rules, id uniqueness, the vault names
  (`host:agent/<id>/env.ANTHROPIC_API_KEY` and so on), `$secret` and `fromEnv`,
  an edit reaching the next turn, and `<configDir>/agents/<id>.json`. Both
  worked examples are off `presets`: the cofold one has no `provider`,
  `displayName` or `description` option and its option table says what a record
  overrides, and the ACP one shows the record fields (with `base`, `command`,
  `args`, `cwd`, `install` and `machine` marked host-only), the id/name/icon/
  model owning by the channel, a template per shipped row, the `codex` machine
  record, and no `presets` map. The four READMEs each introduce their kind,
  give a record field table with host-only marks, name the key variables, and
  have record examples (claude: `claude`, `claude-deepseek-build` and
  `claude-openrouter`; ACP: `my-agent` and `gemini`; cofold: `cofold-deepseek`;
  pi: `pi-deepseek`), each `$secret` example saying that a put sends the key's
  value and keeps the reference. The claude and ACP options tests no longer
  filter `presets` out of the README's option table.
- **Next action:** Softov's by-hand checks in the plan's final verification
  checklist, and `plans/index.md` updated.
- **Files:** `docs/plugins/PLUGINS.md`, `packages/agent-claude/README.md`,
  `packages/agent-acp/README.md`, `packages/agent-cofold/README.md`,
  `packages/agent-pi/README.md`,
  `packages/agent-claude/test/agent-claude-options.test.ts`,
  `packages/agent-acp/test/agent-acp-options.test.ts`.
- **Open questions:** three docs outside this task's Files still describe gone
  `presets`/`variant` options and should be a follow-up: `docs/plugins/COMPUTERS.md`
  (the ACP and Claude `presets` maps, `variant: true`, "each shipped preset"
  and the machine paragraphs), `docs/server/PLUGINS.md` (the
  `agent-claude.presets.x.model` example), `docs/server/CONFIGURE.md` (adding
  `presets.<id>: {}` for an ACP agent, which `ahpd configure` no longer writes),
  and `docs/sdk/AHP.md` (`sandbox` as "a field of a Claude preset"). They were
  left alone because they are not in this task's Files and each needs more than
  a rename: a preset's machine is now a record's `machine`, and `configure` now
  writes records.
- **Departures:** the record examples are written as they sit on disk, so a
  secret field shows `{ "$secret": "<name>" }`. A put refuses that reference
  for a secret field - `packages/sdk/src/channels/owners.ts` says "is a secret:
  send its value, not a reference to it" - so the by-hand check put each
  example with the value in place of the reference, and every one of the seven
  answered `ready` with no problem line. Each README now says both things. The
  claude README's old `presets` sentence in "In a machine" was already a
  record's `env`, and stayed.
- **Watch out for:** never cite another project.
