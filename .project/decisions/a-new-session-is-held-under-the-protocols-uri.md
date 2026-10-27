---
title: A new session is held as `ahp-session:/<id>`, and an existing session keeps its `<provider>:/<id>` name
status: accepted
date: 2026-10-27
supersedes: decisions/a-session-is-held-under-its-providers-name.md
refs:
  - "[code://packages/sdk/src/host/sessionmethods.ts#L942](../../packages/sdk/src/host/sessionmethods.ts#L942) - `createSession`, which today rewrites the client's channel to `<provider>:/<id>`"
  - "[code://packages/sdk/src/host/channels.ts](../../packages/sdk/src/host/channels.ts) - `named`, which cites the superseded decision"
  - git://8c1b62e5 - the last commit that holds the superseded decision
  - https://github.com/microsoft/agent-host-protocol/blob/main/docs/specification/session-channel.md - the provider is not encoded in the session URI's scheme
  - https://github.com/microsoft/vscode/commit/bd64649be19 - VS Code makes new sessions `ahp-session:/<uuid>` and reads the provider from the session's metadata
---

## Context

ahpd holds every session as `<provider>:/<id>`, because VS Code read a session's provider from the URI's scheme and could not open an `ahp-session:` session.
The protocol says the opposite: a session URI does not carry the provider, and the provider is on `SessionSummary.provider`.
On 2026-10-05, VS Code `bd64649be19` made its own new sessions `ahp-session:/<uuid>`. Its scheme reading is now a legacy fallback that returns nothing for `ahp-session`.
So the reason for the provider's name is gone, and the name now disagrees with both the protocol and VS Code.

## Decision

Every new session that ahpd makes is held as `ahp-session:/<id>`, and its provider comes from its stored provider, never from its URI.
A session that already exists keeps the `<provider>:/<id>` name it has, as VS Code does.
A `createSession` on a `<provider>:/<uuid>` channel still works, and the session keeps that URI as its name.

Source: Softov, 2026-10-27, in `ahp-review/briefs/session-uris.md`, and his agreement to replace the old decision, 2026-10-27.

## Consequences

A session ahpd makes reads the same in ahpd, VS Code and the protocol's examples.
The host stores each session's URI in its row, so a name survives a restart.
Every place that reads a provider from a scheme reads the stored provider instead.
Tests that expect `<provider>:/<id>` for a new session need new expectations.

## Options

- Keep `<provider>:/<id>` for new sessions: lost, because VS Code no longer needs it, and it keeps ahpd against the protocol.
- Rename every existing session to `ahp-session:`: lost, because clients, chat titles and links hold the old names, and VS Code keeps old names too.
