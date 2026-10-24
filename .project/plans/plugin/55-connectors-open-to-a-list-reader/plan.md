---
title: The connectors channel opens to a list reader, and a receive capability names its path
domain: plugin
status: built
priority: medium
created: 2026-10-22
revalidated: 2026-10-22
requires:
  - plans/plugin/53-a-client-sees-plugins-and-connectors/plan.md
  - plans/plugin/54-a-webhook-takes-what-real-senders-send/plan.md
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/connectors/channel.ts#L216-L233](../../../../packages/sdk/src/connectors/channel.ts#L216-L233) - `mayRead` and the channel's gate, `connector:all`"
  - "[code://packages/sdk/src/resources/recordschannel.ts#L114-L115](../../../../packages/sdk/src/resources/recordschannel.ts#L114-L115) - `readable`, where a holder of the gate grant reads every row"
  - "[code://packages/sdk/src/resources/recordschannel.ts#L249-L262](../../../../packages/sdk/src/resources/recordschannel.ts#L249-L262) - `authorize`, which admits a reader only when it reads one row"
  - "[code://packages/sdk/src/host/root.ts#L465-L477](../../../../packages/sdk/src/host/root.ts#L465-L477) - `advertisedChannels`, which names each channel's gate grant"
  - "[code://packages/sdk/src/access/users.ts#L179-L184](../../../../packages/sdk/src/access/users.ts#L179-L184) - the `connector` subject, where `all` does not hold `list`"
  - "[code://packages/sdk/src/types/connectors.ts#L25-L45](../../../../packages/sdk/src/types/connectors.ts#L25-L45) - `Capability`, with no path"
  - "[code://packages/webhook/src/adapter.ts#L98-L103](../../../../packages/webhook/src/adapter.ts#L98-L103) - the webhook's receive capability, whose path is only in its description"
---

## Goal

A person with `connector:list` subscribes to `x-ahpd-connectors` and sees an empty list before they make a connector.
The handshake and a refusal name `connector:list`, the grant that opens the channel.
A receive capability names the path where its connectors receive, so a client shows and copies a connector's URL.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.
The three asks came from the ahpw builder against `13b19150`.

### Searches performed

- `rg -n "authorize" packages/sdk/src/resources/recordschannel.ts` - a reader without the gate grant gets in only through a readable row.
- `rg -n "advertisedChannels" packages/sdk/src/host` - the handshake lists every channel to every reader, with its gate grant.
- `rg -n "receive" packages/sdk/src/types/connectors.ts packages/webhook/src` - no capability field carries a path.

### Runtime path

```
subscribe x-ahpd-connectors -> admission: connector:list, or authorize for connector:all
  -> snapshot: every row mayRead allows, an empty list included
handshake -> ahpd.channels: { scheme, title, grant: connector:list }
x-ahpd-adapters -> capability { type: receive, path: /plugins/webhook/{id} }
```

### Gaps

- A `connector:list` holder with no readable row is refused the subscription.
- The handshake and the refusal name `connector:all`, which a person making their own connector does not hold.
- A client cannot build a connector's URL from the adapter's description.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Plan the three ahpw asks as plan 55, built after plan 54 merges | Softov, 2026-10-22, chose "New plan 55, after 54" | all |
| The handshake stays one catalog for every reader; the advert and the refusal name `connector:list` | Softov, 2026-10-22, chose "Name connector:list" | 01 |
| A `connector:list` holder with no readable row gets an empty snapshot | ahpw builder's ask, 2026-10-22 | 01 |
| The channel's gate grant becomes `connector:list`, and `mayRead` filters the rows of every reader | (defaulted: one change answers the empty list, the advert and the refusal) | 01 |
| A role with `connector:all` and no `connector:list` still subscribes, through `authorize` | (defaulted: `connector:all` does not hold `connector:list`, and it must keep reading every row) | 01 |
| The people channel keeps its gate, where the grant reads every row | (defaulted: only the connectors channel asks for the filter) | 01 |
| A receive capability may carry `path`, relative to the daemon's HTTP root, with `{id}` for the connector id | ahpw builder's ask, 2026-10-22 | 02 |
| The webhook's receive capability says `/plugins/webhook/{id}`, and its description stops naming the bearer token | (defaulted: plan 54 adds the other auth schemes) | 02 |

## Proposed architecture

- **Data flow** - the connectors channel's rows pass through `mayRead` for every reader, and `mayRead` answers `true` for `connector:all`.
- **Event flow** - none new.
- **State flow** - nothing stored changes.
- **Layer responsibilities** - sdk: the records channel's filter option, the connectors gate and the `path` field.
  webhook: its capability. docs: the grant, the field and the changelog.
- **Source-of-truth files** - [`code://packages/sdk/src/connectors/channel.ts`](../../../../packages/sdk/src/connectors/channel.ts), [`code://packages/sdk/src/types/connectors.ts`](../../../../packages/sdk/src/types/connectors.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The connectors channel opens to a list reader](task-01-the-channel-opens-to-a-list-reader.md) | done | - |
| [02 - A receive capability names its path](task-02-a-receive-capability-names-its-path.md) | done | - |
| [03 - The docs say the grant and the path](task-03-the-docs-say-the-grant-and-the-path.md) | done | 01, 02 |

## Risks and tradeoffs

- A client that read `connector:all` from the advert to show the channel now reads `connector:list`.
  The changelog says so.

## Resume state

- **Done so far:** tasks 01, 02 and 03 are implemented. The connectors channel opens with `connector:list`, filters every reader's rows through `mayRead`, and admits a `connector:all` holder without `connector:list`; an empty store reads as an empty list. `Capability` has an optional `path`, refused at registration on any type but `receive` and where it does not start with `/`, and the webhook's receive capability names `/plugins/webhook/{id}`. The docs and the changelog say the grant and the field.
- **Next action:** none. The plan is built.
- **Open questions:** none.
- **Watch out for:** `packages/sdk/test/fixtures/wire.jsonl` is rewritten by every test run and was restored with `git checkout`; the work is uncommitted, and the session cannot commit it.

## Final verification checklist

- [ ] A `connector:list` holder on an empty store subscribes and reads an empty list.
- [ ] A reader with neither grant is refused, and the refusal names `connector:list`.
- [ ] The handshake's `ahpd.channels` names `connector:list` for `x-ahpd-connectors`.
- [ ] `x-ahpd-adapters` shows the webhook's receive capability with `path: /plugins/webhook/{id}`.
- [ ] `plans/index.md` updated.
