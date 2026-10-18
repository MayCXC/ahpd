---
title: The upstream text is shown to Softov
status: todo
depends: [task-03-the-plan-channel-holds-a-plan.md]
layer: "proposals"
refs:
  - "[code://.project/proposals/agent-host-protocol-extension-methods.md](../../../../.project/proposals/agent-host-protocol-extension-methods.md) - an upstream proposal, the shape to copy"
  - "[code://.project/proposals/index.md](../../../../.project/proposals/index.md) - the list of proposals and whether each is filed"
  - https://github.com/microsoft/agent-host-protocol - the protocol the plan channel is proposed to
---

## Objective

A proposal for a plan channel in the protocol is written from the shipped `x-ahpd` channel.
Softov reads the text in chat, and nothing is filed.

## Files

- `CREATE: .project/proposals/agent-host-protocol-plan-channel.md` - the proposal: the need, the state, the actions, and the shipped `x-ahpd` shape.
- `UPDATE: .project/proposals/index.md` - a row for the proposal, with `no` in `Filed`.

## Steps

1. Write the proposal from the channel of task 03, with its state and each action.
2. Cite only ahpd code, VS Code and the protocol repository as evidence.
3. Add the row to `.project/proposals/index.md`, with `no` in `Filed`.
4. Show the whole text to Softov in chat.
5. Do not file an issue or a pull request.

## Validation

- The proposal names the same state and actions as `packages/tasks/src/channel.ts`.
- Softov saw the text in chat, and `Filed` reads `no`.

## Resume
