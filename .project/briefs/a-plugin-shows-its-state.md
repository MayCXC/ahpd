---
title: A plugin shows its state
created: 2026-10-31
refs:
  - git://d7b5d3bb - the commit of ahpd the facts were checked at
  - "[code://packages/tunnel-devtunnel/src/plugin.ts#L135-L136](../../packages/tunnel-devtunnel/src/plugin.ts#L135-L136) - the line the Dev Tunnel plugin says at start, with the tunnel id and the port"
  - "[code://packages/tunnel-devtunnel/src/devtunnel.ts#L185-L194](../../packages/tunnel-devtunnel/src/devtunnel.ts#L185-L194) - each line of `devtunnel host` goes to the daemon's log"
  - "[code://packages/sdk/src/types/plugin.ts#L749-L764](../../packages/sdk/src/types/plugin.ts#L749-L764) - `log` and `say`; the daemon ignores `say` after its announcement"
  - "[code://packages/sdk/src/types/plugin.ts#L786-L851](../../packages/sdk/src/types/plugin.ts#L786-L851) - `Alert`, `alert` and `clearAlert`, one sentence kept on the plugin's row"
  - "[code://packages/server/src/pluginschannel.ts#L240-L272](../../packages/server/src/pluginschannel.ts#L240-L272) - the row in `x-ahpd-plugins` carries the alerts and the options form"
  - "[code://packages/server/src/commands/run.ts#L1440-L1448](../../packages/server/src/commands/run.ts#L1440-L1448) - a new alert sends the row again to each client that watches"
  - file:///github/ahpw/src/resources/plugins/Overview.tsx - ahpw draws the alerts on a plugin's Overview
  - npm://@softov/scena@^0.5.16 - the renderer of ahpw, with an A2UI v0.10 converter in `core/converters/a2ui-v0.10.ts`
  - https://a2ui.org/specification/v0_10/ - A2UI v0.10, the component format that the scena converter reads
---

# A plugin shows its state

The Dev Tunnel plugin knows what a person needs: the tunnel URL, the tunnel id, the port and the state of the relay.
The daemon's log shows these values, for example `devtunnel out: Connect via browser: https://<id>-31546.brs.devtunnels.ms`.
The plugin's page in a client shows none of them.
Softov wants a plugin to send a UI schema, and a client to draw that schema on the plugin's page.
The first use is the status of the Dev Tunnel plugin.
With the same schema, any plugin can show its own data, and a client needs no code for that plugin.

## What ahpd has now

- `say` adds one line to the daemon's announcement, which `ahpd status` parses.
  - The daemon ignores `say` after the announcement.
  - The Dev Tunnel plugin says the tunnel id, its label and the port. It does not say the URL.
- `log` writes one line to the daemon's log.
  - The Dev Tunnel plugin copies each line of `devtunnel host` output to the log.
  - The URL and "Connection to host tunnel relay restored" are only in the log.
- `alert` keeps one sentence and a level on the plugin's row.
  - `x-ahpd-plugins` serves the alerts with the row.
  - A new alert sends the row again to each client that watches the channel.
  - An alert is text only. It cannot hold a link, a list of values or a QR code.
- The row also carries the form for the plugin's options, as a JSON Schema that a client draws.
- ahpw draws the alerts on the plugin's Overview. ahpapp and ahpc do not read `x-ahpd-plugins`.

## What others do

- A2UI v0.10 gives a surface as a flat list of components.
  - Each component has an `id`, a `component` name such as `Text` or `Card`, and its properties.
  - `child` and `children` name other components by their `id`.
- scena reads this format through its A2UI v0.10 converter, and ahpw draws with scena.

## Questions for a plan

- Which components a plugin can send: all of A2UI v0.10, or a small set that every client can draw.
- Where the schema goes: a field on the plugin's row in `x-ahpd-plugins`, sent again on each change like an alert.
- Which `PluginHost` call sends it, and which check the loader applies to it.
- Which clients draw it, and in which order.
- Whether a component can send an action back to the plugin, such as a button that restarts the tunnel.
- How the Dev Tunnel plugin gets the URL and the relay state from the output of `devtunnel host`.
