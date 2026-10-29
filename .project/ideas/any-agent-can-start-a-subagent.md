---
title: Any agent can start a subagent
created: 2026-10-29
refs:
  - "[code://packages/sdk/src/types/agent.ts#L453](../../packages/sdk/src/types/agent.ts#L453) - the seam only agent-claude uses, for Claude's own Task tool"
  - "[code://packages/sdk/src/tools/session.ts#L446](../../packages/sdk/src/tools/session.ts#L446) - create_session starts an agent, but the parent hears nothing back"
---

A host `subagent` tool starts any ahpd agent as a child of the calling session, whatever agent the parent is.
Today only agent-claude has subagents, and agent-acp, agent-cofold and agent-pi have none.
The child runs in the background, and its closing message comes back to the parent as a new message.
The host keeps the record of children, so it does not depend on one CLI's own files.
AHP already has `ChatOrigin` of kind `Tool` and `ToolResultSubagentContent` for this.

Related: [a background task has one shape](../plans/host/115-a-background-task-has-one-shape/plan.md).
