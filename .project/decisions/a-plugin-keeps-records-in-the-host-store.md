---
title: A plugin keeps its records in a record store the host gives it
status: accepted
date: 2026-10-11
refs:
  - "[code://packages/bot/src/store.ts#L24-L35](../../packages/bot/src/store.ts#L24-L35) - `BotStore`, a store only the bot plugin can see"
  - "[code://packages/sdk/src/types/plugin.ts#L522-L588](../../packages/sdk/src/types/plugin.ts#L522-L588) - the ports a plugin can replace with `'replace'`"
---

## Context

The bot plugin keeps each bot as a file it writes itself.
The computer plugin keeps `computers.json` the same way.
A sqlite or postgresql plugin can replace each host port, but it cannot replace a store that is private to a plugin.
When a plugin writes its own files, the plugin also chooses the file format.

## Decision

The host gives each plugin a record store: named collections of JSON records, with get, list, find, put, remove and watch.
The record store is a port, and a plugin replaces it with `registerRecords(store, 'replace')`.
The daemon's default record store is in `server`, and it keeps each record as one Markdown file with YAML frontmatter.
A plugin keeps records, and it never chooses a file or a format.

Source: Softov, 2026-10-11: "Plugin should had a store like get, list, find, store, save, etc. ... So I could like plug a postgresql plugin or a sqlite one and store some information"; then to "Should I rework the plans around a host-given record store for plugins?" - "Yes, plan the repository".

## Consequences

A sqlite or postgresql plugin moves the records of every plugin when it replaces one port.
The Markdown file that a person edits is a property of the default record store, not of the bot plugin.
The record store is asynchronous, so a plugin store that answers at once today must wait for it.
The computer plugin can move `computers.json` into the record store later.

## Options

- **Each plugin writes its own files.** Rejected: a database plugin cannot replace them, and the plugin chooses the format.
- **A byte store under each host port.** Rejected: it says where bytes are, not what a record is.
