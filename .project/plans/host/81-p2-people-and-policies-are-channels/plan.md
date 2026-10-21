---
title: People and policies are channels and commands
domain: host
status: built
priority: high
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/host/81-p1-the-host-serves-x-commands/plan.md
decisions:
refs:
  - "[code://packages/sdk/src/resources/records.ts#L162-L244](../../../../packages/sdk/src/resources/records.ts#L162-L244) - `recordsProvider`, whose write and remove the commands share"
  - "[code://packages/sdk/src/access/people.ts#L239-L240](../../../../packages/sdk/src/access/people.ts#L239-L240) - `peopleProviders`, the four people schemes"
  - "[code://packages/sdk/src/access/policy.ts#L151](../../../../packages/sdk/src/access/policy.ts#L151) - `policyProviders`, the policy scheme"
  - "[code://packages/bot/src/catalogue.ts](../../../../packages/bot/src/catalogue.ts) - per-client sets, `added`, `changed`, `removed` and `recompute`, which the records channel copies"
  - "[code://packages/sdk/src/host/admission.ts#L213-L231](../../../../packages/sdk/src/host/admission.ts#L213-L231) - `ownRecord`, a person reads their own `user://<id>`"
  - "[code://packages/sdk/src/types/users.ts#L351](../../../../packages/sdk/src/types/users.ts#L351) - `Users.watch`, the signal for a change to the users file"
  - "[code://packages/server/src/commands/run.ts#L550-L558](../../../../packages/server/src/commands/run.ts#L550-L558) - where the daemon registers the five schemes"
---

## Goal

Users, teams, projects, roles and policies are each a channel that holds every record a reader may read.
Each has a `put` and a `remove` command, with the same rules as a resource write.

## Reconnaissance

### Searches performed

- `rg -n "recordsProvider" packages/sdk/src` - the four people schemes and the policy scheme share one provider.
- `rg -n "watch" packages/sdk/src/types/users.ts packages/sdk/src/types/policies.ts` - the users port has a watch, and the policy port has none.
- `rg -n "ownRecord" packages/sdk/src/host` - only `user://<id>` is readable without the grant.

### Runtime path

```
subscribe x-ahpd-teams:// -> records channel -> snapshot { records: [{ id, record }] }
x-ahpd/teams/put { id, record } -> putRecord -> Records.put -> refresh -> x-ahpd-teams/added or changed
users file changes -> Users.watch -> refresh the four people channels
```

### Gaps

- No channel and no command for any of the five schemes.
- The provider's write rules are inside `recordsProvider.write`, so a command cannot reuse them.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [Host records get typed channels and commands beside their resource schemes](../81-host-records-get-channels-and-commands/plan.md) | Softov, 2026-10-11 |
| 2 | [Each people scheme has its own channel](../../../../docs/sdk/USERS.md) | Softov, 2026-10-11 |
| 3 | [An x- command is named x-ahpd/<domain>/<verb>](../../../../docs/plugins/PLUGINS.md) | Softov, 2026-10-11 |

| What | Source | Task |
| --- | --- | --- |
| Policies get a channel and commands | Softov, 2026-10-11, "Include policies" | 03 |
| A snapshot is `{ records: [{ id, record }] }`; `added` and `changed` carry `{ id, record }`, `removed` carries `{ id }` | (defaulted: the bot catalogue's shape, with the id beside a record that does not hold it) | 01 |
| The channels are `x-ahpd-users`, `x-ahpd-teams`, `x-ahpd-projects`, `x-ahpd-roles` and `x-ahpd-policies` | decision 3, plural domain | 03 |
| A channel needs `<scheme>:read`; `put` needs `<scheme>:put`; `remove` needs `<scheme>:delete` | (defaulted: the operations a resource write and delete need now) | 01, 02 |
| A reader without `user:read` sees only their own record in `x-ahpd-users://` | [code://packages/sdk/src/host/admission.ts#L213-L231](../../../../packages/sdk/src/host/admission.ts#L213-L231) | 03 |
| `put` takes `createOnly`, as a resource write does | [code://packages/sdk/src/resources/records.ts](../../../../packages/sdk/src/resources/records.ts) | 02 |

## Proposed architecture

- **Data flow** - a record is the object `Records.find` answers, and the channel sends it with its id.
- **Event flow** - a command, a resource write, a resource remove and `Users.watch` each call `refresh`.
  `refresh` reads the store, and sends what each client gained, changed and lost.
- **State flow** - the channel keeps the last record it sent for each id, and the ids sent to each client.
- **Layer responsibilities** - `packages/sdk`: `recordsChannel`, `recordsMethods`, `putRecord` and `removeRecord` · `packages/server`: wires the five in `run.ts`.
- **Source-of-truth files** - [`code://packages/sdk/src/resources/records.ts`](../../../../packages/sdk/src/resources/records.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A records channel keeps a reader's list current](task-01-a-records-channel.md) | done | - |
| [02 - A record is put and removed by command](task-02-records-commands.md) | done | 01 |
| [03 - The daemon serves the five channels and their commands](task-03-the-daemon-serves-the-five.md) | done | 02 |
| [04 - The docs describe the channels and commands](task-04-the-docs.md) | done | 03 |

## Risks and tradeoffs

- `refresh` reads every record at each change - the users file is one file, and a later store may answer a diff.
- A policy file edited by hand reaches no channel until the next change through the host - `POLICY.md` says so.
- `Users.watch` fires for the daemon's own write too - `refresh` compares each record with the last one sent, and sends nothing for a match.

## Resume state

- **Done so far:** tasks 01 to 04 are done, built and reviewed on 2026-10-11.
  [implemented.md](implemented.md) lists what was built and the departures, and [deferred.md](deferred.md) lists what waits.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the daemon opens its own `Users.watch` for the channels and closes it at `stopping`. A change to the users file refreshes the policy channel as well as the four people channels. A channel keeps its state per client id and person, and each send carries `to` and a `visible` test, because several people can share one client id.

## Final verification checklist

- [x] A client subscribes to each of the five, puts a record, and gets `added`.
- [x] A resource write to `team://x` reaches a subscriber of `x-ahpd-teams://`.
- [x] `pnpm exec vitest run packages/sdk packages/server` passes.
- [x] `plans/index.md` updated.
