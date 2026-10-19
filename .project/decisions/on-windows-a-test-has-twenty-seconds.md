---
title: On Windows, a test has twenty seconds
status: accepted
date: 2026-10-19
refs:
  - "[code://vitest.config.ts](../../vitest.config.ts) - `testTimeout`, the suite's limit per case"
---

## Context

The Windows job runs the whole unit suite, and the suite starts thousands of processes: git, shells, fixture servers.
Starting a process on Windows takes several times what it takes on Linux, so the cases that do so sit near the default five seconds there.
On the last three Windows runs, a different two to four of them crossed it each time, and every one passed alone.

## Decision

On Windows, a test case has twenty seconds; on every other system it keeps the default five.
The limit is set once, in `vitest.config.ts`, and a case adds its own limit only for a reason that holds on Linux too.
Source: Softov, 2026-10-19, asked "How should the Windows run handle slow, process-heavy tests that sit near the 5 s limit?": "20 s on Windows (Recommended)".

## Consequences

A slow case on a busy Windows runner passes, and a local run on Windows uses the same limit.
A case that hangs on Windows fails after twenty seconds rather than five.
A case that grows slow is still caught on Linux, where the limit stays five seconds.
The per-case limits that were there for Windows alone go.

## Options

- **Fewer workers on the Windows job.** Lost: the job, about 390 s now, would run longer and could pass its 600 s bound.
- **A limit on each slow case as CI shows it.** Lost: each run shows a different few, so every one costs another round.
