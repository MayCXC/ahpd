---
title: Every agent gets web search and fetch
created: 2026-10-29
refs:
  - "[code://packages/agent-cofold/src/capabilities.ts#L63-L73](../../packages/agent-cofold/src/capabilities.ts#L63-L73) - cofold's search providers, the only search ahpd has"
---

A `web` plugin registers two host tools, `web_search` and `web_fetch`, so claude, acp, cofold and pi all get them through `Start.tools`.
Search has providers that the user can change, such as Exa or Perplexity, tried in the configured order.
Fetch needs no provider: it gets a URL over HTTP and gives back its text.
Today only cofold searches the web, through its own tools.

Related: [cofold runs its own tools](../plans/plugin/14-cofold-runs-its-own-tools/plan.md).
