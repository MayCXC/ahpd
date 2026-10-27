---
title: "Handoff: where ahpd stands, and what is pending"
---

# Handoff: where `ahpd` stands, and what is pending

Current progress and pending items only, as of 2026-10-27.
[plans/index.md](../plans/index.md) is the backlog and each plan's Resume state is its detail. What merged is in `git log`, and what was released is in [CHANGELOG.md](../../CHANGELOG.md).

## Main

- The last release is 0.14.0 (`v0.14.0`). Main is 44 commits past it, at `4a147b96` (PR #107). The CHANGELOG holds 0.14.1 as unreleased.
- `/github/ahpd` is a detached HEAD at origin/main, and the tree is clean. Fetch, and check the base before you cut a build worktree.
- Softov's dev daemon runs from source on port 37537. It needs a restart in his own terminal to load #107.
- Code goes through a PR on `softov/ahpd`. Plan-only commits go to main. Run `gh pr checks` with `-R softov/ahpd` outside a repo.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by every test run. Restore it with `git checkout --` and never print it.
- On this machine, two Docker tests time out: `computer-devcontainer` and `computer-disposable`. They time out on main too, and CI passes them.
- The build worktrees in `/github/ahpd.worktrees/` are still there: `c6e2919d`, `d0396c15`, `ecd04033`, `fda88f4a` (the old container/05 p8) and `plans-main`. Ask Softov before you remove `d0396c15`. Check `ss -ltnp` before you start a test daemon, and stop it by pid.

## Waiting for Softov

- After the daemon restart, open a terminal in ahpw and in ahpc. `supportsCommandDetection` is now false until the shell prints its first mark.
- host/121: the checks by hand in its plan's Resume state.
- plugin/71: [pending/plugin-71-sign-in-checks.md](../pending/plugin-71-sign-in-checks.md).
- daemon/41 on Windows: [pending/daemon-41-windows-checks.md](../pending/daemon-41-windows-checks.md).
- host/123: [pending/host-123-engines-checks.md](../pending/host-123-engines-checks.md).
- host/122: [pending/host-122-agent-records-checks.md](../pending/host-122-agent-records-checks.md).
- proxy/05: [pending/proxy-05-model-checks.md](../pending/proxy-05-model-checks.md).
- proxy/04: icon curation, and [pending/proxy-04-move-config-dev.md](../pending/proxy-04-move-config-dev.md).
- plugin/58: task 05 waits for [pending/plugin-58-icon-curation.md](../pending/plugin-58-icon-curation.md).
- plugin/50: [pending/plugin-50-first-pieces.md](../pending/plugin-50-first-pieces.md).
- The plans in [plans/index.md](../plans/index.md) with all tasks implemented wait for his review. Each stays `active` until he says his review is done.

## Next builds

- Planned with tasks: plugin/63, proxy/06, container/05 p8 and container/05 p10.
- The ahpw Connect button for plugin/71 is a plan in the ahpw repository. It is not written yet.

## Outside this repository

- ahpc is level with origin. What ahpc lacks against ahpd is in `ahp-review/briefs/ahpc-catch-up.md`.
- ahpw is clean on main, on scena `^0.5.14`, and its agent and connector forms have a YAML view.
- scena 0.5.14 is on npm, and its tree is clean.
- `ahp-review` has briefs that are not committed, `briefs/sign-in.md` with its Answers among them.
- The MayCXC fork branch `host/124-an-agents-shell-is-a-terminal-the-person-sees` was not taken: about 6100 lines that copy VS Code's shell integration, on an old base. The remote `maycxc` is still in `/github/ahpd`.
- A test session `claude-deepseek:/845c1908-…` is still on Softov's daemon. Remove it only when he says so.

## By Softov's hand

The checks in [pending/](../pending/).
