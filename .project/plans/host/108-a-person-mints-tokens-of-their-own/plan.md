---
title: A person mints tokens of their own
domain: host
status: draft
priority: medium
created: 2026-10-18
revalidated: 2026-10-18
requires: []
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/users.ts#L890-L900](../../../../packages/sdk/src/users.ts#L890-L900) - `verify`, which compares a token with the one hash on each record"
  - "[code://packages/sdk/src/users.ts#L1142-L1151](../../../../packages/sdk/src/users.ts#L1142-L1151) - `mint`, which replaces a person's one hash"
  - "[code://packages/sdk/src/users.ts#L853](../../../../packages/sdk/src/users.ts#L853) - `can`, where a principal's grants are read"
  - "[code://packages/sdk/src/types/users.ts#L124-L133](../../../../packages/sdk/src/types/users.ts#L124-L133) - `UserRecord.token`, one hash per person"
  - "[code://packages/server/src/commands/user.ts#L218-L240](../../../../packages/server/src/commands/user.ts#L218-L240) - `user token`, which needs `user:write` and is bounded by the caller's grants"
  - "[code://packages/server/src/proxy/listener.ts#L371-L385](../../../../packages/server/src/proxy/listener.ts#L371-L385) - `policyFor`, the proxy's check of a caller"
---

## Goal

A signed-in person mints tokens for their own use, over their connection.
Each token holds a subset of the person's grants, such as `proxy:write` alone for a laptop.
A person holds several tokens, up to a limit the host sets.
A person lists and revokes their own tokens.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Runtime path

```
person signs in -> token mint (grants, label) -> secret shown once -> hash on the record -> a call with the secret -> verify finds the token -> principal with the token's grants only
```

### Gaps

- A record holds one hash, and a mint replaces it.
- Only a caller with `user:write` mints, and the token has every grant of the person.
- A principal has no grants narrower than its person's.
- There is no list of tokens, no label, no expiry and no revoke of one token.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A person mints tokens over their connection, more than one each | Softov, 2026-10-18, "the user be able to generate as many as wanted (or like limited to host key...)" | - |
| A token holds all of the person's grants or a subset of them | Softov, 2026-10-18, "All access or a refined set of access?" | - |
| A token can be limited to proxy calls and used on another computer | Softov, 2026-10-18, "a user could generate a token that only make proxy calls. and use on its computer" | - |
| A token never holds a grant its person does not hold | (defaulted: the same rule as a bot in plugin 52 p10, "the bot can't do more than its owner") | - |

## Resume state

- **Done so far:** draft written 2026-10-18. No tasks yet.
- **Next action:** ask the open questions, then write the tasks.
- **Open questions:**
  1. The limit on tokens per person - proposed: a host key, `tokensPerPerson`, default 10.
  2. Does a token end - proposed: an optional expiry at mint, and no expiry by default.
  3. Can the operator list and revoke a person's tokens - proposed: yes, with `user:write`, bounded as `user token` is.
  4. Does a token keep a grant its person loses - proposed: no, each check reads the grants both of them hold.
  5. Does the existing one token per record stay - proposed: yes, as the person's full token, so no users file changes.
- **Watch out for:** a token's secret is shown once and kept only as its hash, like `mint` today. `verify` compares every hash, so the time it takes does not tell which one matched.
