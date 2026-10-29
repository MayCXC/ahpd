---
title: A Claude turn begun after a client announced its tools is offered them - implemented
date: 2026-10-28
refs:
  - git://d6f19e20
  - "[code://packages/agent-claude/src/session/clienttools.ts](../../../../packages/agent-claude/src/session/clienttools.ts)"
  - "[code://packages/agent-claude/src/session/turns.ts](../../../../packages/agent-claude/src/session/turns.ts)"
---

A Claude turn that a client starts after announcing its tools sends its prompt once the CLI has those tools.
Changes of tools reach the CLI one at a time, in the order they came.

## What was built

- [`code://packages/agent-claude/src/session/context.ts`](../../../../packages/agent-claude/src/session/context.ts) - `retooling`, the change of tools the CLI has not finished taking.
- [`code://packages/agent-claude/src/session/clienttools.ts`](../../../../packages/agent-claude/src/session/clienttools.ts) - `retool` sends one change; `setTools` sends it at once when no change is in hand and after the one in hand otherwise, and holds it as `retooling` until it lands.
- [`code://packages/agent-claude/src/session/turns.ts`](../../../../packages/agent-claude/src/session/turns.ts) - `beginTurn` waits for `retooling` under `beginning`, and stops if the session closed meanwhile.
- [`code://packages/agent-claude/test/agent-claude-tools-before-turn.test.ts`](../../../../packages/agent-claude/test/agent-claude-tools-before-turn.test.ts) - three cases over a fake SDK that answers `setMcpServers` when the test says and connects only a server name it does not have.

## Verified

- `agent-claude-tools-before-turn.test.ts`: the turn after one change and the turn after two changes failed on the code before the task, and pass; the turn with no change in hand passed before and after.
- The agent-claude client tool cases pass: contributed tools and schemas, a client gone, declarations, host tools, MCP.
- The sdk cases that announce a client's tools to a Claude session pass: host tools, catalogue, names, client plugins, a remote session.
- agent-claude 428 passed, sdk 3683 passed and 2 skipped, server 1632 passed and 2 skipped, at one worker, once, with the plan that hands a prompt to the CLI that replaced another beside this one.
- Typecheck, boundary, the build of every package and the schema are clean.

## Departures from the plan

- None.

## Left for later

- None.
