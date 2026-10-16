---
title: The docs name the terminal rules
status: todo
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

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** keep each file's own style; find where the plugin ports are described before you pick the file.
