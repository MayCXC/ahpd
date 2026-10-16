---
title: A remote session is taken and keeps its origin - deferred
date: 2026-10-11
---

The origin instruction reaches a model only through Claude's own door, and three backends have no such door yet.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| The per-turn instruction in `packages/agent-acp` | The bridge hands a prompt to another agent, which owns its own system prompt and takes no context beside it | unplanned |
| The per-turn instruction in `packages/agent-cofold` | The harness is built fresh for each turn, but the host's words are read off the `Start` the session began with | unplanned |
| The per-turn instruction in `packages/agent-pi` | Pi appends the host's instructions to its system prompt when the session starts, and re-declares none per turn | unplanned |
