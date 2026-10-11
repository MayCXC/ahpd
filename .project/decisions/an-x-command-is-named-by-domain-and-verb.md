---
title: An x- command is named x-ahpd/<domain>/<verb>
status: accepted
date: 2026-10-11
refs:
  - "[code://packages/sdk/src/host/gate.ts#L90-L92](../../packages/sdk/src/host/gate.ts#L90-L92) - `vscode/devContainers/connect`, the shape this follows"
  - "[code://.project/decisions/a-plugin-channel-is-an-x-scheme.md](a-plugin-channel-is-an-x-scheme.md) - the `x-` prefix for extension names"
---

## Context

The host and its plugins will serve commands that the protocol does not define.
VS Code names its own as `vscode/<area>/<verb>`, such as `vscode/devContainers/connect`.
The protocol names its own as one camel-case word, such as `resourceRead`.

## Decision

For now, a command is named `x-ahpd/<domain>/<verb>`, such as `x-ahpd/usage/totals` and `x-ahpd/users/put`.
The domain is plural and is the same word as the domain's channel, such as `x-ahpd-users://`.

Source: Softov, 2026-10-11, to "How should the x- commands be named?" - "x-ahpd/<domain>/<verb>".

## Consequences

A client groups the commands by domain from the name alone.
A name keeps the `x-` prefix, so a later protocol command cannot take it.

## Options

- **`x-ahpd/<verbDomain>`, such as `x-ahpd/usageTotals`.** Rejected: the name does not show its domain as a separate part.
