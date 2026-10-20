---
title: A test opens a session in its asked mode
status: done
depends: [task-01-the-open-sends-the-asked-mode.md]
layer: "packages/agent-acp"
refs:
  - "[code://packages/agent-acp/test/fixtures/acp-server.mjs#L207-L215](../../../../packages/agent-acp/test/fixtures/acp-server.mjs#L207-L215) - the fixture's modes"
  - "[code://packages/agent-acp/test/fixtures/acp-server.mjs#L1526-L1530](../../../../packages/agent-acp/test/fixtures/acp-server.mjs#L1526-L1530) - `session/set_mode` in the fixture"
  - "[code://packages/agent-acp/test/agent-acp-catalog.test.ts#L455-L469](../../../../packages/agent-acp/test/agent-acp-catalog.test.ts#L455-L469) - the test to copy"
---

## Objective

Tests on the fixture server show that a session opens in its asked mode, through either way of sending it.

## Files

- `UPDATE: packages/agent-acp/test/agent-acp-catalog.test.ts` - the cases below, beside the mode test at 455-469.

## Steps

1. Start a session with `settings: { permissionMode: 'code' }` on the fixture, which starts in `ask`.
2. Check that the request log holds `session/set_mode` with `modeId: 'code'`.
3. Check that `settings()` and `config.values` report `code`, and that no `configChanged` names the mode.
4. Do the same on a `--modes` fixture, and check for `session/set_config_option` with `configId: 'mode'`.
5. Start a session that asks for `ask`, and check that no mode request goes out.
6. Start a session that asks for a mode the fixture does not offer, and check that it reports `ask`.
7. Run a turn with `die now` after a mode change, and check that the reopen sends the mode again.
8. Set this task and the plan row to `implemented`.

## Validation

- The new tests pass, and fail on the code before task 01.
- `node tools/schema.mjs` and the agent-acp vitest run pass.

## Resume

- **Done so far:** every step, in commit `9a31679a`. `agent-acp-catalog.test.ts` has five new cases beside the mode test.
- `opens a session in the mode it was started with` checks `session/set_mode` with `modeId: 'code'` on the legacy fixture.
- `opens a session in its asked mode through the server mode option` checks `session/set_config_option` on a `--modes` fixture.
- `sends nothing for a session that asks for the mode the server is already in` checks that no mode request goes out.
- `leaves a session in the server mode when the one it asked for is not offered` checks that the session reports `ask`.
- `sends the mode again when the server is opened after a death` checks a second `session/set_mode` after `die now`.
- **Checked against the old code** on 2026-10-19, in a throwaway worktree at `d362c9ca^` with the test file of `9a31679a`.
- Three cases fail there: the first two find no mode request, and the reopen case finds one `session/set_mode` where it expects two.
- The other two pass there, because the old code sends no mode at all. They guard a fix that sends too much.
- With `config.ts` and `opening.ts` of `d362c9ca` in that worktree, the 16 cases that name a mode pass.
- **Next action:** none.
- **Open questions:** none.
