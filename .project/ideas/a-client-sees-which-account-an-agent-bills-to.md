---
title: A client sees which account an agent bills to
created: 2026-10-14
---

A client could show who a session bills to: the account the provider's CLI is signed in as.
Claude answers `claude auth status --json`; Codex reports it as `_auth/status_update` once `codex-acp` starts.
An agent that runs on an API key or a preset's environment answers `unavailable`.

The shape that fits this host is an `accountIdentity` member on `Agent`, beside `protectedResources` ([`code://packages/sdk/src/types/agent.ts`](../../packages/sdk/src/types/agent.ts)).
The host serves it as a scheme like `usage:`, with its own row in the gate.
The Claude probe goes in `agent-claude`; the ACP one needs a `close(graceMs)` for the spawned server.

Two things to settle before a plan:

- It shows the operator's email address to every client that may read it. That is a decision, and it needs its own scope or a role row.
- A probe takes a folder, because the CLI reads its config from there. Limit a folder a client sends to the served folders, or use the session's own folder. Otherwise a client with `file:get` makes the daemon start `claude` in any folder.
