---
title: Users, teams, projects, roles, policies, computers and usage get typed channels and commands
domain: host
status: built
priority: high
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/plugin/44-a-plugin-serves-a-channel/plan.md
decisions:
refs:
  - "[code://packages/sdk/src/records.ts](../../../../packages/sdk/src/records.ts) - the provider the people and policy schemes share"
  - "[code://packages/sdk/src/usage.ts#L570](../../../../packages/sdk/src/usage.ts#L570) - `usageProvider`, the `usage:` scheme"
  - "[code://packages/computer/src/provider.ts#L137](../../../../packages/computer/src/provider.ts#L137) - `computerProvider`, the `computer:` scheme"
  - "[code://packages/bot/src/catalogue.ts](../../../../packages/bot/src/catalogue.ts) - the bot catalogue, the channel shape every list here mirrors"
---

## Goal

A client reads users, teams, projects, roles, policies and computers as typed lists, and it hears each change.
It changes them and reads usage through typed `x-` commands.
The resource schemes stay as they are, so a client that knows only the protocol still reads them.

## Reconnaissance

### Searches performed

- `rg -n "registerMethod" packages .project` - no plugin can serve a command; the domain reference lists it as not planned.
- `rg -n "peopleProviders|policyProviders|usageProvider" packages/server/src` - the daemon registers the people, policy and usage schemes in `run.ts`.
- `rg -n "channels" packages/sdk/src/types/host.ts packages/sdk/src/plugins.ts` - `HostOptions.channels` takes a channel from the daemon as well as from a plugin.
- `rg -n "ownRecord" packages/sdk/src/host/admission.ts` - a person reads their own `user://<id>` with no grant.
- `rg -ln "user://|usage://|computer://" /github/ahpapp/src` - ahpapp reads all three; ahpc reads none.

### Runtime path

```
client subscribe x-ahpd-users:// -> host -> served channel -> snapshot { records }
client x-ahpd/users/put -> host -> served method -> grant or authorize -> Records.put -> channel refresh -> added or changed
client x-ahpd/usage/totals -> host -> served method -> usage authorize -> Usage.total -> typed answer
```

### Gaps

- A plugin cannot serve a command, and the daemon has no table of extension commands.
- A record list has no channel, so a client lists, reads each record, and hears no change.
- A usage query packs its range into a URI.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | Host records get typed channels and commands beside their resource schemes | Softov, 2026-10-11 |
| 2 | [A plugin serves an x- command with registerMethod](../../../../docs/plugins/PLUGINS.md) | Softov, 2026-10-11 |
| 3 | [An x- command is named x-ahpd/<domain>/<verb>](../../../../docs/plugins/PLUGINS.md) | Softov, 2026-10-11 |
| 4 | [Each people scheme has its own channel](../../../../docs/sdk/USERS.md) | Softov, 2026-10-11 |

| What | Source | Task |
| --- | --- | --- |
| Policies join this plan, with a channel and commands | Softov, 2026-10-11, to "Policies ... Do they join this plan?" - "Include policies" | p2 |
| Usage gets commands and no channel | decision 1 | p3 |
| The host lists served commands in `_meta['ahpd.methods']` | (defaulted: mirrors `_meta['ahpd.channels']`) | p1 |

## Proposed architecture

- **Data flow** - each list is a channel whose snapshot is `{ records }`, each record the object `resourceRead` answers for it.
- **Event flow** - a change through a command, a resource write or the users file refreshes the channel, which sends `added`, `changed` or `removed`.
- **State flow** - the store stays the record of truth; a channel keeps only which ids it sent to each client.
- **Layer responsibilities** - `packages/sdk`: the method table, `registerMethod`, the records channel and commands, the usage commands · `packages/server`: wires them in `run.ts` · `packages/computer`: its channel and commands.
- **Source-of-truth files** - [`code://packages/sdk/src/types/plugin.ts`](../../../../packages/sdk/src/types/plugin.ts), [`code://packages/sdk/src/records.ts`](../../../../packages/sdk/src/records.ts)

## Tasks

| Child plan | Status | Depends on |
| --- | --- | --- |
| [p1 - The host serves x- commands, and a plugin registers one](../81-host-records-get-channels-and-commands-p1-the-host-serves-x-commands/plan.md) | built | - |
| [p2 - People and policies are channels and commands](../81-host-records-get-channels-and-commands-p2-people-and-policies-are-channels/plan.md) | built | p1 |
| [p3 - Usage is read through commands](../81-host-records-get-channels-and-commands-p3-usage-is-read-through-commands/plan.md) | built | p1 |
| [p4 - Computers are a channel and commands](../81-host-records-get-channels-and-commands-p4-computers-are-a-channel/plan.md) | built | p1, p2 |

The ahpapp half is ahpapp's own plan, and it starts when p2 is built.

## Risks and tradeoffs

- Each domain keeps two paths to one store - each channel refreshes after a resource write too, and a test writes through each path.
- A policy file that a person edits by hand reaches no channel - the policy store has no watch, and a later plan gives it one.
- A computer that changes outside this daemon reaches no channel - p4 refreshes on its own events only, and says so in `COMPUTER.md`.

## Resume state

- **Done so far:** p1, p2, p3 and p4 are built and reviewed on 2026-10-11. [implemented.md](implemented.md) links each child, and [deferred.md](deferred.md) lists what waits.
- **Next action:** none in ahpd; the ahpapp half is ahpapp's own plan.
- **Open questions:** none.
- **Watch out for:** p2 and p4 copy the bot catalogue's per-client sets; a shared helper comes only if p4 needs the same code.

## Final verification checklist

- [x] Every child plan is built.
- [ ] ahpapp reads people, policies, computers and usage through the new paths.
- [x] `plans/index.md` updated.
