---
title: The operator sets the environment of agent shells - deferred
date: 2026-10-11
---

The plan reaches host terminals and Claude's Bash only, as Softov chose. Each other backend gets `Start.shellEnv` and does nothing with it yet.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| `shellEnv` in `packages/agent-acp` | Softov chose host terminals and Claude for this plan | unplanned |
| `shellEnv` in `packages/agent-cofold` | Softov chose host terminals and Claude for this plan | unplanned |
| `shellEnv` in `packages/agent-pi` | Softov chose host terminals and Claude for this plan | unplanned |
