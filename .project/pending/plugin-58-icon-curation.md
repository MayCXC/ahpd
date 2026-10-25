---
title: Curate the icon of each plugin in this repository
plans:
  - plans/plugin/58-plugins-and-adapters-carry-icons/plan.md
  - plans/plugin/61-a-plugin-icon-has-a-dark-variant/plan.md
---

# Curate the icon of each plugin in this repository

Plan 58 task 05 gives each plugin in this repository one SVG icon.
Plan 61 task 01 gives each Lucide icon a second file for a dark background.
Seven candidates come from Lucide, which publishes its icons under the ISC licence, and each of those files keeps its licence comment.
The ACP, Activepieces, Claude and pi candidates are the vendors' own marks, after the first Lucide choices looked wrong.
Every file is under 32 KB, and none carries a script or an event attribute.
The webhook adapter names the same two files as its plugin.

`currentColor` has no value inside an image, so each Lucide file now strokes in a fixed colour.
`icon.svg` strokes in `#1F2328`, for a light background.
`icon-dark.svg` strokes in `#E6EDF3`, for a dark background.
The Activepieces, Claude and pi marks keep one icon, because their colours read on both backgrounds.

Each candidate is in place already, so a plugin shows it at the next start.
Replace a candidate that you reject with the SVG you want, at the same path.
Nothing else changes, because the manifest of each package names the file, not the drawing in it.

| Plugin | File | Candidate | Dark file | Source | Licence |
| --- | --- | --- | --- | --- | --- |
| Activepieces | `packages/activepieces/icon.svg` | the Activepieces mark, in `#8142E3` | none | https://github.com/activepieces/activepieces/blob/main/docs/favicon.svg | vendor mark, licence not stated |
| ACP | `packages/agent-acp/icon.svg` | the ACP logo, in black | `packages/agent-acp/icon-dark.svg`, in white | https://github.com/agentclientprotocol/agent-client-protocol/tree/main/docs/logo | Apache 2.0 |
| Claude | `packages/agent-claude/icon.svg` | the Claude starburst, in `#D97757` | none | https://cdn.simpleicons.org/claude | CC0 1.0, from Simple Icons |
| Cofold | `packages/agent-cofold/icon.svg` | `layers` | `packages/agent-cofold/icon-dark.svg` | https://lucide.dev/icons/layers | ISC |
| pi | `packages/agent-pi/icon.svg` | the pi.dev mark | none | https://pi.dev/logo-auto.svg | vendor mark, licence not stated |
| Bot | `packages/bot/icon.svg` | `bot` | `packages/bot/icon-dark.svg` | https://lucide.dev/icons/bot | ISC |
| Computer | `packages/computer/icon.svg` | `container` | `packages/computer/icon-dark.svg` | https://lucide.dev/icons/container | ISC |
| Push | `packages/push/icon.svg` | `bell-ring` | `packages/push/icon-dark.svg` | https://lucide.dev/icons/bell-ring | ISC |
| Tasks | `packages/tasks/icon.svg` | `list-checks` | `packages/tasks/icon-dark.svg` | https://lucide.dev/icons/list-checks | ISC |
| Dev Tunnel | `packages/tunnel-devtunnel/icon.svg` | `waypoints` | `packages/tunnel-devtunnel/icon-dark.svg` | https://lucide.dev/icons/waypoints | ISC |
| Webhook | `packages/webhook/icon.svg` | `webhook` | `packages/webhook/icon-dark.svg` | https://lucide.dev/icons/webhook | ISC |

Lucide has no `tunnel` icon, so the Dev Tunnel candidate is `waypoints`, which draws a path between points.
Cofold keeps a Lucide drawing until you give a vendor mark.
The Activepieces mark, the Claude starburst and the pi mark are the vendors' trademarks, and a package ships them under the vendor's terms.

## Reply

Write "keep" or "replace" for each row, or what you want instead.
