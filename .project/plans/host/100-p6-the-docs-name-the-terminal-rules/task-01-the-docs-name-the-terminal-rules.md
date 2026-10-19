---
title: The docs name the terminal rules
status: implemented
depends: []
layer: docs
refs:
  - "[code://docs/sdk/AHP.md#L195](../../../../docs/sdk/AHP.md#L195) - the keys the host acts on"
  - "[code://packages/sdk/src/vscoderootconfig.ts#L1-L30](../../../../packages/sdk/src/vscoderootconfig.ts#L1-L30) - the header"
---

## Objective

The docs name the three keys, the daemon settings `terminalAutoApproveDefaults` and `commandParser`, and `registerCommandParser`.

## Files

- `UPDATE: docs/sdk/AHP.md:195` - add the three keys, and one sentence on whose rules apply.
- `UPDATE: docs/server/CONFIGURE.md` - `terminalAutoApproveDefaults` and `commandParser`.
- `UPDATE: docs/sdk/HOST.md` - `registerCommandParser` and the `commandParser` port.
- `UPDATE: packages/sdk/src/vscoderootconfig.ts:1-30` - the header names the keys the host acts on.

## Steps

1. Add `terminalAutoApproveEnabled`, `terminalAutoApproveRules` and `editAutoApprovePatterns` to the list in `AHP.md`.
2. Say that the owner's connection's rules apply.
3. Say that a deny rule asks and does not refuse.
4. Say that the host allows a redirect only inside the working folder, when `editAutoApprovePatterns` matches.
5. Describe `terminalAutoApproveDefaults` and `commandParser` in `CONFIGURE.md`.
6. Describe `registerCommandParser` and the `split` contract beside the other plugin ports.
7. Update the header comment of `vscoderootconfig.ts`.
8. Set this task and the plan row to `implemented`.

## Validation

- `node /home/softov/.claude/skills/do-spec/scripts/lint-prose.mjs docs/sdk/AHP.md` prints nothing new.
- `pnpm -s build` passes.

## Resume

- **Done so far:** 2026-10-19. `docs/sdk/AHP.md` names the three keys in the acted-on list, and `root/configChanged` now says five keys are connection-owned rather than two. It says whose rules apply, what a rule is, that a deny asks, and how a write redirect is checked. Only an approved command is `confirmed: not-needed`. `docs/server/CONFIGURE.md` has a `Terminal rules` section for `terminalAutoApproveDefaults` and `commandParser`, and `commandParser` joined the no-flag list. `docs/plugins/PLUGINS.md` has `registerCommandParser` in the register table and `What a command parser has to answer` beside the other ports. `packages/sdk/src/vscoderootconfig.ts`'s header names the five keys this host reads. `packages/sdk/src/host/root.ts` says ten and includes `eligibleForAutoApproval`. `docs/sdk/HOST.md` names all five keys read, the five per-connection keys, and the grants row for a terminal key.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the Files list said `docs/sdk/HOST.md` for the plugin method, but the plan's Answers row puts it in the plugin host docs. It is in `docs/plugins/PLUGINS.md`, where `registerPolicies` and `registerVault` already are, and HOST.md carries the `commandParser` configuration key and links to the section. PLUGINS.md mixes hard-wrapped and one-sentence-per-line sections, so the new section follows the newer one-sentence-per-line style. The prose lint reports only findings that were already in AHP.md, HOST.md and PLUGINS.md; CONFIGURE.md is clean.
