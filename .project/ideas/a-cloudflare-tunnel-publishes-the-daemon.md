---
title: A Cloudflare tunnel publishes the daemon
created: 2026-10-29
refs:
  - "[code://packages/tunnel-devtunnel/src/plugin.ts#L94](../../packages/tunnel-devtunnel/src/plugin.ts#L94) - the devtunnel plugin, the shape to copy"
  - https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/ - Cloudflare Tunnel
---

A `tunnel-cloudflared` plugin publishes the daemon through Cloudflare Tunnel, as `tunnel-devtunnel` does through Dev Tunnels.
A quick tunnel gives a random `trycloudflare.com` URL with no account, to try it.
A named tunnel uses the person's own domain, with Cloudflare Access in front.
The plugin refuses a public tunnel on a daemon that is not guarded.
