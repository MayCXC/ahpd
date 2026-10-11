---
title: "Handoff: where ahpd stands, and what is pending"
---

# Handoff: where `ahpd` stands, and what is pending

Current progress and pending items only, as of 2026-10-11.
[plans/index.md](../plans/index.md) is the backlog and each plan's Resume state is its detail; what merged is in `git log`.

## Main

- `main` is at `9c5e31d` and pushed. CI is green on it (run 38132745654, 3m24s).
- The version is still 0.10.0, with 152 commits since the `v0.10.0` tag. The bump and the tag are Softov's.
- The review of 2026-10-10 found four release blockers, and all four are still open:
  - `bot` and `push` are not in `PUBLISHED` in `release.yml`.
  - The plugins' `sdk` peer range is `>=0.10`.
  - `packages/push` has no LICENSE.
  - The decision `the-whole-workspace-is-published` still says eight packages.
- CI runs `test:unit` in the `check` job and `test:processes` in the `processes` job. If `processes` nears its 300 s limit, the next file to move out is `computer-git-fetch`.

## Push

- `9c5e31d` sends `A session finished` when a session's own chat completes a turn, with `data.kind` `turnComplete`. A cancelled turn and a subagent chat send nothing. See [`packages/push/README.md`](../../packages/push/README.md).
- No plan records it yet. [plugin/33](../plans/plugin/33-a-phone-hears-a-session-needs-a-person/plan.md) is `built` and covers only the wait. Offer Softov a task or a plan.
- The daemon needs a restart in Softov's terminal to load it.

## Build worktrees

Every build branch is merged into `main` and has no commit of its own left. Remove each worktree and its branch, and keep the sessions.

| Worktree | Branch head | State |
|---|---|---|
| `build-agents-0f517bb0` | `8d7f781` | [daemon/18](../plans/daemon/18-the-api-answers-to-the-origins-a-deployment-names/plan.md), `built`. Clean. |
| `build-agents-3526294c` | `e01e889` | [plugin/18](../plans/plugin/18-the-acp-bridge-resumes-forks-and-asks/plan.md) tasks 05-06, `built`. Clean. |
| `build-agents-485f9aa5` | `b49d247` | container/05 p10 plan and the host/79 merge. Clean. |
| `build-agents-f8d0dae8` | `7dc2a70` | plugin/18 tasks 01-04. Clean. |
| `daemon-19` | `9d64f99` | [daemon/19](../plans/daemon/19-a-plugin-is-known-by-its-id/plan.md), `built`. Only a regenerated `wire.jsonl` is changed: discard it. |

## Plans to close

- 57 task files under 13 built plans were reviewed against `main` on 2026-10-10 and are `done`.
- Two tasks stay `implemented` and wait for Softov:
  - [host/46 task 01](../plans/host/46-built-in-surfaces-are-advertised-for-role-control/plan.md): holding the session group does not cover the chat group.
  - [host/52 task 05](../plans/host/52-deleting-a-session-deletes-the-backends-copy/plan.md): waits on Softov.
- `active` without `implemented.md`: [daemon/13](../plans/daemon/13-ahpd-restart/plan.md), [host/56](../plans/host/56-the-catalogue-answers-at-once-and-a-summary-is-sent-when-it-changes/plan.md), [container/02](../plans/container/02-vscode-offers-our-dev-container/plan.md), [container/05 p9](../plans/container/05-an-agent-in-a-machine-p9-an-ssh-machine-runs-a-nested-host/plan.md).

## Reviews

- [2026-09-19-upstream-pass-4.md](../review/2026-09-19-upstream-pass-4.md)
- [daemon-13-restart-checks.md](../review/daemon-13-restart-checks.md)
- [host-56-measure.md](../review/host-56-measure.md)

## By Softov's hand

- daemon/13 restart checks, host/56 task 05, container/02 tasks 01-03 (Windows VS Code run), container/05 p9 task 06 on dev02.

## Next builds

- [host/79](../plans/host/79-a-quiet-session-sleeps-and-wakes/plan.md) and [plugin/46](../plans/plugin/46-an-admin-makes-a-bot-for-any-owner/plan.md) are merged and `active`: review them, then close them.
- container/05 p9 tasks 02, 03 and 05; task 07 waits on 06.
- plugin/19, now that plugin/18 is built; container/05 p8, p10, p11, p12; host/33 task files; documentation/02 waits on ahpc cli/02.
- To offer: a VS Code parity host plan (`runCancellation`, `runHistoryLimit`, `customizations`, `_meta.hostBuild`, `vscode.agentHost.resources`, `agentCustomizationSettings`, `remoteSessions`, `completionTriggerCharacters`).

## Open with Softov

- host/79 is merged, so the next ahpd restart puts idle sessions to sleep. Until then, the idle claude processes stay.
- The dev container stop problem, VS Code "No models available", the stale `wire.jsonl` fixture, the unset `ANTHROPIC_API_KEY`, the papo flaky-test offer, the ahpc cancel bug.
- Open problems are in [problems/](../problems/).
