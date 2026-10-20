---
title: The spec says where a machine session's terminal runs
status: todo
depends: [task-01-a-terminal-in-a-machine-runs-in-the-machine.md]
layer: docs
refs:
  - "[code://.project/specs/agent-backends.md#L126-L128](../../../../.project/specs/agent-backends.md#L126-L128) - \"`Start.terminals.open` opens a host terminal that a client can watch\""
  - "[code://docs/plugins/COMPUTERS.md#L127-L132](../../../../docs/plugins/COMPUTERS.md#L127-L132) - the backends that enter a machine, which say nothing of terminals"
---

## Objective

The spec and the computer docs say that a terminal an ACP agent in a machine asks for runs in the machine, and is still the host's terminal to list and watch.

## Files

- `UPDATE: .project/specs/agent-backends.md:126-128` - an `AND` line after line 128: for a session placed in a machine, the terminal's command runs in the machine through `computers.how`.
- `UPDATE: docs/plugins/COMPUTERS.md:127-132` - the ACP row says its terminals run in the machine too.

## Steps

1. Correct the spec in place, citing decision `an-acp-agents-terminal-in-a-machine-runs-in-the-machine`.
2. Add the sentence to the docs' ACP row.

## Validation

- `pnpm docs:build`, or the docs check the repository runs, passes.

## Resume
