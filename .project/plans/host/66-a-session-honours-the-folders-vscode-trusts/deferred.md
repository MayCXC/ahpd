---
title: A session honours the folders VS Code trusts - deferred
date: 2026-10-06
---

What this plan leaves to other repositories, so those clients behave differently until it lands.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| ahpc pushes `workspaceTrust` | until it does, an ahpc session is untrusted and loads no project hooks, settings, plugins, MCP servers or `CLAUDE.md` ([the decision](../../../../docs/sdk/AUTHENTICATION.md)) | a plan in the ahpc repository |
| ahpapp pushes `workspaceTrust` | the same, for an ahpapp session | a plan in the ahpapp repository |
