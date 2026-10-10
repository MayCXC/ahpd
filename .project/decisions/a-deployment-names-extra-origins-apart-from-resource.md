---
title: A deployment names the extra origins the daemon answers to in `origins`, apart from `resource`
status: accepted
date: 2026-10-10
refs:
  - "[code://packages/server/src/commands/run.ts#L75-L86](../../packages/server/src/commands/run.ts#L75-L86) - `apiOrigins`, the names the API and the plugin routes answer to"
  - "[code://packages/server/src/http.ts#L77-L82](../../packages/server/src/http.ts#L77-L82) - `hostRefusal`, which refuses a `Host` that is not one of them"
  - "[code://packages/server/src/config.ts#L138-L146](../../packages/server/src/config.ts#L138-L146) - `resource`, the RFC 9728 identifier for the host's sign-in"
---

## Context

A daemon bound to `0.0.0.0` answers only to the loopback names and to the host of `resource`.
A browser that opens `http://203.0.113.1:37537/plugins/ahpd-web/` gets "This route does not answer to 203.0.113.1:37537".
Today only `resource` adds such a name.
`resource` is also the identifier a client names in `authenticate`, and RFC 9728 wants it to use https.

## Decision

The key `origins`, and the repeatable flag `--origin`, list the extra origins the daemon answers to.
Each entry is an `http:` or `https:` origin, such as `http://203.0.113.1:37537`.
The API accepts the origin of each entry as an `Origin` value.
The API and the plugin routes accept the `host` of each entry as a `Host` value.
`resource` keeps its current meaning, and it still adds its own host.

Source: Softov, 2026-10-10, after the Host refusal on the public address: "can we do something like a config key to accept origin? since connection with 37537 is not a problem.. the problem is that it does not accept router proper."

## Consequences

A deployment that a browser reaches by another address or name puts it in `origins`.
The sign-in identifier does not change.
An entry is exact: `http://x:37537` does not admit `https://x:37537`, `x` without the port, or a different port.
The DNS-rebinding guard of [The HTTP API checks Origin and Host, and takes only JSON bodies](the-http-api-checks-origin-and-host-and-takes-only-json.md) stays.
Each name in `origins` is one the deployment chose to trust.

## Options

- **Set `resource` to the public address.** It changes the identifier a client signs in against. An `http:` address is also not the https identifier RFC 9728 asks for.
- **A list of bare host names.** A name with no scheme cannot say which `Origin` a browser sends. The daemon would have to guess the scheme and the port.
- **A switch that turns the `Host` check off.** It removes the DNS-rebinding guard for every name.
