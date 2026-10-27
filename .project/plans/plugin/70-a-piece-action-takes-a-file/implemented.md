---
title: An Activepieces action takes and writes a file - implemented
date: 2026-10-26
refs:
  - git://a9cda3fe
  - "[code://packages/activepieces/src/fetch.ts](../../../../packages/activepieces/src/fetch.ts)"
  - "[code://packages/activepieces/src/files.ts](../../../../packages/activepieces/src/files.ts)"
  - "[code://packages/activepieces/src/child.ts](../../../../packages/activepieces/src/child.ts)"
  - "[code://packages/sdk/src/connectors/actions.ts](../../../../packages/sdk/src/connectors/actions.ts)"
---

A piece action with a `FILE` prop is offered. The prop takes an `https:` URL, a `data:` URI or a session attachment's name. A file that a piece writes lands in the session's attachments, and the action's output carries its path.

## What was built

- [`code://packages/sdk/src/connectors/actions.ts`](../../../../packages/sdk/src/connectors/actions.ts) - the action tool reads the session's attachments folder and passes it to `Adapter.run` in an optional `call`. `channel.ts`, `tooling.ts` and `types/connectors.ts` carry it.
- [`code://packages/activepieces/src/fetch.ts`](../../../../packages/activepieces/src/fetch.ts) - the guarded fetch. It reads only `https:` and checks the address after the DNS lookup. It connects to the address it checked, and checks each redirect again.
- The guarded fetch refuses loopback, link-local, private and unspecified addresses, `100.64.0.0/10`, `198.18.0.0/15`, `224.0.0.0/4`, `240.0.0.0/4` and `ff00::/8`. It refuses a NAT64 `64:ff9b::/96` address by its IPv4 address, and an IPv4-mapped or IPv4-compatible address the same way.
- The guarded fetch reads an answer to 32 MB and ends a request after 30 s, both injectable. A refusal names the host and never a path or query.
- [`code://packages/activepieces/src/files.ts`](../../../../packages/activepieces/src/files.ts) - a value becomes an `ApFile`. An attachment name resolves inside the folder by `realpath`. `files.write` opens with `wx` and mode `0400`, cuts a name at 80 characters with its extension kept, and writes `stem-N.ext` on a clash.
- [`code://packages/activepieces/src/child.ts`](../../../../packages/activepieces/src/child.ts) - the child reads `FILE` values and serves `files.write`. A call with no folder refuses the write.
- `packages/activepieces/src/mapping.ts` - a `FILE` prop is a string, and an action with a required one is offered.
- `docs/plugins/activepieces.md` and `docs/plugins/PLUGINS.md` say what a `FILE` value may be and where a written file goes.

## Verified

- `fetch.test.ts`, `files.test.ts`, `child.test.ts`, `mapping.test.ts`, `pieces.test.ts` and `run.test.ts` in activepieces, and `connector-actions.test.ts` in sdk. The tests cover every refused range with a fake lookup and no network, a redirect, an oversized answer and a slow one.
- The full gate passed: 7135 tests. The 2 failures were timeouts in `computer-devcontainer.test.ts` and `nested-start.test.ts`, which fail on main too.
- CI passed on #103, with all 8 checks, `check-windows` and `install-windows` included.

## Departures from the plan

- The review added the 32 MB and 30 s limits, the extra refused ranges and the NAT64 and IPv4-mapped reading. It also added host-only refusals and the 80-character name cap. They are rows in the plan's *Answers* table.
- A written file opens with `wx` and mode `0400`, so a write never replaces a file.

## Left for later

- The by-hand check with a real piece - see `.project/pending/plugin-70-file-checks.md`.
