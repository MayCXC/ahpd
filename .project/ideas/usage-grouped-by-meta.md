---
title: Usage is grouped by a meta entry
created: 2026-10-29
refs:
  - file:///github/ahpd/.project/plans/usage/20261029-2011-a-record-names-its-key-and-meta/plan.md - the plan that writes `meta` on each record
---

A usage record carries the meta entries of its key and of its `X-AHP-Meta` header.
`ahpd usage` could then group and filter by one entry, such as `customer` or `job`.
A team then sees what each service or customer cost.
