---
title: A test opens a session in its asked mode
status: implemented
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
