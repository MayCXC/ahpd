---
title: An Activepieces action takes and writes a file
domain: plugin
status: built
priority: medium
created: 2026-10-26
revalidated: 2026-10-26
requires: []
changes: []
creates: []
refs:
  - "[code://packages/activepieces/src/mapping.ts#L60](../../../../packages/activepieces/src/mapping.ts#L60) - `propOf`, which drops a `FILE` prop"
  - "[code://packages/activepieces/src/mapping.ts#L103](../../../../packages/activepieces/src/mapping.ts#L103) - `inputOf`, which drops an action with a required `FILE` prop"
  - "[code://packages/activepieces/src/mapping.ts#L207](../../../../packages/activepieces/src/mapping.ts#L207) - the problem line for an action that needs a file"
  - "[code://packages/activepieces/src/mapping.ts#L168](../../../../packages/activepieces/src/mapping.ts#L168) - `RunCallArgs`, what the plugin sends the child for one call"
  - "[code://packages/activepieces/src/plugin.ts#L297](../../../../packages/activepieces/src/plugin.ts#L297) - the `run` request to the child"
  - "[code://packages/activepieces/src/child.ts#L265-L289](../../../../packages/activepieces/src/child.ts#L265-L289) - `contextOf`, where `files` refuses every write"
  - "[code://packages/sdk/src/connectors/actions.ts#L31-L45](../../../../packages/sdk/src/connectors/actions.ts#L31-L45) - `ActionHost`, what the action tools read about a session"
  - "[code://packages/sdk/src/connectors/actions.ts#L153-L158](../../../../packages/sdk/src/connectors/actions.ts#L153-L158) - the tool call, which knows the session"
  - "[code://packages/sdk/src/connectors/channel.ts#L450-L468](../../../../packages/sdk/src/connectors/channel.ts#L450-L468) - the channel's `run`, which calls the adapter with no session"
  - "[code://packages/sdk/src/types/connectors.ts#L289](../../../../packages/sdk/src/types/connectors.ts#L289) - `Adapter.run`"
  - "[code://packages/sdk/src/types/sessions.ts#L455](../../../../packages/sdk/src/types/sessions.ts#L455) - `attachmentsDir`, the folder of one session's attachments"
  - "[code://packages/sdk/src/host/attachments.ts#L138](../../../../packages/sdk/src/host/attachments.ts#L138) - the pattern: pasted bytes are written into that folder"
  - "[code://packages/sdk/src/host/tooling.ts#L533](../../../../packages/sdk/src/host/tooling.ts#L533) - where the host builds its `ActionHost`"
  - npm://@activepieces/pieces-framework@0.32.0 - `ApFile` and `FilesService.write`, what a piece reads and calls
  - file:///github/ahp-review/briefs/activepieces-files.md - the brief, with the answers this plan builds
---

## Goal

A piece action that takes a file runs, and a piece that writes a file gives the agent something it can read.
Today the plugin drops every action with a required `FILE` prop and refuses `files.write`.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "FILE" packages/activepieces/src` - `propOf` and `inputOf` drop the prop, and the plugin reports the action.
- `rg -n "refused" packages/activepieces/src/child.ts` - `files` is one of the refused context services.
- `rg -n "attachmentsDir" packages/sdk/src` - the attachments, the machines and the chat actions read the folder, and the connector actions do not.
- `rg -n "isPrivate|loopback" packages` - ahpd has no guard against private addresses, only `loopbackUrl` for `http:` issuers.

### Runtime path

```
tool call (actions.ts, knows the session) -> channel run (no session today) -> Adapter.run(connector, action, input, call?)
  -> activepieces callAction -> child run { ..., files: <folder> }
  -> child: a FILE value (https: | data: | attachment name) -> ApFile -> action.run
  -> context.files.write({ fileName, data }) -> <folder>/<fileName> -> its path in the output
