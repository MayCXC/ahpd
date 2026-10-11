---
title: Computers are a channel and commands
domain: host
status: planned
priority: high
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/host/81-host-records-get-channels-and-commands-p1-the-host-serves-x-commands/plan.md
  - plans/host/81-host-records-get-channels-and-commands-p2-people-and-policies-are-channels/plan.md
decisions:
  - decisions/host-records-are-typed-channels-beside-their-resource-schemes.md
  - decisions/a-plugin-serves-an-x-command.md
  - decisions/an-x-command-is-named-by-domain-and-verb.md
  - decisions/the-computer-is-an-object-a-person-manages.md
refs:
  - "[code://packages/computer/src/provider.ts#L270-L335](../../../../packages/computer/src/provider.ts#L270-L335) - `list` and `read`, which answer each machine's `status` and `state`"
  - "[code://packages/computer/src/provider.ts#L335-L430](../../../../packages/computer/src/provider.ts#L335-L430) - `write` and `remove`: create, the three states, and destroy"
  - "[code://packages/computer/src/plugin.ts#L1164](../../../../packages/computer/src/plugin.ts#L1164) - where the plugin registers `computer:`"
  - "[code://packages/computer/src/plugin.ts#L1027-L1160](../../../../packages/computer/src/plugin.ts#L1027-L1160) - the watch on each machine, and adoption at start"
  - "[code://packages/bot/src/plugin.ts#L40-L42](../../../../packages/bot/src/plugin.ts#L40-L42) - how the bot plugin binds its channel, the pattern this mirrors"
---

## Goal

A client subscribes to `x-ahpd-computers://` and holds every machine with its state, kept current.
It creates, starts, stops, restarts and removes a machine with typed commands.

## Reconnaissance

### Searches performed

- `rg -n "STATES" packages/computer/src/provider.ts` - a state write takes `running`, `stopped` or `restarted`.
- `rg -n "resourceRead|/state|/status" /github/ahpapp/src/computers.ts /github/ahpapp/src/components/ComputerDetail.tsx` - ahpapp reads `status`, `stats` and `capabilities`, and writes `state`.
- `rg -n "authorize" packages/computer/src/provider.ts` - the scheme has no `authorize`, so `computer:read` is the only rule.

### Runtime path

```
subscribe x-ahpd-computers:// -> recordsChannel over the runtime -> { records: [{ id, record: { state, status } }] }
x-ahpd/computers/stop { name } -> served method -> computer:put -> runtime.stop -> refresh -> changed
```

### Gaps

- No channel for machines, and no command; a machine that the plugin stops reaches no client until it reads again.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [Host records get typed channels and commands beside their resource schemes](../../../decisions/host-records-are-typed-channels-beside-their-resource-schemes.md) | Softov, 2026-10-11 |
| 2 | [A plugin serves an x- command with registerMethod](../../../decisions/a-plugin-serves-an-x-command.md) | Softov, 2026-10-11 |
| 3 | [An x- command is named x-ahpd/<domain>/<verb>](../../../decisions/an-x-command-is-named-by-domain-and-verb.md) | Softov, 2026-10-11 |
| 4 | [The computer is an object a person manages](../../../decisions/the-computer-is-an-object-a-person-manages.md) | the scheme stays as it is |

| What | Source | Task |
| --- | --- | --- |
| A record is `{ state, status }`, the two reads a list needs; `stats` and `capabilities` stay reads | (defaulted: `stats` changes each second, and `capabilities` is one for the host) | 01 |
| The commands are `create`, `start`, `stop`, `restart` and `remove` | (defaulted: one verb for each write the scheme takes) | 02 |
| `create`, `start`, `stop` and `restart` need `computer:put`; `remove` needs `computer:delete` | (defaulted: the grants the resource write and delete need now) | 02 |
| The channel refreshes on the plugin's own changes only, with no poll | (defaulted: no runtime event stream today) | 01 |

## Proposed architecture

- **Data flow** - the channel reads `runtime.list` and `runtime.inspect`, the same calls `list` and `read` make.
- **Event flow** - a command, a resource write, a resource remove, an adoption and each change the machine watch makes call `refresh`.
- **State flow** - the runtime is the record of truth; the channel keeps the last record it sent.
- **Layer responsibilities** - `packages/computer`: the source, the channel, the commands and their wiring · `packages/sdk`: `recordsChannel`, from p2.
- **Source-of-truth files** - [`code://packages/computer/src/provider.ts`](../../../../packages/computer/src/provider.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The computer channel](task-01-the-computer-channel.md) | todo | - |
| [02 - The computer commands](task-02-the-computer-commands.md) | todo | 01 |
| [03 - The docs describe the channel and commands](task-03-the-docs.md) | todo | 02 |

## Risks and tradeoffs

- A machine that a person stops outside the daemon reaches no channel until the next refresh - `COMPUTER.md` says so.
- `status` holds timestamps that a runtime may update - a `changed` goes out only when the JSON differs.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-computer-channel.md](task-01-the-computer-channel.md).
- **Open questions:** none.
- **Watch out for:** a create records the caller as the owner; the command passes the caller as the resource write does.

## Final verification checklist

- [ ] A client subscribes, creates a machine, stops it and removes it, and gets `added`, `changed` and `removed`.
- [ ] `pnpm exec vitest run packages/computer` passes.
- [ ] `plans/index.md` updated.
