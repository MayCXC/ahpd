---
title: A plugin icon has a dark variant - implemented
date: 2026-10-24
refs:
  - git://a8ac11e2
  - "[code://packages/webhook/src/adapter.ts](../../../../packages/webhook/src/adapter.ts)"
  - "[code://packages/server/test/plugin-icons.test.ts](../../../../packages/server/test/plugin-icons.test.ts)"
---

The eight plugins with a Lucide icon now ship one icon for a light background and one for a dark background. A client picks the icon whose `theme` matches its scheme, so the icons no longer draw black on a dark background.

## What was built

- `icon.svg` in agent-acp, agent-cofold, bot, computer, push, tasks, tunnel-devtunnel and webhook - strokes in `#1F2328`, with `theme: "light"`.
- `icon-dark.svg` in the same eight packages - strokes in `#E6EDF3`, with `theme: "dark"`.
- Each `package.json` names both icons in `ahpd.icons` and lists `icon-dark.svg` in `files`.
- [`code://packages/webhook/src/adapter.ts`](../../../../packages/webhook/src/adapter.ts) - the webhook adapter names the same two files.

## Verified

- [`code://packages/server/test/plugin-icons.test.ts`](../../../../packages/server/test/plugin-icons.test.ts) finds one `light` and one `dark` icon for each of the eight.
- The gate passed: 415 test files and 6869 tests, with 1 file and 29 tests skipped.
- CI passed on #86, with `check-windows` and `install-windows`.
- Softov checked the eight icons in ahpw on a light and on a dark background on 2026-10-24.

## Departures from the plan

- none.

## Left for later

- none.
