---
title: A new session is an `ahp-session:` URI - implemented
date: 2026-10-27
refs:
  - "[code://packages/sdk/src/sessions/sessions.ts](../../../../packages/sdk/src/sessions/sessions.ts) - the store keeps a session's URI"
  - "[code://packages/sdk/src/host/sessionmethods.ts](../../../../packages/sdk/src/host/sessionmethods.ts) - createSession names a new session"
  - "[code://packages/sdk/src/host/catalogue.ts](../../../../packages/sdk/src/host/catalogue.ts) - a listed session is named from its row"
  - "[code://packages/sdk/src/host/spawn.ts](../../../../packages/sdk/src/host/spawn.ts) - keepProvider writes the held name"
  - "[code://packages/sdk/test/host-names.test.ts](../../../../packages/sdk/test/host-names.test.ts) - the cases for each kind of name"
---

A session the host makes is `ahp-session:/<uuid>`.
A session that already exists keeps its `<provider>:/<id>` name.
The host reads a provider from the session's row, never from its URI.

## What was built

- **Task 01, the store keeps a session's URI.** `SessionStore` gets optional `uri` and `setUri` ([`code://packages/sdk/src/types/sessions.ts`](../../../../packages/sdk/src/types/sessions.ts)). `memorySessions` and `fileSessions` implement them ([`code://packages/sdk/src/sessions/sessions.ts`](../../../../packages/sdk/src/sessions/sessions.ts)). The file store writes `uri` into the row and reads a non-empty string back at load. `empty` does not count a name, so a row with only a URI writes no file.
- **Task 02, a new session is `ahp-session:`.** `createSession` keeps the client's URI when its scheme is `ahp-session` or the provider in the request ([`code://packages/sdk/src/host/sessionmethods.ts`](../../../../packages/sdk/src/host/sessionmethods.ts)). Otherwise the host holds the session as `ahp-session:/<id>`, and the client's URI is an alias. `movedTo`, `askModel`, `beginSession`, the session tool's `create` and the nested proxy all use `uriFor(uuid)`. `keepProvider` writes the held name as the row's `uri`, under the host's id only, and only when the row has none ([`code://packages/sdk/src/host/spawn.ts`](../../../../packages/sdk/src/host/spawn.ts)).
- **Task 03, a listed session is named from its row.** `adopt` names a listed session from the row's `uri` ([`code://packages/sdk/src/host/catalogue.ts`](../../../../packages/sdk/src/host/catalogue.ts)). A row with a provider and no name gets `<provider>:/<id>`, and the host stores that name. An id with no row on this host is `ahp-session:/<id>`, and the host stores nothing for it. The listing reads the store's ids once, not once for each row.
- **Task 04, no provider is read from a scheme.** `reportedBy` reads the row's provider, or else the session's agent ([`code://packages/sdk/src/host/tooling.ts`](../../../../packages/sdk/src/host/tooling.ts)). `sessionKept` compares the stored name with the URI ([`code://packages/sdk/src/plugins/plugins.ts`](../../../../packages/sdk/src/plugins/plugins.ts)). It keeps the old provider and scheme check for a row without a name.
- **Task 05, the docs name the protocol's URI.** The spec, `docs/sdk/AHP.md` and `docs/sdk/SESSIONS.md` say how a session is named. They cite [a-new-session-is-held-under-the-protocols-uri](../../../decisions/a-new-session-is-held-under-the-protocols-uri.md). `CHANGELOG.md` has the upgrade note, and `UPSTREAM.md` Pass 7 ticks `bd64649be19` for this plan.
- **Tests in `packages/sdk/test`.** A case that made a session on `ahp-session:` now expects that URI back. New cases in `host-names.test.ts` cover each kind of name: `ahp-session:`, the provider's scheme, another scheme, an old row and a missing row.
- **Tests outside `packages/sdk`.** 23 tests in `bot`, `agent-acp`, `agent-cofold`, `computer` and `server` expected the old `<provider>:/<id>` name. Each one now expects the name that the plan gives.

## Verified

- `pnpm -s typecheck`, `pnpm -s build` and `pnpm -s boundary` pass.
- The full suite, run after `node tools/schema.mjs`, has 7307 tests that pass, 29 skipped and 2 that fail.
- The 2 failures are 5 s timeouts in `computer-devcontainer` and `computer-disposable`, at a load average of 10. With a 30 s timeout, all 125 tests in those files pass.
- `host-names.test.ts` lists a session made on `ahp-session:/one` under that name, and an old row under `<provider>:/one`.
- `server-cli-restart.test.ts` restarts a daemon and finds `ahp-session:/kept-1` in the listing.
- The bot plugin never builds a session URI. Its `handles` map uses the `start.uri` from the host ([`code://packages/bot/src/chat.ts`](../../../../packages/bot/src/chat.ts)). `CHAT_PROVIDER` is only the request's `provider` field.

## Departures from the plan

- The plan's risk named only `packages/sdk/test`. Tests in five other packages had the same old expectation, and none of those packages needed a source change.
- One `uri` line in the memory store's row had the wrong indent. It now aligns with the lines around it.

## Left for later

- ahpc and ahpw still create `<provider>:/<uuid>` sessions until their own plans change them.
- A client that reads a provider from a URI's scheme gets `ahp-session` for a new session. The summary has `provider`, and the upgrade note in `CHANGELOG.md` says so.
