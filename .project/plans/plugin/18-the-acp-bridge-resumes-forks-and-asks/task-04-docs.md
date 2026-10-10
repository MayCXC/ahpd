---
title: The plugin docs say what the ACP bridge resumes, forks and asks
status: done
depends: [task-01-a-resume-does-not-replay.md, task-02-a-session-forks-where-the-server-can.md, task-03-a-servers-question-is-asked-in-the-chat.md]
layer: "docs"
refs:
  - "[code://docs/PLUGINS.md#L750-L866](../../../../docs/PLUGINS.md#L750-L866) - the ACP worked example and what the server may ask the host for"
---

## Objective

`docs/PLUGINS.md` says when the bridge resumes and when it loads, that a fork is of the last turn only, and that a server's question is an input request.

## Files

- `UPDATE: docs/PLUGINS.md:900-1062` - three short paragraphs in the ACP section, and a row in the table of what the server may ask the host for.
- `UPDATE: packages/agent-acp/README.md` - the package's own account of the question, and of what a cancel answers.

## Steps

1. One paragraph per behaviour, wrapped as the ACP section already is; no em dash.

## Validation

- Read against the code by hand.

## Resume

- The ref's line range had moved: the ACP worked example is `docs/PLUGINS.md` 900-1062 now, and what the server may ask the host for is at 1013.
- The resume and the fork paragraphs went at the end of the worked example, after the paragraph about a server that dies and reopens, which is where reopening is already described. The question paragraph went into `### What the server may ask the host for`, after the permission ones.
- The question also got a row in the table above it, `elicitation/create` answered by a `chat/inputRequested` question and advertised always. That is a fourth paragraph's worth of change beyond the three the file asks for, and it is there because the table is where a reader looks for what a server may ask, and left as it was it would have named four requests to a bridge that answers five.
- Wrapped at the width the section's prose uses, and written without an em dash.
- Beyond the file the task names, `packages/agent-acp/README.md` got the same treatment for what this plan added there: a paragraph for the question beside the permission one, and the clause about what a `cancel` answers made to cover a question as well as a permission. It is the package's own account of what it does, and both places were left claiming things the bridge no longer does. Its paragraph about a session this process never watched still describes only the load, which is what that case is; the resume and the fork are described in `docs/PLUGINS.md`.
