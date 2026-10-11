---
title: A bot's colour is one of the eleven names or a hex colour
status: accepted
date: 2026-10-10
refs:
  - "[code://packages/bot/src/record.ts#L43-L47](../../packages/bot/src/record.ts#L43-L47) - `BOT_COLORS`, the eleven names a write takes today"
  - "[code://packages/bot/src/record.ts#L220](../../packages/bot/src/record.ts#L220) - where a write's `color` is checked"
---

## Context

ahpapp draws a bot from a palette of hex colours, and lets a person pick one.
The host takes only eleven colour names, so a hex colour from ahpapp is refused `-32602`.
The two lists are not the same: ahpapp has white, and the host has black.

## Decision

A bot's `color` is one of the eleven names, or a hex colour written `#rrggbb`.
The host keeps a hex colour in lowercase, and a client draws it as it is.

Source: Softov, 2026-10-10, to "The host stores a colour name and refuses a hex. How should the app handle colour?" - "ahpd takes a hex".

## Consequences

ahpapp keeps its own palette and writes the hex colour a person picked.
A record made with a name keeps it, so no stored bot changes.
A client that draws a bot has to read a name or a hex colour.

## Options

- The app maps the host's names to its own hex colours. This lost because the app's palette would have to lose white.
- The host adds `white` to the names. This lost because each new colour in a client would need a host change again.
