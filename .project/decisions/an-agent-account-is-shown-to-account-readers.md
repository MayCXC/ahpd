---
title: An agent account, email included, is shown to the holders of account:read
status: accepted
date: 2026-10-16
refs:
  - "[code://packages/sdk/src/host.ts#L570-L593](../../packages/sdk/src/host.ts#L570-L593) - the overlay per connection on `root/configChanged`, which the filter joins"
  - "[code://packages/sdk/src/host/gate.ts#L355-L356](../../packages/sdk/src/host/gate.ts#L355-L356) - `seesConfig`, the check this one sits beside"
  - "[code://packages/sdk/src/users.ts#L43-L61](../../packages/sdk/src/users.ts#L43-L61) - the subjects, where `account` goes"
  - "[code://packages/agent-claude/src/probe.ts#L49-L107](../../packages/agent-claude/src/probe.ts#L49-L107) - the probe that reads the account"
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/meta/vscode/codexAccount.ts#L37-L50 - `ICodexAccountInfo`, with `email`
---

## Context

Plan `host/99` publishes the account each agent bills to, as a root config value shaped like VS Code's `vscode.codexAccount`.
That account is the operator's: the email and the plan of the CLI that the daemon runs.
The root state is readable before a sign-in, so a remote guest would read the operator's email.
Decision [a role refuses at the dispatch boundary, and never hides root state](a-role-refuses-at-the-dispatch-boundary.md) says root state is not filtered.

## Decision

The account, email included, goes to a connection that is root or holds `account:read`, and to no other.
A connection without the grant gets no account value at all.
The filter is an overlay per connection on the root config, as the daemon keys already have, with no second `serverSeq`.

## Consequences

- A client with the grant can show who a session bills to, as VS Code's account menu does.
- The root state has one more value that differs per connection, and the snapshot and each `root/configChanged` must both filter it.
- A role that should see the account needs `account:read` in its grants.

## Options

- **The plan and the state only, with no email.** Lost: the email tells a person which account it is. The grant already limits who reads it.
- **The `config:settings` grant of the daemon keys.** Lost: a person who may read the settings is not always one who may see the operator's email.
- **Root only.** Lost: a signed-in member on another machine has a real need to see the account.
