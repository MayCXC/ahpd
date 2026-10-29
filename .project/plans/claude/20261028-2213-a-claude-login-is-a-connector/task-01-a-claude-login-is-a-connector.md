---
title: A Claude login is a connector
status: done
depends: []
layer: "agent-claude, sdk, server"
refs:
  - "[code://packages/sdk/src/types/connectors.ts#L237-L354](../../../../packages/sdk/src/types/connectors.ts#L237-L354) - the adapter this task registers, and the sign-in the host runs for it"
  - "[code://packages/server/src/proxy/adapters.ts#L141-L163](../../../../packages/server/src/proxy/adapters.ts#L141-L163) - `probe`, which moves to the sdk so this adapter's check is the same one"
  - "[code://packages/server/src/proxy/adapters.ts#L349-L385](../../../../packages/server/src/proxy/adapters.ts#L349-L385) - the `openrouter` sign-in, the shape this one copies"
  - "[code://packages/agent-claude/src/plugin.ts#L136-L143](../../../../packages/agent-claude/src/plugin.ts#L136-L143) - `apply`, where the adapter is registered beside the engine"
---

## Objective

agent-claude registers the adapter `claude-login`.
A person makes a login by a sign-in on claude.ai or by a pasted token, and its check says whether the token works.
The plugin keeps each open login's token and owner for the engine.

## Files

- `CREATE: packages/sdk/src/connectors/probe.ts` - `probe`, the check one call with a credential answers, shared by every adapter that checks this way.
- `UPDATE: packages/sdk/src/index.ts` - `probe` and its time limit exported beside the connector types.
- `UPDATE: packages/server/src/proxy/adapters.ts:141-163` - the host adapters take `probe` and its time limit from the sdk.
- `UPDATE: packages/agent-claude/src/logins.ts` - the open logins of one load: each token and owner, by connector id.
- `CREATE: packages/agent-claude/src/adapter.ts` - the `claude-login` adapter: its schema, its sign-in, its check and its `open`.
- `UPDATE: packages/agent-claude/src/plugin.ts` - one record of open logins for the load, and the adapter registered over it.
- `UPDATE: packages/agent-claude/package.json` - the manifest's contracts name the adapter `claude-login`.
- `CREATE: packages/agent-claude/test/agent-claude-login-adapter.test.ts` - the cases below.

## Steps

1. Move `probe` and its time limit from `adapters.ts` to `packages/sdk/src/connectors/probe.ts`, and let a JSON body make it a POST.
2. Export `probe` from the sdk, and import it in `adapters.ts`.
3. Write the Claude Code sign-in constants in `adapter.ts`, and cite the CLI 2.1.301 for each.
4. Write `signIn.url` with the CLI's parameters in its order, and the host's challenge and state.
5. Write `signIn.exchange`: split the paste at `#`, refuse a paste without both halves, and post the CLI's body.
6. Refuse a non-2xx exchange with `HTTP <status>`, and answer `access_token`.
7. Write `check` as `probe` of `/v1/messages/count_tokens` for one prompt, with the token and the CLI's OAuth beta header.
8. Write `OpenLogins` in `logins.ts`: `opened` keeps a connector's token and owner, and its stop forgets them.
9. Make the adapter's `open` call `OpenLogins.opened`, and answer its stop.
10. Make `apply` build one `OpenLogins` and register the adapter over it.

## Validation

- `packages/agent-claude/test/agent-claude-login-adapter.test.ts` holds these cases:
  - A load registers `claude-login`, with `token` marked `writeOnly` and a sign-in that fills it.
  - The sign-in URL is the CLI's `setup-token` URL, with the host's challenge and state.
  - An exchange posts the paste's code and state, the verifier and the code page.
    It asks for a one-year expiry, and answers the token.
  - The exchange refuses a paste without its state, and posts nothing.
  - A refused exchange says its status and nothing of the answer.
  - The check counts one prompt's tokens with the token: 200 is `ok`, 401 `denied`, 500 `failed`, and no answer `unreachable`.
  - `open` keeps the token for the engine, and its stop forgets it.
- Run `pnpm vitest run packages/agent-claude/test/agent-claude-login-adapter.test.ts`, and expect every case to pass.
- Run `pnpm vitest run packages/server/test/proxy-adapters.test.ts --maxWorkers=1`, and expect it to pass on the moved `probe`.
- Run the new cases on the code before this task, and expect them to fail.

## Resume

Done 2026-10-28.
The adapter's nine cases fail on the code before this task, which has no `src/adapter.ts` for them to load.
The host adapters' cases pass on the moved `probe`, in the server suite.
A load refuses an adapter its manifest's contracts do not name, so the manifest names `claude-login`.
The check counts tokens, a model request, because a `setup-token` token makes model requests and nothing else.
Both calls were measured with a `/login` token, which holds more scopes, and neither with a `setup-token` token.
A retired model answers 404 after the token is accepted, so the check then says `failed` and not `denied`.

