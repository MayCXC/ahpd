---
title: The scheduled automation store lives in the server
status: accepted
date: 2026-10-11
refs:
  - "[code://packages/sdk/src/scheduled.ts#L99](../../packages/sdk/src/scheduled.ts#L99) - `scheduledAutomations`, the clock and the file in one store"
  - "[code://packages/server/src/commands/run.ts#L654-L661](../../packages/server/src/commands/run.ts#L654-L661) - the one place that makes it"
---

## Context

`scheduledAutomations` is in the sdk, and it holds the clock and the file together.
Its file becomes a folder of Markdown files, which needs YAML.
YAML lives in the server.

## Decision

`scheduledAutomations` moves from `@ahpd/sdk` to `@ahpd/server`.
The sdk keeps the `AutomationStore` port and `memoryAutomations`.

Source: Softov, 2026-10-11, to "With YAML in server, how does the sdk's scheduler get its definitions?" - "Move the store to server".

## Consequences

The store is one layer, in the one package that makes it.
A program that embeds the sdk and wants scheduled automations writes its own store, because the server package exports no library.
`docs/LIBRARY.md` stops showing `scheduledAutomations` from the sdk.

## Options

- **The sdk keeps the clock and takes a typed hook for the definitions.** Rejected: two layers for one store that one package makes.
