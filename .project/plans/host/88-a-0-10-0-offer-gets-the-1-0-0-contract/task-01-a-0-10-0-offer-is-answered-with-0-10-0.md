---
title: A 0.10.0 offer is answered with 0.10.0
status: done
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
- `UPDATE: packages/sdk/test/ahp-test-cases.test.ts:198-224` - run the rows of the version table against the package's `negotiateProtocolVersion`, as VS Code does.

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
- A test: a `0.10.0` client runs a turn and gets no `chat/canvasesChanged` or `canvas/stateChanged`.
- Run `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk, server, agent-claude and agent-acp.

## Resume

Built in `packages/sdk`, with the docs in `docs/sdk/AHP.md`.

What changed, file by file:

- `src/host/handshake.ts` imports `compareProtocolVersions` and holds two constants: `LEGACY_COMPATIBLE_VERSION`, which is `0.10.0`, and `SPOKEN_VERSIONS`, the package's versions plus `0.10.0`, highest first.
- In `initialize`, the `INVALID_PARAMS` catch still comes first. Then an offer that holds `0.10.0` gets `0.10.0` when the package agreed on nothing or on a lower version.
- The `-32005` refusal lists `SPOKEN_VERSIONS`, which is `1.0.0`, `0.10.0` and `0.9.0`.
- `seenBy` has no filter, and the connection does not keep the agreed version.
- `test/host-handshake.test.ts` has the Validation cases: `0.10.0` in either order, `1.0.0` above it, `0.9.0` alone, the new refusal list, and `-32602` for `1.0`.
- `test/host-handshake.test.ts` also has the canvas case. A client on `0.10.0` runs a turn to `chat/turnComplete` and gets no action whose type names a canvas.
- `test/ahp-test-cases.test.ts` runs every row of the package's version table against `negotiateProtocolVersion`, as VS Code does at 51ec2ee42fd.
- The same test sends each row that does not offer `0.10.0` through the host too. It checks the answer, `-32602` for a malformed entry, and `-32005` with the three versions.
- `docs/sdk/AHP.md` says the host speaks `0.10.0`, and which versions a refusal lists.

What the plan did not know:

- The protocol package's version table expects a refusal for `2.0.0 0.10.0 0.8.99` and `0.9.1` for `2.0.0 0.10.0 0.9.1`. The alias answers `0.10.0` to both, and the table's refusal lists only two versions. Softov chose to do what VS Code does.
- The canvas state action is `canvas/stateChanged`, not `chat/canvasStateChanged`.
- `ActionType` is a const enum, which `verbatimModuleSyntax` does not let a test import. The canvas test uses the string types.

Open questions: none.

Gates: `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass. `pnpm exec vitest run packages/sdk packages/server packages/agent-claude packages/agent-acp` passes 4448 of 4448 tests.
