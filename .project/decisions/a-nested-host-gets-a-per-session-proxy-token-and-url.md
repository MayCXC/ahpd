---
title: A nested host gets its machine's profile, and per session only the proxy token and URL
status: accepted
date: 2026-10-13
supersedes: decisions/a-nested-host-is-configured-by-the-machine-profile-only.md
refs:
  - "[code://packages/sdk/src/nested.ts#L50](../../packages/sdk/src/nested.ts#L50) - `NestedAsked`, which carries no env today"
  - "[code://packages/computer/src/plugin.ts#L679-L695](../../packages/computer/src/plugin.ts#L679-L695) - `nestedHost`, which starts the inner host"
---

## Context

A machine off this host reaches its models through this host's proxy, with a token minted for each session (container/05 p12).
The superseded decision let nothing beyond the machine's profile reach the inner host.
An ssh machine is listed and never made, so no machine maker can fill a profile need with the token.

## Decision

The inner host loads its plugin with its defaults and reads its configuration from the machine's profile, as before.
There is one exception: per session, the outer host sends an env with only the session's proxy token and the proxy URL.
The env goes by variable name, never in argv.
Source: Softov, 2026-10-13, asked "How does the token reach the inner host?": "Per-session env".

## Consequences

A machine still behaves the same whichever outer host starts a session in it, except for which proxy and token its model calls use.
The outer plugin's options still do not reach the inner host; they belong in cofold's configuration file, which [reaches the machine at a fixed target](cofold-config-reaches-a-machine-at-a-fixed-target.md).
`NestedAsked` and `nestedHost` gain `env`, and p12 task 02 refuses any other variable in it.

## Options

- **A profile need with `role: 'key'`, filled by the machine maker.** It keeps the old decision.
  But an ssh machine has no maker, so it would get no token.