```

### Gaps

- `Adapter.run` gets no session, so the plugin cannot know which folder is the session's.
- The child has no guarded fetch.
- `files.write` refuses, so an action that writes a file fails.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A `FILE` value is a string: an `https:` URL, a `data:` URI or the name of a session attachment | Softov, 2026-10-26 | 02 |
| A file has no size limit of its own; a URL is read only up to the 32 MB the host's attachments use | Softov, 2026-10-26 (review) | 02 |
| A request that has not answered in 30 s is ended, and its socket with it | Softov, 2026-10-26 (review) | 02 |
| A refusal names a URL's host, never its path or query | Softov, 2026-10-26 (review) | 02 |
| A written file's name is cut at 80 characters, its extension kept | Softov, 2026-10-26 (review) | 03 |
| The shared, benchmarking, multicast and reserved ranges are refused, in both families | Softov, 2026-10-26 (review) | 02 |
| A file a piece writes goes into the session's attachments, and the action's output carries its path | Softov, 2026-10-26 | 03 |
| A file needs no grant beyond the connector binding | Softov, 2026-10-26 | 02, 03 |
| The child fetches only `https:`, and refuses loopback, link-local and private addresses | Softov, 2026-10-26 | 02 |
| The address is checked after the DNS lookup, and again on each redirect | (defaulted: a check on the name alone is passed by a name that resolves to a private address) | 02 |
| `Adapter.run` takes an optional fourth argument, `call`, with `files` as the session's attachments folder | (defaulted: an adapter that does not read it is not changed) | 01 |
| An attachment name resolves inside the folder by `realpath`, and any other path is refused | (defaulted: the rule the plugin icons follow for a package) | 02 |
| A call with no folder still refuses `files.write`, and a `FILE` value that names an attachment fails | (defaulted: a session with no attachments folder has nowhere to put the file) | 02, 03 |

## Proposed architecture

- **Data flow** - the tool call reads the session's attachments folder and passes it down to the adapter. The plugin passes it to the child, which reads and writes files there.
- **State flow** - a written file is a session attachment, kept and removed with the session.
- **Layer responsibilities** - sdk: the folder reaches `Adapter.run`. activepieces: the `FILE` prop, the guarded fetch, and `files.write`.
- **Source-of-truth files** - [`code://packages/activepieces/src/child.ts`](../../../../packages/activepieces/src/child.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - An action call carries the attachments folder](task-01-a-call-carries-the-attachments.md) | done | - |
| [02 - A FILE prop takes a URL, a data URI or a name](task-02-a-file-prop-takes-a-string.md) | done | 01 |
| [03 - A written file lands in the attachments](task-03-a-written-file-is-an-attachment.md) | done | 01 |

## Risks and tradeoffs

- A URL is read to 32 MB and 30 s, but the file is still held whole in memory. A `data:` URI has no limit at all. A limit on those is a later row.
- The guarded fetch is new code in a security path. Its tests cover each range, a redirect, an oversized answer and a slow one.
- A piece reads the whole file into a `Buffer`, so a stream is not possible with `ApFile`.

## Resume state

- **Done so far:** all three tasks are done, and the plan is merged in #103. See [implemented.md](implemented.md).
- **Next action:** Softov runs the by-hand check in `.project/pending/plugin-70-file-checks.md`.
- **Open questions:** none.
- **Watch out for:** never put the folder path or a file's bytes in a problem line or a log.

## Final verification checklist

- [x] An action with a required `FILE` prop is offered, and the problem line for it is gone.
- [x] A `FILE` value of `https://127.0.0.1/x`, `https://10.0.0.1/x`, `https://169.254.169.254/x` or `http://example.com/x` is refused.
- [x] An answer over 32 MB, or one that takes over 30 s, is refused, and no refusal repeats a URL's path or query.
- [x] A `FILE` value of `../x` or an absolute path outside the folder is refused.
- [x] An action that writes a file puts it in the session's attachments folder, and the output names it.
- [x] `docs/plugins/activepieces.md` says what a `FILE` value may be and where a written file goes.
- [x] `plans/index.md` updated.
