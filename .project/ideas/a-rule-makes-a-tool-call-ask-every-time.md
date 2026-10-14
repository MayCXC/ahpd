---
title: A rule makes a tool call ask every time
created: 2026-10-14
---

Some tools should ask a person on every call, whatever was allowed before.
Examples are a call that writes to a tracker, sends a message or moves money.
A rule names a server and a tool by glob, and may name fields the call must fill, such as its targets.
A matching call always asks; a remembered allow and the permission mode do not apply, and the card offers no "always".

This goes against [each backend offers its own approval options](../decisions/each-backend-offers-its-own-approval-options.md), which says the host remembers no approvals.
So a plan starts with a decision that amends it.
Policy kinds today are `model`, `agent` and `computer` ([`code://packages/sdk/src/types/policies.ts`](../../packages/sdk/src/types/policies.ts)); the rule is either a `tool` kind there or a config key.

Claude can enforce it with a `PreToolUse` hook on `mcp__.*` that waits for the person's answer, so it cannot be bypassed.
An ACP agent decides itself whether to ask, so the host can enforce the rule only for the MCP tools it serves.

Related: [terminal commands approved by rule](terminal-commands-approved-by-rule.md), the opposite case, where a rule lets a command run without asking.
