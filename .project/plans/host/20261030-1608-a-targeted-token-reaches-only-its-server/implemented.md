---
title: A targeted token reaches only its server - implemented
date: 2026-10-30
refs:
  - git://ca623f78 - the change
  - "[code://packages/sdk/src/host/handshake.ts#L216-L240](../../../../packages/sdk/src/host/handshake.ts#L216-L240) - `aimedAt`, which checks a target and refuses what it cannot find"
  - "[code://packages/sdk/src/host/handshake.ts#L633-L813](../../../../packages/sdk/src/host/handshake.ts#L633-L813) - `authenticate` with a target"
---

A client that answers one MCP server's sign-in names that server in `authenticate`'s `target`, and the token goes to that server in that session alone.
No server beside it, no other session and no backend's own resource gets it, even when they share the resource.
A target this host cannot find, or a server that does not wait for the token's resource, is refused with `-32602`.

## What was built

- [`code://packages/sdk/src/host/handshake.ts#L41-L78`](../../../../packages/sdk/src/host/handshake.ts#L41-L78) - `Target`, `keyOf`, the key a token is kept under, and `mcpServerIn`, the server a session publishes under an id.
- [`code://packages/sdk/src/host/handshake.ts#L145-L201`](../../../../packages/sdk/src/host/handshake.ts#L145-L201) - `expire` and `forgetExpiry` by key; an expired targeted token is said on its session.
- [`code://packages/sdk/src/host/handshake.ts#L216-L240`](../../../../packages/sdk/src/host/handshake.ts#L216-L240) - `aimedAt` refuses an unknown kind, session or server, and a resource the server does not wait for.
- [`code://packages/sdk/src/host/handshake.ts#L633-L813`](../../../../packages/sdk/src/host/handshake.ts#L633-L813) - `authenticate` gives a targeted token to the waiting chats of its session, with the server's id.
  It keeps the token under its key, away from the sign-in and the GitHub lookups.
- [`code://packages/sdk/src/types/session.ts#L786-L801`](../../../../packages/sdk/src/types/session.ts#L786-L801) - `authenticated` takes the id of the server a target named.
- [`code://packages/agent-claude/src/session/servers.ts#L402-L436`](../../../../packages/agent-claude/src/session/servers.ts#L402-L436) - Claude gives a targeted token to that server alone, and only while it waits for the resource.
- [`code://packages/sdk/src/sessions/nested.ts#L1311-L1340`](../../../../packages/sdk/src/sessions/nested.ts#L1311-L1340) - a nested session passes the target to the host inside.
- [`code://packages/sdk/test/authenticate-target.test.ts`](../../../../packages/sdk/test/authenticate-target.test.ts) - six cases on two Claude sessions whose servers wait for one resource.
- [`code://packages/sdk/test/nested-proxy.test.ts#L474-L496`](../../../../packages/sdk/test/nested-proxy.test.ts#L474-L496) - "a sign-in aimed at one server reaches that server inside, and no other".
- [`code://docs/sdk/AUTHENTICATION.md#L80`](../../../../docs/sdk/AUTHENTICATION.md#L80) and [`code://docs/sdk/AHP.md#L96`](../../../../docs/sdk/AHP.md#L96) - what a target does.

## Verified

- On the host before the change, all six cases in `authenticate-target.test.ts` fail.
  The token reached `desk` and not `tickets`, and two bad targets resolved `{}`.
  The next session started on the targeted token, and a targeted revocation took the resource's token.
  The expiry named `ahp-session:/one`.
- On the host before the change, the nested case fails: the host inside was told no server.
- With the change, `authenticate-target.test.ts` and `nested-proxy.test.ts` pass, 58 tests.
- `host-handshake.test.ts`, `toolauth.test.ts`, `users-host.test.ts` and `host-harness.test.ts` pass, 104 tests.
- The type check passes.

## Departures from the plan

- none.

## Left for later

- none.
