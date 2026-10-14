---
title: A 0.10.0 offer is answered with 0.10.0
status: todo
depends: []
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L134-L153](../../../../packages/sdk/src/host/handshake.ts#L134-L153) - `initialize`"
  - "[code://packages/sdk/test/host-handshake.test.ts#L14-L40](../../../../packages/sdk/test/host-handshake.test.ts#L14-L40) - the negotiation tests"
  - "git://github.com/microsoft/vscode@51ec2ee42fd - `negotiateAgentHostProtocolVersion` and `getAgentHostSupportedProtocolVersions`"
---

## Objective

`initialize` answers `0.10.0` to an offer that holds it and agrees on nothing above it.
The refusal lists `0.10.0`, and no canvas action reaches the client.

## Files

- `UPDATE: packages/sdk/src/host/handshake.ts:134-153` - after `negotiateProtocolVersion`, apply the `0.10.0` rule; add `0.10.0` to `supportedVersions` in the `-32005` refusal, sorted highest first.
- `UPDATE: packages/sdk/src/host/handshake.ts:1` - import `compareProtocolVersions` from the protocol package, which exports it.
- `UPDATE: packages/sdk/test/host-handshake.test.ts:14-40` - the cases in Validation.

## Steps

1. Write the tests first.
2. Keep the `INVALID_PARAMS` catch in front of the new rule, so a malformed entry is still `-32602`.
3. Answer `0.10.0` when the offer holds it and the package answer is empty or lower.
4. Build the refusal list from `SUPPORTED_PROTOCOL_VERSIONS` plus `0.10.0`, sorted highest first.
5. Add the canvas test. Add no filter to `seenBy`.

## Validation

- `host-handshake.test.ts`: `['0.10.0','0.9.0']` and `['0.9.0','0.10.0']` get `0.10.0`.
- `host-handshake.test.ts`: `['1.0.0','0.10.0']` gets `1.0.0`, and `['0.9.0']` still gets `0.9.0`.
- `host-handshake.test.ts`: the refusal of `['0.8.0']` lists `supportedVersions` `['1.0.0','0.10.0','0.9.0']`.
- `host-handshake.test.ts`: the host still answers `['1.0']` with `-32602`.
- A test: a `0.10.0` client runs a turn and gets no `chat/canvasesChanged` or `chat/canvasStateChanged`.
- Run `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk, server, agent-claude and agent-acp.

## Resume

Not started.
