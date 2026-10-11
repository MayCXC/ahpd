---
title: A chat is attached to a message
domain: host
status: draft
priority: low
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/host/83-the-host-matches-vscodes-host-p1-the-host-describes-itself/plan.md
refs:
  - "[code://packages/sdk/src/host/sessionmethods.ts#L441](../../../../packages/sdk/src/host/sessionmethods.ts#L441) - the completions command"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostChatCompletionProvider.ts - `#chat:<title>` and the `chat` attachment
---

## Goal

`#chat:` completes another chat's title, and a message that attaches a chat gives the agent that chat's transcript.

## Reconnaissance

### Gaps

- The host has no `chat` attachment, and no way to put another chat's transcript in a prompt.

## Tasks

None yet; the plan waits on the open question.

## Resume state

- **Done so far:** nothing.
- **Next action:** ask Softov the open question.
- **Open questions:**
  1. Is `#chat:` built now, or after the release? - proposed: after p1 to p3.
- **Watch out for:** a chat in another session may be one the sender cannot read; the gate must check it.
