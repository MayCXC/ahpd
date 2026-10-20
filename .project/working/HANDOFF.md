---
title: "Handoff: where ahpd stands, and what is pending"
---

# Handoff: where `ahpd` stands, and what is pending

Current progress and pending items only, as of 2026-10-15.
[plans/index.md](../plans/index.md) is the backlog and each plan's Resume state is its detail. What merged is in `git log`, and what was released is in [CHANGELOG.md](../../CHANGELOG.md).

## Main

- The last release is 0.11.0 (`v0.11.0`). Main is 142 commits past it, and `CHANGELOG.md` has no section for them yet.
- Softov's daemon was restarted on 2026-10-15 at `8b429d54`. It runs host/92 and the plugin/48 task 05 fixes.
- No build worktree is open. Builds run in worktrees under `/github/.worktrees/ahpd/<name>`, cut from main, with `pnpm install`.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by every test run. Restore it before a commit.
- `nested-start`, `nested-proxy` and `proxy-forward` can fail under the load of a full run. Run them alone with `--testTimeout 30000` before you call a failure real.

## Closed on 2026-10-15

- host/88, host/92, plugin/48 and plugin/49 are built. The deferred items of host/92 and plugin/48 are in each plan's `deferred.md`.

## Implemented, waiting for the close

Each of these has its tasks built and reviewed. To close one, follow its Resume state.

- daemon/23: passed on Windows; it needs only the close.
- host/33: tasks 03 and 04 are implemented.
- host/83: p1 to p5 are built; the checks by hand of p1 to p4 remain.
- host/86 and host/87: task 01 of each is implemented and reviewed.
- plugin/51: tasks 01 to 07 are implemented and reviewed. The ahpw side, `/plugins/web/`, needs an ahpw release.

## Next builds

- host/89, then host/90, then host/91. All three are planned with tasks.
- documentation/05 is planned.
- container/05 p9 task 07 waits on task 06, which Softov runs on dev02.
- Drafts with no tasks: plugin/47, plugin/50 and container/05 p12. Each needs Softov's answers first.

## Small fixes, not yet written up

- `docs/server/REFERENCE.md` near line 745 has a broken sentence about `origins`.
- `spawn.ts` leaks `senders` entries. Find the cause and write a task before you fix it.

## Releases, each on Softov's go

- 0.12.0 of ahpd: write the changelog section and run the checks first. Push no `v*` tag before his go.
- cofold agent/09: run ahpd's tests against the release candidate, and read its `deferred.md`, before the tag.
- ahpw, for `/plugins/web/` from plugin/51.

## Open questions for Softov

- [a-bot-file-edited-by-hand-to-a-new-owner-takes-it-after-a-restart.md](../problems/a-bot-file-edited-by-hand-to-a-new-owner-takes-it-after-a-restart.md) waits on his choice. The other files in [problems/](../problems/) are undecided too.
- Push sends `A session finished` when a turn completes, and no plan records it. Offer a task or a plan.

## By Softov's hand

- [macos-checks.md](../pending/macos-checks.md).
- container/02 tasks 01 to 03: the Windows VS Code run.
- container/05 p9 task 06 on dev02.
- The Modal title copy button needs a scena change.

## Reviews

- [2026-09-19-upstream-pass-4.md](../review/2026-09-19-upstream-pass-4.md). Pass 6, against VS Code 1.141.1, is in commit `029da507` and gave host/88 to host/91.
