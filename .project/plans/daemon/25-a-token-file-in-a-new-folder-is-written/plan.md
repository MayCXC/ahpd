---
title: A token file in a new folder is written
domain: daemon
status: planned
priority: high
created: 2026-10-14
revalidated: 2026-10-14
refs:
  - "[code://packages/server/src/commands/options.ts#L1097-L1106](../../../../packages/server/src/commands/options.ts#L1097-L1106) - `secret`, which writes `--connection-token-file` with no folder made first"
  - "[code://packages/server/src/commands/configure.ts#L166-L191](../../../../packages/server/src/commands/configure.ts#L166-L191) - the same fix in `configure`, from daemon/24 task 01"
---

## Goal

`ahpd start --connection-token-file <file>` writes a new token when the folder of the file does not exist yet.
Softov found this on Windows on 2026-10-13.
ahp-desk starts the local ahpd with a token file in its app data folder, and a first run fails.
The desk has a workaround, which it can remove after this plan.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "writeFileSync" packages/server/src/commands` - `secret` in `options.ts` and the two writes in `configure.ts` write the token file. Only `configure` makes the folder first.

### Runtime path

```
ahpd start --connection-token-file <dir>/token -> secret(options) -> no file -> writeFileSync(<dir>/token) -> ENOENT when <dir> is not there
```

### Gaps

- `secret` does not make the folder of the token file before it writes the token.

## Decisions locked in

| Decision | Source |
| --- | --- |
| None | - |

| What | Source | Task |
| --- | --- | --- |
| `secret` makes the folder before it writes the token | Windows check, 2026-10-13; Softov, 2026-10-14: "ahpd plan daemon/25" | 01 |

## Proposed architecture

- **Data flow** - `secret` makes the folder of a missing token file, then writes the token as it does today.
- **Layer responsibilities** - server only: `options.ts`.
- **Source-of-truth files** - [`code://packages/server/src/commands/options.ts`](../../../../packages/server/src/commands/options.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - secret makes the folder before the token](task-01-secret-makes-the-folder-before-the-token.md) | todo | - |

## Risks and tradeoffs

- A path with a typing error now makes a new folder and a new token, rather than an error. This is the same behaviour as a missing file in a folder that exists.

## Resume state

- **Done so far:** planned 2026-10-14.
- **Next action:** build task 01.
- **Open questions:** none.
- **Watch out for:** the suite rewrites `packages/sdk/test/fixtures/wire.jsonl`. Restore it before a commit.

## Final verification checklist

- [ ] On Windows, `ahpd start --connection-token-file` with a folder that does not exist starts, and the file holds the token.
- [ ] `plans/index.md` updated.
