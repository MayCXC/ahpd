---
title: Captures are taken and read with ahpc, and ahpd keeps no proxy or capture check - deferred
date: 2026-10-11
---

The plan waits, because ahpd's capture scripts debug ahpd and stay in ahpd until a user needs a tester.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| Task 01, remove `scripts/tee.mjs`, `tools/validate.mjs` and `pnpm wire`, and point the docs at ahpc | ahpc decision `ahpds-capture-scripts-stay-in-ahpd` supersedes `the-recording-proxy-is-ahpcs`; ahpc cli/02 is dropped. | unplanned; this plan |
