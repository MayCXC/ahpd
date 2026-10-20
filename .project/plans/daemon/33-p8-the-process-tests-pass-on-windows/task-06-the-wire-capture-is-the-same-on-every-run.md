---
title: The wire capture is the same on every run
status: done
depends: []
layer: tests
refs:
  - "[code://packages/sdk/test/wire.test.ts#L607-L641](../../../../packages/sdk/test/wire.test.ts#L607-L641) - `steady` and the write of the capture"
  - "[code://packages/sdk/test/wire.test.ts#L272-L276](../../../../packages/sdk/test/wire.test.ts#L272-L276) - the home pinned for the capture"
  - "[code://packages/sdk/test/fixtures/wire.jsonl](../../../../packages/sdk/test/fixtures/wire.jsonl) - the capture, regenerated on Linux"
  - git://35e48b0a - the commit that took in a capture written on Windows
---

## Objective

`wire.test.ts` writes the same capture on every POSIX run and none on Windows, and the committed capture names no real person or machine.

## Files

- `UPDATE: packages/sdk/test/wire.test.ts` - the capture case pins `HOME` and `USERPROFILE` to `/home/softov`; `steady` maps the UUID inside a chat URI's base64url id; the capture is written only where `posix`.
- `UPDATE: packages/sdk/test/fixtures/wire.jsonl` - regenerated from a Linux run.

## Steps

1. In `steady`, decode each `ahp-chat://default/<id>`, map the UUIDs in it with the same names as the rest of the capture, and encode it again.
2. Write the capture only when `posix`, with the reason beside it.
3. Pin the home for the capture case with `vi.stubEnv`, undone by `onTestFinished`, so the claude agent's user folders do not name the machine that ran it.
4. Regenerate the capture in a disposable `node:22` container, from a fresh Linux install of the branch.
5. Run `wire.test.ts` twice on Linux and once on Windows, and check `git status` after each.

## Validation

- After a Linux run, `git status` shows no change to `wire.jsonl`.
- After a Windows run, `wire.jsonl` is untouched.
- `wire.jsonl` holds no `C:/Users/`, no drive and no real user name.

## Resume

Done 2026-10-20. Not reviewed.
Found while the unit suite ran on this Windows host: the run rewrote `wire.jsonl`, and the committed one, from PR #43's commit `35e48b0a`, already held drive paths and a real user's `.claude` folder under `C:/Users/`.
Two causes: the chat URIs carry each session's UUID in base64url, which `steady` did not map, so every run on any system rewrote those lines; and on Windows `os.homedir()` does not read `HOME`, so the claude agent's user folder was the person's own.
The claude agent's user folders come from `os.homedir()`, so even a Linux capture named the home of whoever ran it; the case now pins it.
Regenerated 2026-10-20 in a disposable `node:22` container on the Windows VM, from a fresh Linux install of the branch: two runs pass 17 of 17 and write the same capture, which holds no drive and no real user name.
The container's case needed `--testTimeout=60000`: a container on that VM passed Linux's 5 s limit, and a capture from a case that timed out could be cut short.
On this Windows host, `wire.test.ts` passes 17 of 17 and leaves `wire.jsonl` as it is.
Against `main`, the capture differs only in those paths and ids: 50 lines.
The old capture stays in the history of `main`; taking it out of the history is Softov's call.
