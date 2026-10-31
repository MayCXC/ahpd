---
title: The host advertises the root its plugin routes are reached at
created: 2026-10-31
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L425](../../packages/sdk/src/host/handshake.ts#L425) - the `initialize` `_meta`, where `ahpd.methods` and `ahpd.channels` are advertised"
  - "[code://packages/server/src/config.ts#L35](../../packages/server/src/config.ts#L35) - `RoutesSetting`, whose `port` moves the routes to a listener of their own"
  - "[code://docs/plugins/WEBHOOKS.md#L55](../../docs/plugins/WEBHOOKS.md#L55) - a client puts the daemon's HTTP root, or the routes listener's, before the receive path"
  - file:///github/ahpw/.project/plans/plugins/04-connectors/task-07-the-hosts-public-root.md - ahpw's task that waits on this
---

A client shows a connector's URL as the HTTP root followed by the adapter's receive path, such as `/plugins/webhook/{id}`.
The host does not say what that root is, so ahpw works it out from how its page was served.
That answer is wrong when `routes.port` moves the routes to their own listener.
It is wrong too when a proxy publishes the routes under a public name.
The host could advertise the root in its `initialize` `_meta`, beside `ahpd.methods`, so every client shows the URL a sender must call.
A root the deployment sets by hand would cover the proxy, and the routes listener's address would be the default.
