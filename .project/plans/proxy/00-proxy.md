---
title: Proxy - what exists today
domain: proxy
revalidated: 2026-10-24
---

The proxy forwards model calls from people's own tools (Claude Code, scripts) to a model provider. It carries them under their ahpd identity, so the calls can be routed, recorded and limited.
It is not an agent: it holds no session and runs nothing.
It is served under `/v1` beside `/api` while `httpApi` is on, in each caller's dialect, streamed back unchanged; see [`docs/server/PROXY.md`](../../../docs/server/PROXY.md).
A provider is a connector, made from one of the four provider adapters the host ships. Its key is a vault secret, or a daemon variable that a host connector names.

## Packages

- [`code://packages/server`](../../../packages/server) - config, commands and listeners; the proxy lives here.

## Contracts

- [`code://packages/server/src/config.ts`](../../../packages/server/src/config.ts) - `Config`, where the proxy's settings go.
- [`code://packages/server/src/proxy/providers.ts`](../../../packages/server/src/proxy/providers.ts) - the model names, the entries that serve each, and `modelProxy.sessionCalls`.
- [`code://packages/server/src/proxy/adapters.ts`](../../../packages/server/src/proxy/adapters.ts) - the four provider adapters the host ships, with their forms, checks, icons and `provider`.
- [`code://packages/server/src/proxy/listener.ts`](../../../packages/server/src/proxy/listener.ts) - `proxyHandler` and `ProxyOptions`, whose `whose` hook answers a session's own token.
- [`code://packages/server/src/proxy/caller.ts`](../../../packages/server/src/proxy/caller.ts) - `SessionCaller`, `ProxyCaller` and `callerOf`.
- [`code://packages/server/src/proxy/route.ts`](../../../packages/server/src/proxy/route.ts) - `route` and `upstreamUrl`.
- [`code://packages/server/src/proxy/dialects.ts`](../../../packages/server/src/proxy/dialects.ts) - paths, error bodies, key headers, usage readers and the models list per dialect.
- [`code://packages/server/src/commands/registry.ts`](../../../packages/server/src/commands/registry.ts) - commands declared once, CLI and `/api`.

## Runtime path

```
tool -> POST /v1/chat/completions | /v1/messages on the API's listener
  -> guard (Host, loopback at any port, Origin) -> caller: deployment token | whose | users.verify + proxy:write
  -> scope: X-AHP-Scope | ?scope= | primary -> body (32 MiB, JSON, model)
  -> connectors channel: the open provider connectors, with each one's owner
  -> route: entries accepting the dialect and allowed by policy, each on the caller's own connector, then the team's, then the host's
  -> fetch <endpoint><dialect path> with the entry's id and that connector's key; fallback before any byte, each attempt noted on the connector
  -> status, headers and body streamed back; usage read on the way -> ModelUse source 'proxy', with the adapter and the connector
```

## Tests

- [`code://packages/server/test/config-check.test.ts`](../../../packages/server/test/config-check.test.ts) - config checking, `modelProxy.sessionCalls` and the refusal of `providers` included.
- [`code://packages/server/test/proxy-adapters.test.ts`](../../../packages/server/test/proxy-adapters.test.ts) - the four host adapters: forms, `provider`, checks and icons.
- [`code://packages/server/test/proxy-route.test.ts`](../../../packages/server/test/proxy-route.test.ts) - routing over Softov's table.
- [`code://packages/server/test/proxy-listener.test.ts`](../../../packages/server/test/proxy-listener.test.ts) - the guard, the refusal shapes, the caller, the models list, and the mount in a real daemon.
- [`code://packages/server/test/proxy-forward.test.ts`](../../../packages/server/test/proxy-forward.test.ts) - headers out and back, SSE streaming, timeouts, hang-up and fallback.
- [`code://packages/server/test/proxy-policy-usage.test.ts`](../../../packages/server/test/proxy-policy-usage.test.ts) - `model` policies and usage records, session calls at `record` and `skip`.

## Known gaps

- Nothing fills `whose` yet; container/05 p12 task 01 does.
- No translation between dialects, no cache prices, no cache-affinity routing.
- Limits and pools are not enforced (policy/02).
- Paths beside the three, such as `/v1/messages/count_tokens`, are 404.
