---
title: A token file in a new folder is written - implemented
date: 2026-10-19
refs:
  - git://735e01e5
  - "[code://packages/server/src/commands/options.ts#L1233](../../../../packages/server/src/commands/options.ts#L1233) - the folder of the token file is made before the write"
  - "[code://packages/server/test/server-secret.test.ts](../../../../packages/server/test/server-secret.test.ts) - the two cases"
---

`ahpd start --connection-token-file <file>` writes a new token when the folder of the file does not exist yet.
A first run of ahp-desk with a token file in its app data folder starts.

## What was built

- [`code://packages/server/src/commands/options.ts`](../../../../packages/server/src/commands/options.ts) - `secret` makes the folder of a missing token file, then writes the token. A token that is there is read, and no folder is made.
- [`code://packages/server/test/server-secret.test.ts`](../../../../packages/server/test/server-secret.test.ts) - the cases for a token file in a missing folder.

## Verified

- `server-secret.test.ts`: `writes a token into a folder that is not there yet` and `keeps the token it wrote, so a second start reads the same one` pass. Both failed with ENOENT before the fix.
- On 2026-10-14, the gates passed: schema, typecheck, boundary, and vitest on sdk, server, agent-claude and agent-acp, 4366 tests.
- By hand on Windows 10, 2026-10-14, at 02e7c214: a start with the token file under two missing folders made them and started. The file holds the token of the record's `connectUrl`.
- Softov reviewed the task and approved the close on 2026-10-19.

## Departures from the plan

- none.

## Left for later

- ahp-desk can remove its workaround. That change is in ahp-desk, not in this repository.
