---
title: An admin makes a bot for any owner, and the manifest names the host owner
domain: plugin
status: built
priority: high
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/plugin/37-a-bot-is-a-record-with-a-session/plan.md
decisions:
refs:
  - "[code://packages/bot/src/provider.ts#L281-L307](../../../../packages/bot/src/provider.ts#L281-L307) - `ownerFor`, which refuses another person's `user:` to everyone except root"
  - "[code://packages/bot/src/provider.ts#L224-L233](../../../../packages/bot/src/provider.ts#L224-L233) - `mayWrite`, which already reads `*:*` as the admin test"
  - "[code://packages/bot/src/provider.ts#L161-L184](../../../../packages/bot/src/provider.ts#L161-L184) - `MANIFEST`, where the owner property is described"
  - "[code://packages/bot/test/bot-provider.test.ts#L450-L490](../../../../packages/bot/test/bot-provider.test.ts#L450-L490) - the team and project owner tests to mirror"
---

## Goal

ahpapp's create screen lets a person pick whose a new bot is: their own, a team's, another user's, or the host's.
Today the host refuses another user's `user:` and the host's `root:` owner to everyone except the root connection.
An admin must be able to make a bot for any user, any team or project, and for the host.
The client must learn the host owner from the host.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "\*:\*" packages/bot/src` - `mayWrite` is the only admin test in the bot plugin.
- `rg "hostName" packages/bot/src` - the plugin passes `host.hostName` to the provider.

### Runtime path

```
resourceWrite bot://<slug> createOnly -> botProvider.write -> ownerFor -> record saved -> session started for the owner
```

### Gaps

- `ownerFor` has no admin path.
- The manifest does not say what the host's own owner is.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [The bot manifest names the host's own owner, so a client never builds it](../../../../docs/BOTS.md) | (defaulted: a client draws only what the host sends) |
| 2 | Any root owner is this host, whatever name follows it | Softov, 2026-10-11, "Any root:* is this host" |

| What | Source | Task |
| --- | --- | --- |
| An admin, a holder of `*:*`, may name any owner on a make: `user:`, `team:`, `project:` or the host's `root:<hostName>` | Softov, 2026-10-11, "so a admin can create a bot for a user" | 01 |
| The admin test is the `*:*` grant, the same as `mayWrite`, not a role name | Softov, 2026-10-11, "*:* better" | 01 |
| A host bot is seen by admins only, through `bot:get`, as today | Softov, 2026-10-11, "admins only" | - |
| An owner still cannot change on an edit | [code://packages/bot/test/bot-provider.test.ts#L333-L336](../../../../packages/bot/test/bot-provider.test.ts#L333-L336) | - |

## Proposed architecture

- **Data flow** - A make carries `owner`. `ownerFor` accepts any valid owner when the reader holds `*:*`. A non-admin keeps today's rules.
- **Layer responsibilities** - bot: the owner rule and the manifest · docs: the scheme page.
- **Source-of-truth files** - [`code://packages/bot/src/provider.ts`](../../../../packages/bot/src/provider.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - An admin names any owner](task-01-an-admin-names-any-owner.md) | done | - |

## Risks and tradeoffs

- A bot made for another user starts a session as that user - The admin already holds every grant, so this gives nothing new.
- plugin/45 moves the bot records into the host store - Both touch `provider.ts`, so the second to land rebases.

## Resume state

- **Done so far:** the plan is built and reviewed; see [implemented.md](implemented.md).
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** `mayWrite` and `ownerFor` both run on a make; keep the reader absent case open as it is.

## Final verification checklist

- [x] `pnpm vitest run packages/bot` passes.
- [x] `pnpm typecheck` passes.
- [x] `plans/index.md` updated.
