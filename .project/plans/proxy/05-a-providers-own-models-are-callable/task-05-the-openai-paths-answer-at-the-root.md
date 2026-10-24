---
title: The OpenAI paths answer at the root
status: todo
depends: []
layer: "server"
refs:
  - "[code://packages/server/src/proxy/dialects.ts#L16-L33](../../../../packages/server/src/proxy/dialects.ts#L16-L33) - `CALLER_PATHS` and `MODELS_PATH`"
  - "[code://packages/server/src/proxy/listener.ts#L722-L734](../../../../packages/server/src/proxy/listener.ts#L722-L734) - the path dispatch"
  - "[code://packages/server/src/http.ts#L127-L148](../../../../packages/server/src/http.ts#L127-L148) - `PROXY_PREFIX` and `withoutApi`"
  - "[code://packages/sdk/src/plugins/plugins.ts#L124](../../../../packages/sdk/src/plugins/plugins.ts#L124) - `ROUTE_ROOT`"
---

## Objective

`POST /chat/completions` and `GET /models` answer as their `/v1` paths do.
`/v1/messages` stays the only Anthropic path, so `http://host:port` is the base URL for both SDKs.

## Files

- `UPDATE: packages/server/src/proxy/dialects.ts` - the root paths beside `CALLER_PATHS` and `MODELS_PATH`, and `dialectAt` reads both.
- `UPDATE: packages/server/src/proxy/listener.ts` - the dispatch takes the root paths as well as `/v1`.
- `UPDATE: packages/server/src/http.ts` - `withoutApi` sends the root proxy paths to the API handler, as it sends `/v1`.
- `UPDATE: packages/server/test/proxy-listener.test.ts` - the root paths, `/messages` at the root, and a plugin route beside them.

## Steps

1. Add `ROOT_PATHS`, the OpenAI paths that also answer at the root: `/chat/completions` and `/models`.
2. Make `dialectAt` read `/chat/completions` as `openai-chat`.
3. Make the dispatch answer root `/models` as it answers `/v1/models`.
4. Make `withoutApi` send each root proxy path to the API handler.
5. Leave `/messages` at the root to the handler below, as today.
6. Test that an OpenAI call and a models list at the root answer as under `/v1`.
7. Test that `/messages` at the root is not the proxy.
8. Test that a plugin route under `/plugins` still answers beside the root paths.

## Validation

- `proxy-listener.test.ts` passes.
- The gate passes: `pnpm -s typecheck && pnpm -s build && pnpm -s boundary && pnpm -s test`.

## Resume
