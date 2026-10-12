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

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| `#chat:` is built after p1 to p3 | Softov, 2026-10-11, to "When should #chat: be built?" - "After p1 to p3" | - |

## Tasks

None yet; the tasks are written after p1 to p3 are built.

## Resume state

- **Done so far:** nothing.
- **Next action:** write the tasks once p1 to p3 are built.
- **Open questions:** none.
- **Watch out for:** a chat in another session may be one the sender cannot read; the gate must check it.
