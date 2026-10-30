---
title: The host honours a token's target
status: todo
depends: []
layer: host
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L73-L156](../../../../packages/sdk/src/host/handshake.ts#L73-L156) - `tokensFor`, `expire` and `forgetExpiry`"
  - "[code://packages/sdk/src/host/handshake.ts#L546-L707](../../../../packages/sdk/src/host/handshake.ts#L546-L707) - `authenticate`"
  - "[code://packages/agent-claude/src/session/servers.ts#L402-L431](../../../../packages/agent-claude/src/session/servers.ts#L402-L431) - Claude's `authenticated`"
  - "[code://packages/sdk/src/sessions/nested.ts#L1311-L1323](../../../../packages/sdk/src/sessions/nested.ts#L1311-L1323) - the nested session's `authenticated`"
---

## Objective

A token whose `target` names one MCP server of one session goes to that server alone, and is kept under its resource and its target.
A target that names nothing this host publishes, or a server that does not wait for the token's resource, is refused with `-32602`.

## Files

- `UPDATE: packages/sdk/src/host/handshake.ts:73-156` - a token's key holds its target; `expire` and `forgetExpiry` take the key, and an expired targeted token is said on its session.
- `UPDATE: packages/sdk/src/host/handshake.ts:546-707` - `authenticate` checks a target, gives the token to that session's waiting chats with the server's id, and never treats it as the host's sign-in.
- `UPDATE: packages/sdk/src/host/context.ts:419-421` - `forgetExpiry` takes a token's key.
- `UPDATE: packages/sdk/src/host.ts:1906-1907` - the clocks a closed connection leaves are forgotten by key.
- `UPDATE: packages/sdk/src/types/host.ts:1260-1272` - `Connection.tokens` is kept by resource, and by target for a targeted token.
- `UPDATE: packages/sdk/src/types/session.ts:786-796` - `authenticated` takes the customization id of the server a target named.
- `UPDATE: packages/agent-claude/src/session/servers.ts:22` - `authenticated` takes the server's id.
- `UPDATE: packages/agent-claude/src/session/servers.ts:402-429` - a named server takes the token alone, and only when it waits for the resource.
- `UPDATE: packages/sdk/src/sessions/nested.ts:1311-1323` - the token goes to the host inside with a target that names the inner session.
- `UPDATE: docs/sdk/AHP.md:96` - the `authenticate` row says what a target does.
- `UPDATE: docs/sdk/AUTHENTICATION.md:72-78` - the same, in the command's own section.
- `CREATE: packages/sdk/test/authenticate-target.test.ts` - two Claude sessions whose servers wait for one resource, and a token aimed at one of them.
- `UPDATE: packages/sdk/test/nested-proxy.test.ts:262-330` - the scripted agent publishes its servers and keeps the server a token names.
- `UPDATE: packages/sdk/test/nested-proxy.test.ts:455-467` - a targeted token reaches the named server inside.

## Steps

1. Write the cases in `authenticate-target.test.ts` for the target rules in the plan's *Answers*.
2. Run the file on the host as it is, and see each case fail.
3. Write the nested case, and see that the host inside gets no target.
4. Key `connection.tokens` and the clocks by resource and target.
5. Check a target in `authenticate`, and refuse what it cannot find with `-32602`.
6. Give a targeted token to the waiting chats of its session, with the server's id.
7. Keep a targeted token away from the host's sign-in and from its GitHub lookups.
8. Give `authenticated` the server's id in the contract, in Claude and in the nested session.
9. Write what a target does into `AHP.md` and `AUTHENTICATION.md`.
10. Run both test files, the files that cover `authenticate`, and the type check.

## Validation

- `packages/sdk/test/authenticate-target.test.ts`: every case fails before the change and passes after it.
- `packages/sdk/test/nested-proxy.test.ts`: the targeted case fails before the change, and every case passes after it.
- `packages/sdk/test/host-handshake.test.ts` and `packages/sdk/test/toolauth.test.ts` pass, for `authenticate` with no target.
- `pnpm run typecheck` reports no errors.

## Resume

