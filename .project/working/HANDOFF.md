---
title: "Handoff: where ahpd stands, and what is pending"
---

# Handoff: where `ahpd` stands, and what is pending

Current progress and pending items only, as of 2026-10-28.
`node ~/.claude/skills/do-spec/scripts/plans.mjs` lists the backlog, and each plan's Resume state is its detail. What merged is in `git log`, and what was released is in [CHANGELOG.md](../../CHANGELOG.md).

## Main

- The last release is 0.14.0 (`v0.14.0`). The CHANGELOG holds 0.14.1 as unreleased.
- The last code merge on main is PR #114 (`04dced9a`), host/126. PR #112 (daemon/29) and PR #113 (the MayCXC fork plans, host/127 to host/130) merged before it.
- The README is rewritten for people who run ahpd (`a22c1934`). The brief it came from is `ahp-review/ahpd-review/ahpd-readme-2026-10-27/`.
- No PR is open on `softov/ahpd`.
- `/github/ahpd` is a detached HEAD, and the tree is clean. Fetch, and check the base before you cut a build worktree.
- Softov's dev daemon runs from source on port 37537. He restarted it after #114.
- Code goes through a PR on `softov/ahpd`. Plan-only commits go to main. Run `gh pr checks` with `-R softov/ahpd` outside a repo.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by every test run. Restore it with `git checkout --` and never print it.
- On this machine, two Docker tests time out: `computer-devcontainer` and `computer-disposable`. They time out on main too, and CI passes them.
- The build worktrees in `/github/ahpd.worktrees/` are `2b9d078e` (proxy/06), `95b91bec` (plugin/63), `ecd04033`, `fda88f4a` (the old container/05 p8) and `plans-main`. The first three are merged and can go on Softov's word. Check `ss -ltnp` before you start a test daemon, and stop it by pid.
- The local branch `fork/maycxc-24-25-26-127-128` is the closed PR #110. It is not on main, and #113 replaced it.

## Waiting for Softov

- After the daemon restart, open a terminal in ahpw and in ahpc. `supportsCommandDetection` is now false until the shell prints its first mark.
- host/126: review. ahpc and ahpw must create `ahp-session:` sessions.
- daemon/29: the final checklist in its plan.
- host/121: the checks by hand in its plan's Resume state.
- plugin/71: [pending/plugin-71-sign-in-checks.md](../pending/plugin-71-sign-in-checks.md).
- daemon/41 on Windows: [pending/daemon-41-windows-checks.md](../pending/daemon-41-windows-checks.md).
- host/123: [pending/host-123-engines-checks.md](../pending/host-123-engines-checks.md).
- host/122: [pending/host-122-agent-records-checks.md](../pending/host-122-agent-records-checks.md).
- proxy/05: [pending/proxy-05-model-checks.md](../pending/proxy-05-model-checks.md).
- proxy/06: [pending/proxy-06-endpoint-checks.md](../pending/proxy-06-endpoint-checks.md).
- plugin/63: [pending/plugin-63-model-list-checks.md](../pending/plugin-63-model-list-checks.md).
- proxy/04: icon curation, and [pending/proxy-04-move-config-dev.md](../pending/proxy-04-move-config-dev.md).
- plugin/58: task 05 waits for [pending/plugin-58-icon-curation.md](../pending/plugin-58-icon-curation.md).
- plugin/50: [pending/plugin-50-first-pieces.md](../pending/plugin-50-first-pieces.md).
- The `active` plans with all tasks implemented wait for his review. Each stays `active` until he says his review is done.

## Next builds

- Planned with tasks: container/05 p8 and container/05 p10.
- The ahpw Connect button for plugin/71 is ahpw plan plugins/09, planned.

## Outside this repository

- ahp-review: commit `6471a79` holds the README brief. It is not pushed.
- ahpc is level with origin. What ahpc lacks against ahpd is in `ahp-review/briefs/ahpc-catch-up.md`.
- ahpw is clean on main, on scena `^0.5.14`, and its agent and connector forms have a YAML view.
- scena 0.5.14 is on npm, and its tree is clean.
- The fork's shell integration branch is kept locally as `fork/host-124-shell-integration`. `ahp-review/briefs/agent-terminal-tool.md` says how to redo it on main, and its questions wait on Softov.
- A test session `claude-deepseek:/845c1908-…` is still on Softov's daemon. Remove it only when he says so.
- The preset allow-list edit in `~/.config/ahpd/agents/claude-deepseek-build.json` waits on Softov.

## By Softov's hand

The checks in [pending/](../pending/).
