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

- `build-agents-43e9af27`: host/83 p1, then p2, then p3.
- `build-agents-28f4e28f`: host/83 p4.
- `build-agents-e8df3a4a`: daemon/20.

Each one leaves its work uncommitted. It is reviewed and committed after it is built.

## Awaiting Softov's review

When a plan is reviewed, each of its `implemented` tasks becomes `done`. Each review file says what to read, what to check and what to reply.

- [plugin-45-p2-review.md](../review/plugin-45-p2-review.md): bots are Markdown files.
- [host-80-review.md](../review/host-80-review.md): automations are Markdown files.

## Open questions for Softov

- An upstream Pass 6: VS Code has 268 agentHost commits since Pass 5 (`7516b04bc94`).
- Push sends `A session finished` when a turn completes, and no plan records it. Offer a task or a plan.

## By Softov's hand

- daemon/13 restart checks, host/56 task 05, container/02 tasks 01-03 (Windows VS Code run), container/05 p9 task 06 on dev02.
- The Modal title copy button needs a scena change.

## Next builds

- container/05 p9 tasks 02, 03 and 05; task 07 waits on 06.
- host/83 p5, after p1 to p3 are built.

## Reviews

- [2026-09-19-upstream-pass-4.md](../review/2026-09-19-upstream-pass-4.md)
- [daemon-13-restart-checks.md](../review/daemon-13-restart-checks.md)
