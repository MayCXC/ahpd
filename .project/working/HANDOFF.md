---
title: "Handoff: where ahpd stands, and what is pending"
---

# Handoff: where `ahpd` stands, and what is pending

Current progress and pending items only, as of 2026-10-31.
`node ~/.claude/skills/do-spec/scripts/plans.mjs` lists the backlog, and each plan's Resume state is its detail. What merged is in `git log`, and what was released is in [CHANGELOG.md](../../CHANGELOG.md).

## Main

- The last release is 0.14.0 (`v0.14.0`). The CHANGELOG holds 0.14.1 as unreleased.
- On 2026-10-30, seven PRs merged on green CI, Windows included:
  - #156: a dispatch that throws is refused.
  - #157: a targeted token reaches only its server.
  - #159: a token reaches only the sessions its connection watches (the head of #158).
  - #160: a record agent runs in a machine.
  - #161: only the echo carries the origin.
  - #151: container/05 p8, a profile's machines on another server's Docker.
  - #162: the VM plan, a VM made by libvirt or Proxmox. Nothing has run on a real hypervisor yet.
- On 2026-10-31, five PRs merged on green CI, Windows included:
  - #163: CI stages a pre-release under the `next` dist-tag.
  - #164: host/20261031-0211, every client action is answered.
  - #165: claude/20261031-0228, a skill names its own file.
  - #166: claude/20261031-0258, a written agent shows at once.
  - #167: daemon/20261031-0555, an installed ahpd is found outside bash. The install script reaches people at the next release, because ahpio-site copies it from the newest `v*` tag.
- The last code merge on main is #167 (`f8c27994`).
- #158 was based on the #157 branch, so its merge went into that branch and never reached main. #159 took the same head into main. Check `baseRefName` before you merge a stacked fork PR.
- Disposing a session that this process does not hold leaves its disposable machine behind. The `held === undefined` branch in `lifecycle.ts` never calls `leaveForgotten`. It is on main from before p8: [problems/a-disposed-session-not-held-leaves-its-machine.md](../problems/a-disposed-session-not-held-leaves-its-machine.md).
- The README is rewritten for people who run ahpd (`a22c1934`). The brief it came from is `ahp-review/ahpd-review/ahpd-readme-2026-10-27/`.
- `/github/ahpd` is on main with one local commit that is not pushed: `1965724e` (briefs: send an empty writable directory, and reload skills with agents). Softov wrote it. Leave it for him.
- Fetch, and check the base before you cut a build worktree.
- Softov's dev daemon runs from source on port 37537. He restarted it after #114.
- Code goes through a PR on `softov/ahpd`. Plan-only commits go to main. Run `gh pr checks` with `-R softov/ahpd` outside a repo.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by every test run. Restore it with `git checkout --` and never print it.
- On this machine, two Docker tests time out: `computer-devcontainer` and `computer-disposable`. They time out on main too, and CI passes them.
- The worktrees in `/github/ahpd.worktrees/` are `build-agents-fda88f4a` (the old container/05 p8), `review-maycxc-union` and `vm`. The last two are merged, and they wait for Softov's word to remove. Check `ss -ltnp` before you start a test daemon, and stop it by pid.
- The local branch `fork/maycxc-1248-1303-1334` is merged.

## Waiting for Softov

- Restart the daemon for #164 to #167. One restart covers all four: a stale removal is refused, Claude sessions list their real files, a written customization shows without a restart, and npm runs beside the daemon's Node.
- claude/20261031-0228: [pending/claude-skill-file-checks.md](../pending/claude-skill-file-checks.md).
- claude/20261031-0258: [pending/claude-reload-checks.md](../pending/claude-reload-checks.md).
- daemon/20261031-0555: [pending/install-path-checks.md](../pending/install-path-checks.md).
- host/20261031-0211, claude/20261031-0228, claude/20261031-0258 and daemon/20261031-0555: review. Each is `implemented`.
- host/114, host/116 and x-ahpd/me: review. x-ahpd/me gives `kind` a third value, `plugin`, which the plan did not name.
- After the daemon restart for #156 to #161 and #151, open a terminal in ahpw and in ahpc. `supportsCommandDetection` is now false until the shell prints its first mark.
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
- The VM plan, task 01: [pending/vm-01-dev02-libvirt.md](../pending/vm-01-dev02-libvirt.md). The checks by hand of tasks 03 and 05 follow it.
- The VM plan, task 06: [pending/vm-06-proxmox-node.md](../pending/vm-06-proxmox-node.md), when a Proxmox node is named.
- The `active` plans with all tasks implemented wait for his review. Each stays `active` until he says his review is done.
- Three `active` plans look ready to close on his word: host/83, host/99 and plugin/69. The plan host/83 has p1 to p5 built, and host/99 has every task done. PR #104 merged plugin/69 tasks 05 and 06, which are still `implemented`.
- plugin/71 has no `implemented.md`, though its tasks are implemented.
- container/02 has three tasks `blocked`. container/05 stays `active` while p8 and p10 are `planned`.
- plugin/54 and plugin/56 are `planned` and wait on plugin/53.

## Next builds

- The VM plan `20261030-1141-a-vm-is-made-on-a-server` has its code merged. It waits on the checks by hand above.
- container/05 p10 (task 03 next).
- The ahpw Connect button for plugin/71 is ahpw plan plugins/09, planned.

## Outside this repository

- ahp-review: commit `6471a79` holds the README brief. It is not pushed.
- ahpc is level with origin. What ahpc lacks against ahpd is in `ahp-review/briefs/ahpc-catch-up.md`.
- ahpw plan plugins/09 is built and not committed. It waits for Softov's review and the PR text.
- ahpw is on main, on scena `^0.5.14`, and its agent and connector forms have a YAML view.
- scena 0.5.14 is on npm, and its tree is clean.
- The fork's shell integration branch is kept locally as `fork/host-124-shell-integration`. `ahp-review/briefs/agent-terminal-tool.md` says how to redo it on main, and its questions wait on Softov.
- A test session `claude-deepseek:/845c1908-…` is still on Softov's daemon. Remove it only when he says so.
- The preset allow-list edit in `~/.config/ahpd/agents/claude-deepseek-build.json` waits on Softov.

## By Softov's hand

The checks in [pending/](../pending/).
