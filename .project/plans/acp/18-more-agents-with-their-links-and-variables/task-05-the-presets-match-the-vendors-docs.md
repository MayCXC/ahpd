---
title: The presets match the vendors' docs
status: implemented
depends: [task-03-a-known-agent-lists-its-variables.md]
layer: "sdk, agent-acp"
refs:
  - "[code://packages/agent-acp/src/presets.ts#L105-L220](../../../../packages/agent-acp/src/presets.ts#L105-L220) - the presets of devin, amp and pi"
  - "[research/acp-agents-links-and-variables.md](../../../research/acp-agents-links-and-variables.md) - what the vendors document now"
  - https://docs.devin.ai/cli/reference/commands.md - `devin acp` reads `WINDSURF_API_KEY`
  - https://ampcode.com/docs/markdown/cli/settings - `AMP_SKIP_UPDATE_CHECK`
  - https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/docs/environment-variables.md - the new pi repository
---

## Objective

The devin preset signs in with `WINDSURF_API_KEY`, and the amp preset stops the update check.
The pi row installs a pi that pi-acp can run.

## Files

- `UPDATE: packages/agent-acp/src/presets.ts:185-210` - devin and amp.
- `UPDATE: packages/sdk/src/agents.ts:116-121` - pi.
- `UPDATE: packages/computer/images/versions.json:119-120` - the pi packages, which name only `pi-acp` now.
- `UPDATE: packages/agent-acp/test/agent-acp-presets.test.ts` - test devin and amp.

## Steps

1. Run `devin acp` and read the `methodId` of its sign-in from `authMethods`.
2. Give the devin preset `authenticate` with `devin-browser` and `fromEnv: ['WINDSURF_API_KEY']`.
3. Give the amp preset `env: { AMP_SKIP_UPDATE_CHECK: '1' }`.
4. Check whether `npm i -g pi-acp` installs pi 0.81.0 or newer.
5. If it does not, add `@earendil-works/pi-coding-agent` to the pi install line and to `versions.json`.
6. Run `qwen --acp --experimental-skills` and keep the flag only if the handshake changes.
7. Remove the kilo comment that says Kilo reads `OPENCODE_DISABLE_AUTOUPDATE` if Kilo's source does not read it.

## Validation

- The preset test checks the devin sign-in and the amp variable.
- `pnpm test` passes.
- By hand: `devin acp` with `WINDSURF_API_KEY` opens a session through the bridge.

## Resume

- **Done so far:** step 3 is in: the `amp` preset sets `env: { AMP_SKIP_UPDATE_CHECK: '1' }`, and a test checks it. Step 4 found that `pi-acp` 0.0.34 does not install `pi`. Its own prerequisites want pi 0.81.0 or newer on PATH. Step 5 therefore added `@earendil-works/pi-coding-agent@1.3.0` to the pi install line and to the pi part in `versions.json`. `pi` is also added to that part's `bin`, so the launcher lands on the machine PATH. Step 6 ran `qwen --acp` and `qwen --acp --experimental-skills`: the two handshakes were identical, so the flag is not added. Step 7 could not remove the kilo comment. Kilo is installed here as a launcher for a native binary, with no source to read, so whether it reads `OPENCODE_DISABLE_AUTOUPDATE` is still unconfirmed.
- **Next action:** review. Step 1 found one method, `devin-browser`. Step 2 gives the devin preset that method, sent when `WINDSURF_API_KEY` is set, and a test checks it.
- **Open questions:** whether Kilo reads the OpenCode update switch.
- **Watch out for:** the amp preset's machine has no state directory because Amp documents no variable that moves its settings, and that is unchanged. The pi part pins 1.3.0 while the part's own version stays 0.0.34 (the `pi-acp` version), so a bump of the part does not bump pi.
