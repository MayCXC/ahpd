---
title: A plugin keeps its records in the host's record store, and the bot keeps its records there - implemented
date: 2026-10-11
refs:
  - git://cd1fbb9 - the last commit of p2, released in 0.11.0
  - "[code://packages/server/src/records.ts](../../../../packages/server/src/records.ts) - `fileRecords`, the daemon's record store"
  - "[code://packages/bot/src/store.ts](../../../../packages/bot/src/store.ts) - the bot store over two collections"
---

A plugin opens a record collection through the host, and the daemon keeps each record as a Markdown file in `<configDir>/<collection>/<id>.md`.
The bot plugin is the first one to use it: each bot is a file that a person can edit.

## What was built

- p1: the record store. See [its implemented.md](../45-a-plugin-keeps-records-in-the-host-store-p1-the-host-gives-a-record-store/implemented.md).
- p2: the bot store on top of it. See [its implemented.md](../45-a-plugin-keeps-records-in-the-host-store-p2-the-bot-keeps-its-records-there/implemented.md).

## Verified

- Each child plan's checklist passes.
- The five real bots converted when the daemon restarted on 2026-10-11.

## Departures from the plan

- none.

## Left for later

- none.
