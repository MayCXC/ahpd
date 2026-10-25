---
title: "Handoff: where ahpd stands, and what is pending"
---

# Handoff: where `ahpd` stands, and what is pending

Current progress and pending items only, as of 2026-10-25.
[plans/index.md](../plans/index.md) is the backlog and each plan's Resume state is its detail. What merged is in `git log`, and what was released is in [CHANGELOG.md](../../CHANGELOG.md).

## Main

- The last release is 0.13.0 (`v0.13.0`, 2026-10-20). Main is 180 commits past it, at `c58da50d` (PR #90, host/123). The CHANGELOG holds 0.14.0 as unreleased.
- Local `main` in `/github/ahpd` is level with origin. Fetch, and check the base before you cut a build worktree.
- Main has uncommitted changes: host/123 tasks 02 and 03, and a `.gitignore` change that is not part of them. Commit them only after Softov checks them, and leave `.gitignore` out.
- Softov's dev daemon runs from source on port 37537, and he restarted it after host/123 task 02.
- Code goes through a PR on `softov/ahpd`. Plan-only commits go to main. Run `gh pr checks` with `-R softov/ahpd` outside a repo.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by every test run. Restore it with `git checkout --` and never print it.
- The build worktrees in `/github/ahpd.worktrees/` are still there, and test daemons from them can still run. Check `ss -ltnp` before you start one, and stop it by pid.

## Waiting for Softov

- host/123 tasks 02 and 03: [pending/host-123-engines-checks.md](../pending/host-123-engines-checks.md). ahpw plugins 08 task 05 is implemented on ahpw main, not committed.
- host/122: [pending/host-122-agent-records-checks.md](../pending/host-122-agent-records-checks.md).
- proxy/05: [pending/proxy-05-model-checks.md](../pending/proxy-05-model-checks.md).
- proxy/04: icon curation, and [pending/proxy-04-move-config-dev.md](../pending/proxy-04-move-config-dev.md).
- plugin/58: task 05 waits for [pending/plugin-58-icon-curation.md](../pending/plugin-58-icon-curation.md). Task 06 waits for the shared-marks brief in `ahp-review/briefs/shared-marks.md`.
- plugin/50: [pending/plugin-50-first-pieces.md](../pending/plugin-50-first-pieces.md).
- The plans in [plans/index.md](../plans/index.md) with all tasks implemented wait for his review. Each stays `active` until he says his review is done.

## Next builds

- Planned with tasks: plugin/63, proxy/06, container/05 p8 and container/05 p10.

## Outside this repository

- ahpc `844de67` on main fixes `cancel` and is not pushed. What ahpc lacks against ahpd is in `ahp-review/briefs/ahpc-catch-up.md`.
- `ahp-review/briefs/drop-deno.md` is a brief, not a plan. Plan it only when Softov says so.
- A test session `claude-deepseek:/845c1908-…` is still on Softov's daemon. Remove it only when he says so.

## By Softov's hand

The checks in [pending/](../pending/).
