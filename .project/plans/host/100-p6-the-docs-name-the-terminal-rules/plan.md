---
title: The docs name the terminal rules
domain: host
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/host/100-terminal-commands-approved-by-rule/plan.md
  - plans/host/100-p3-another-parser-replaces-the-splitter/plan.md
  - plans/host/100-p4-claude-and-acp-ask-for-unmatched-commands/plan.md
  - plans/host/100-p5-pi-and-cofold-ask-for-unmatched-commands/plan.md
changes: []
creates: []
decisions: []
refs:
  - "[code://docs/sdk/AHP.md#L195](../../../../docs/sdk/AHP.md#L195) - the keys the host acts on"
  - "[code://packages/sdk/src/vscoderootconfig.ts#L1-L30](../../../../packages/sdk/src/vscoderootconfig.ts#L1-L30) - the header that says the host acts only on `globalAutoApproveEnabled`"
---

## Goal

The docs say that the host acts on the terminal rules and on `editAutoApprovePatterns`.
They say whose rules apply, what the daemon default is, and how another parser replaces the splitter.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `git grep -n "globalAutoApproveEnabled" docs/` - AHP.md lists the keys the host acts on.

### Runtime path

```
docs/sdk/AHP.md -> docs/server/CONFIGURE.md -> docs/sdk/HOST.md
```

### Gaps

- No doc names a key that holds a module, other than `plugins`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The host now reads `editAutoApprovePatterns`, so AHP.md names it | Softov, 2026-10-16, chose "as VS Code" for "How a write redirect is checked" | 01 |
| The plugin method goes in the plugin host docs, beside the other ports | (defaulted: where a plugin author looks) | 01 |

## Proposed architecture

- **Layer responsibilities** - docs only, and the header comment of `vscoderootconfig.ts`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The docs name the terminal rules](task-01-the-docs-name-the-terminal-rules.md) | done | - |

## Risks and tradeoffs

- None.

## Resume state

- **Done so far:** planned 2026-10-16 from the answers in the parent plan. Task 01 implemented 2026-10-19: the three keys are in AHP.md and HOST.md. `terminalAutoApproveDefaults` and `commandParser` are in AHP.md, HOST.md and CONFIGURE.md, and `registerCommandParser` and its contract are in PLUGINS.md beside the other ports. The entries say whose rules apply, that a deny asks, how a write redirect is checked, and that only an approved command is `not-needed`. Softov reviewed the plan 2026-10-19 and approved the close, and [implemented.md](implemented.md) says what was built.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the task file's Files list named HOST.md for the plugin method, and the Answers row named the plugin host docs. The method went to `docs/plugins/PLUGINS.md`, where the other ports are; HOST.md links there from the `commandParser` key. The prose lint reports only findings each file already had.

## Final verification checklist

- [x] The docs name every key and the plugin method.
- [x] `plans/index.md` updated.
