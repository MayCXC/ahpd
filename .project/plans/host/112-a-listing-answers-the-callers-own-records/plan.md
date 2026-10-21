---
title: A listing answers the caller's own records
domain: host
status: active
priority: medium
created: 2026-10-21
revalidated: 2026-10-21
refs:
  - "[code://packages/sdk/src/host/sessionmethods.ts#L836-L880](../../../../packages/sdk/src/host/sessionmethods.ts#L836-L880) - `listSessions`, which answers every row to every caller"
  - "[code://packages/sdk/src/host/catalogue.ts#L1068-L1077](../../../../packages/sdk/src/host/catalogue.ts#L1068-L1077) - `allRows`, the live and kept rows the listing pages over"
  - "[code://packages/sdk/src/types/sessions.ts#L199](../../../../packages/sdk/src/types/sessions.ts#L199) - `SessionStore.owner`, the owner of one session"
  - "[code://packages/sdk/src/host/snapshots.ts#L109-L114](../../../../packages/sdk/src/host/snapshots.ts#L109-L114) - the automations snapshot, which matches the channel name exactly"
  - "[code://packages/sdk/src/host/channels.ts#L15](../../../../packages/sdk/src/host/channels.ts#L15) - `AUTOMATIONS`, the channel name"
  - "[code://packages/sdk/src/resources/records.ts#L72-L103](../../../../packages/sdk/src/resources/records.ts#L72-L103) - `splitResource`, which already keeps the text after `?` as `query`"
  - "[code://packages/sdk/src/usage/usage.ts#L578](../../../../packages/sdk/src/usage/usage.ts#L578) - `usage`, the one scheme that reads a query, with `URLSearchParams`"
  - "[code://packages/sdk/src/utils/values.ts#L64-L65](../../../../packages/sdk/src/utils/values.ts#L64-L65) - `ownerOfPrincipal`, the owner a principal is"
  - "[code://packages/sdk/src/resources/recordschannel.ts#L165-L185](../../../../packages/sdk/src/resources/recordschannel.ts#L165-L185) - the records channel, which answers only its exact URI"
  - "[code://packages/sdk/test/sessions.test.ts](../../../../packages/sdk/test/sessions.test.ts) - the listing cases"
  - "[code://packages/sdk/test/host-snapshots.test.ts](../../../../packages/sdk/test/host-snapshots.test.ts) - the snapshot cases"
---

## Goal

A client such as the ahpw profile page wants the records the person owns.
Each listing already has its own way to ask, so a second listing for "mine" would double each one.
After this plan, a listing takes one filter, `owner=me`, and answers only the records whose owner is the caller.
This plan adds the filter in the sdk, to the session listing, the automations channel and the records channel.
[plugin 52](../../plugin/52-the-computer-and-bot-listings-answer-the-callers-own/plan.md) adds it to the `computer` and `bot` listings.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "query" packages/sdk/src/resources/records.ts` - every scheme gets the text after `?`, and only `usage` reads it.
- `rg "list\?\(" packages/sdk/src/types/resources.ts` - a scheme's `list` already gets the reader.
- Token and vault listings already answer the caller's own, so they get no filter.

### Runtime path

```
listSessions {_meta: {'ahpd.owner': 'me'}} -> allRows -> rows whose SessionStore.owner is the caller -> paging
subscribe ahp-automations://?owner=me -> snapshot of the caller's automations -> later actions for those automations only
```

### Gaps

- No listing can answer only the caller's records.
- `listSessions` has no place for a filter, because it is a method and not a URI.
- The automations snapshot matches `ahp-automations://` exactly, so a URI with a query is refused.
- A records channel answers only its exact URI, so a plugin channel cannot take a query.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A filter on each listing, not a second listing | Softov, 2026-10-21: "I think each list should support like a file '?me'. Otherwise we will be making 2x each list" | 01, 02, 03, 04 |
| The filter is `?owner=me` | Softov, 2026-10-21, to "How should the filter be spelled on a listing URI?": "?owner=me" | 01, 03, 04 |
| `listSessions` takes it as `_meta['ahpd.owner'] = 'me'` | Softov, 2026-10-21, to "listSessions is a method, not a URI. How does it take the filter?": "_meta ahpd.owner = me" | 02 |
| `me` is only the owner `user:<id>` of the caller | Softov, 2026-10-21, to "Does me include records owned by the caller's teams or projects?": "Only owner user:<me>" | 01 |
| Only the caller's own records, never another person's | Softov, 2026-10-21, to "May an admin ask for another person's records?": "Only the caller's own" | 01 |

## Proposed architecture

- **Data flow** - one sdk helper reads `owner=me` from a query or from `_meta`, and gives the owner to match, `ownerOfPrincipal(reader)`. Each listing keeps a record when its owner equals that owner.
- **Source-of-truth files** - [`code://packages/sdk/src/host/sessionmethods.ts`](../../../../packages/sdk/src/host/sessionmethods.ts), [`code://packages/sdk/src/host/snapshots.ts`](../../../../packages/sdk/src/host/snapshots.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - One helper reads the owner filter](task-01-one-helper-reads-the-owner-filter.md) | implemented | - |
| [02 - listSessions takes the owner filter](task-02-list-sessions-takes-the-owner-filter.md) | implemented | 01 |
| [03 - The automations channel takes the owner filter](task-03-the-automations-channel-takes-the-owner-filter.md) | implemented | 01 |
| [04 - A records channel takes the owner filter](task-04-a-records-channel-takes-the-owner-filter.md) | implemented | 01 |

## Risks and tradeoffs

- The filter narrows a listing, and it does not change who may list. A caller with `session:list` still sees every session without the filter.
- A caller with no principal, such as a host with no users, has no owner. The filter then answers nothing.
- A filter value other than `me` is refused with INVALID_PARAMS, so a later `owner=team:<id>` is a new answer, not a silent change.

## Resume state

- **Done so far:** all four tasks. `ownerFilter` reads the filter, `listSessions` takes it as `_meta['ahpd.owner']`, the automations catalogue narrows its snapshot and its actions, and a records channel narrows with `ownerOf`.
- **Next action:** review the four tasks, then write `implemented.md`.
- **Open questions:** none.
- **Watch out for:** the index row stays `implemented`, not `done`.
