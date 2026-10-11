---
title: ahpd says it is a native host, and keeps its session URIs
status: accepted
date: 2026-10-11
refs:
  - "[code://packages/sdk/src/host/handshake.ts#L267-L297](../../packages/sdk/src/host/handshake.ts#L267-L297) - the initialize `_meta` that gets `vscode.ahpSessionUris`"
  - "[code://packages/sdk/src/host/root.ts#L436-L495](../../packages/sdk/src/host/root.ts#L436-L495) - the root `_meta` that gets `hostBuild`"
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/meta/vscode/agentHostSessionUrisMeta.ts - `isNativeAgentHost`, true when `hostBuild.version` is set
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/agentHostExtensionProtocol.ts - VS Code's host sends both keys
---

## Context

VS Code reads root `_meta.hostBuild` to write the host's version in its Output channel.
The same key marks the host as native, and a native host gets legacy `provider:/id` session URIs unless initialize `_meta` says `vscode.ahpSessionUris: true`.
`hostBuild` is VS Code's own key and is not in the protocol.

## Decision

ahpd sends root `_meta.hostBuild` with its version, and it sends initialize `_meta['vscode.ahpSessionUris']: true` in the same change.
Source: Softov, 2026-10-11, to "Should ahpd send _meta.hostBuild, identifying itself as a native host?" - "Yes, with ahpSessionUris".

## Consequences

VS Code treats ahpd as it treats its own host, including the fallbacks it keeps for native hosts.
The two keys must never be split: `hostBuild` without `vscode.ahpSessionUris` breaks every session URI.
A later VS Code change to what native means reaches ahpd, and an UPSTREAM.md pass must check it.

## Options

- Stay a host that is not native and send neither key. It loses only the version line, and it lost to parity with VS Code's own host.
