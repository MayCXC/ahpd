---
title: Curate the icon of each plugin in this repository
plans:
  - plans/plugin/58-plugins-and-adapters-carry-icons/plan.md
---

# Curate the icon of each plugin in this repository

Plan 58 task 05 gives each plugin in this repository one SVG icon.
Eight candidates come from Lucide, which publishes its icons under the ISC licence, and each of those files keeps its licence comment.
The Activepieces, Claude and pi candidates are the vendors' own marks, after the first Lucide choices looked wrong.
Every file is under 32 KB, and none carries a script or an event attribute.
The Lucide files are stroke drawings in `currentColor`, so a client draws them in the colour the theme gives it.
The webhook adapter names the same file as its plugin.

Each candidate is in place already, so a plugin shows it at the next start.
Replace a candidate that you reject with the SVG you want, at the same path.
Nothing else changes, because the manifest of each package names the file, not the drawing in it.

| Plugin | File | Candidate | Source | Licence |
| --- | --- | --- | --- | --- |
| Activepieces | `packages/activepieces/icon.svg` | the Activepieces mark, in `#8142E3` | https://github.com/activepieces/activepieces/blob/main/docs/favicon.svg | vendor mark, licence not stated |
| ACP | `packages/agent-acp/icon.svg` | `plug` | https://lucide.dev/icons/plug | ISC |
| Claude | `packages/agent-claude/icon.svg` | the Claude starburst, in `#D97757` | https://cdn.simpleicons.org/claude | CC0 1.0, from Simple Icons |
| Cofold | `packages/agent-cofold/icon.svg` | `layers` | https://lucide.dev/icons/layers | ISC |
| pi | `packages/agent-pi/icon.svg` | the pi.dev mark | https://pi.dev/logo-auto.svg | vendor mark, licence not stated |
| Bot | `packages/bot/icon.svg` | `bot` | https://lucide.dev/icons/bot | ISC |
| Computer | `packages/computer/icon.svg` | `container` | https://lucide.dev/icons/container | ISC |
| Push | `packages/push/icon.svg` | `bell-ring` | https://lucide.dev/icons/bell-ring | ISC |
| Tasks | `packages/tasks/icon.svg` | `list-checks` | https://lucide.dev/icons/list-checks | ISC |
| Dev Tunnel | `packages/tunnel-devtunnel/icon.svg` | `waypoints` | https://lucide.dev/icons/waypoints | ISC |
| Webhook | `packages/webhook/icon.svg` | `webhook` | https://lucide.dev/icons/webhook | ISC |

Lucide has no `tunnel` icon, so the Dev Tunnel candidate is `waypoints`, which draws a path between points.
Cofold keeps a Lucide drawing until you give a vendor mark.
The Activepieces mark, the Claude starburst and the pi mark are the vendors' trademarks, and a package ships them under the vendor's terms.

## Reply

Write "keep" or "replace" for each row, or what you want instead.
