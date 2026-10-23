---
title: "Handoff: where ahpd stands, and what is pending"
---

# Handoff: where `ahpd` stands, and what is pending

Current progress and pending items only, as of 2026-10-21.
[plans/index.md](../plans/index.md) is the backlog and each plan's Resume state is its detail. What merged is in `git log`, and what was released is in [CHANGELOG.md](../../CHANGELOG.md).

## Main

- The last release is 0.13.0 (`v0.13.0`, 2026-10-20). Main is 36 commits past it, at `ad64d33f` (PR #60, host/113).
- Softov's daemon needs a restart in his terminal to run host/113. After it, a connection opened with a person's own token gets `ahpd.principal`, and a config file that still sets `trustToken` logs the key as unknown.
- Local `main` in `/github/ahpd` is at `ad64d33f`, level with origin. Fetch, and check the base before you cut a build worktree.
- Code goes through a PR on `softov/ahpd`. Plan-only commits go to main. Run `gh pr checks` with `-R softov/ahpd` outside a repo.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by every test run. Restore it with `git checkout --` and never print it.
- `nested-start.test.ts` and the `packages/computer` tests time out on this machine, on main too.
- The remote branches of merged PRs are still there. Do not delete them without asking.

## Implemented, waiting for Softov's review

Each stays `active` until he says his review is done. Then mark the tasks `done`, write `implemented.md`, and close the plan.

- daemon/37, daemon/38, daemon/39.
- host/112. Note for its `implemented.md`: mutation M7 survived. The second owner check in `send()`, `visible` on replay, is untested and redundant with `apply()`.
- plugin/52 (the computer and bot listings). Note for its `implemented.md`: removing `if (only === null) return [];` in the computer list changes nothing.
- host/113 (PR #60, merged 2026-10-21). In ahpw, every user without `requireIssuer` now shows "Trusted". The word now means "their own token signs them in"; that is Softov's to change in ahpw.
- daemon/36 (PR #55, merged): review and close.

## Next builds

- None is queued. The planned ones with tasks are container/05 p8 and p10; see [plans/index.md](../plans/index.md).

## Open questions for Softov

- acp/19 has a records follow-up. Softov does not remember what it is, and must review to know. See [acp-19-records-follow-up.md](../pending/acp-19-records-follow-up.md). Do not act on it before his answer.
- Whether `rolesFrom` moves to the issuer level.
- The files in [problems/](../problems/) are undecided.

## By Softov's hand

The checks in [pending/](../pending/). Among them: host/100 p2, host/108 tokens, plugin/45 p2, daemon/31 on macOS, plugin/51, acp/19 on Windows, the acp/18 handshakes for cline, omp and devin, and the VS Code pending-question problem.

Carried from the 2026-10-15 handoff, not rechecked: container/02 tasks 01 to 03 (the Windows VS Code run), container/05 p9 task 06 on dev02, and the Modal title copy button, which needs a scena change.

## Reviews

- [2026-09-19-upstream-pass-4.md](../review/2026-09-19-upstream-pass-4.md). Pass 6, against VS Code 1.141.1, is in commit `029da507`.
