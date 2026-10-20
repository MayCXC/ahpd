---
title: The presets match the vendors' docs
status: todo
depends: [task-03-a-known-agent-lists-its-variables.md]
layer: "sdk, agent-acp"
refs:
  - "[code://packages/agent-acp/src/presets.ts#L105-L220](../../../../packages/agent-acp/src/presets.ts#L105-L220) - the presets of devin, amp, pi and goose"
  - "[research/acp-agents-links-and-variables.md](../../../research/acp-agents-links-and-variables.md) - what the vendors document now"
  - https://docs.devin.ai/cli/reference/commands.md - `devin acp` reads `WINDSURF_API_KEY`
  - https://ampcode.com/docs/markdown/cli/settings - `AMP_SKIP_UPDATE_CHECK`
  - https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/environment-variables.md - the new pi repository
---

## Objective

The devin preset signs in with `WINDSURF_API_KEY`, and the amp preset stops the update check.
The pi row installs a pi that pi-acp can run, and the goose row names its new page.

## Files

- `UPDATE: packages/agent-acp/src/presets.ts:185-210` - devin and amp.
- `UPDATE: packages/sdk/src/agents.ts:104-121` - goose and pi.
- `UPDATE: packages/computer/images/versions.json:119-120` - the pi packages, which name only `pi-acp` now.
- `UPDATE: packages/agent-acp/test/agent-acp-presets.test.ts` - test devin and amp.

## Steps

1. Run `devin acp` and read the `methodId` of its key sign-in from `authMethods`.
2. Give the devin preset `authenticate` with that `methodId` and `fromEnv: ['WINDSURF_API_KEY']`.
3. Give the amp preset `env: { AMP_SKIP_UPDATE_CHECK: '1' }`.
4. Check whether `npm i -g pi-acp` installs pi 0.81.0 or newer.
5. If it does not, add `@earendil-works/pi-coding-agent` to the pi install line and to `versions.json`.
6. Change the goose page to `https://goose-docs.ai`.
7. Run `qwen --acp --experimental-skills` and keep the flag only if the handshake changes.
8. Remove the kilo comment that says Kilo reads `OPENCODE_DISABLE_AUTOUPDATE` if Kilo's source does not read it.

## Validation

- The preset test checks the devin sign-in and the amp variable.
- `pnpm test` passes.
- By hand: `devin acp` with `WINDSURF_API_KEY` opens a session through the bridge.

## Resume
