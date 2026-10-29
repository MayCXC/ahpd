---
title: A minute limit counts over a sliding window
created: 2026-10-29
refs:
  - file:///github/ahpd/.project/plans/policy/20261029-2013-a-limit-counts-per-minute/plan.md - the plan that counts a minute as a fixed window
---

The minute meter counts a fixed window, so a caller can make twice the limit across the edge of two minutes.
A sliding window weighs the last bucket by the part of it still inside the window.
It closes that gap with the same two buckets.
