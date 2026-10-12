---
title: "Handoff: where ahpd stands, and what is pending"
---

# Handoff: where `ahpd` stands, and what is pending

Current progress and pending items only, as of 2026-10-11.
[plans/index.md](../plans/index.md) is the backlog and each plan's Resume state is its detail; what merged is in `git log`, and what was released is in [CHANGELOG.md](../../CHANGELOG.md).

## Main

- 0.11.0 is released: tag `v0.11.0`, release run 38184535861, and all ten packages on npm. `@ahpd/bot` and `@ahpd/push` are published for the first time.
- The four release blockers of 2026-10-10 are closed. The decision `the-whole-workspace-is-published` still says eight packages; it was true when written, and `PUBLISHED` now names ten.
- Softov's daemon runs the 0.11.0 code. Its bots and automations are Markdown files now, and the originals are kept as `.migrated`.
- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by every test run. Restore it before a commit.

## Build worktrees

None. Every build branch is merged and removed. The build sessions are kept.

## Awaiting Softov's review

When a plan is reviewed, each of its `implemented` tasks becomes `done`.

- [plugin/45 p2](../plans/plugin/45-a-plugin-keeps-records-in-the-host-store-p2-the-bot-keeps-its-records-there/plan.md): bots are Markdown files.
- [host/80](../plans/host/80-an-automation-is-a-markdown-file/plan.md): automations are Markdown files.
- [daemon/19](../plans/daemon/19-a-plugin-is-known-by-its-id/plan.md): a plugin is known by its id.
- [host/79](../plans/host/79-a-quiet-session-sleeps-and-wakes/plan.md): a quiet session sleeps and wakes. It also has checks by hand.
- [host/46 task 01](../plans/host/46-built-in-surfaces-are-advertised-for-role-control/plan.md) and [host/52 task 05](../plans/host/52-deleting-a-session-deletes-the-backends-copy/plan.md).

## Open questions for Softov

- [host/83 p4](../plans/host/83-the-host-matches-vscodes-host-p4-a-customization-is-switched-for-all-sessions/plan.md): where a global or folder customization switch is kept, and whether it applies to every provider.
- [host/83 p5](../plans/host/83-the-host-matches-vscodes-host-p5-a-chat-is-attached-to-a-message/plan.md): whether `#chat:` is built now.
- An upstream Pass 6: VS Code has 268 agentHost commits since Pass 5 (`7516b04bc94`).
- Push sends `A session finished` when a turn completes, and no plan records it. Offer a task or a plan.

## By Softov's hand

- daemon/13 restart checks, host/56 task 05, container/02 tasks 01-03 (Windows VS Code run), container/05 p9 task 06 on dev02.
- The Modal title copy button needs a scena change.

## Next builds

- [host/83 p1](../plans/host/83-the-host-matches-vscodes-host-p1-the-host-describes-itself/plan.md), then p3; [host/83 p2](../plans/host/83-the-host-matches-vscodes-host-p2-a-run-is-stopped-and-runs-are-capped/plan.md) can start now that host/80 is merged.
- container/05 p9 tasks 02, 03 and 05; task 07 waits on 06.
- [daemon/20](../plans/daemon/20-stop-and-restart-reach-a-daemon-on-windows/plan.md): stop and restart on Windows.

## Reviews

- [2026-09-19-upstream-pass-4.md](../review/2026-09-19-upstream-pass-4.md)
- [daemon-13-restart-checks.md](../review/daemon-13-restart-checks.md)
- [host-56-measure.md](../review/host-56-measure.md)
