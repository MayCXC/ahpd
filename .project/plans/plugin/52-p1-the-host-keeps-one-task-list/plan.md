---
title: The host keeps one task list
domain: plugin
status: draft
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/plugin/52-a-bot-manages-and-delegates/plan.md
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L620](../../../../packages/sdk/src/types/plugin.ts#L620) - `PluginHost.records`, a record collection to keep tasks in"
  - "[code://packages/bot/src/plugin.ts#L51-L57](../../../../packages/bot/src/plugin.ts#L51-L57) - the bot plugin keeps its records this way"
  - "[code://packages/sdk/src/tools/session.ts#L447](../../../../packages/sdk/src/tools/session.ts#L447) - a host tool to mirror for the task tools"
---

## Goal

The host keeps one list of tasks for all bots and people.
A task has a title, a status, a priority, labels, a topic and a creation date.
A task can name its bot, its project folder and the session that works on it.
An agent reads and writes tasks with host tools, and a client shows the list.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Gaps

- No task record and no task tools.
- No command or client view lists tasks.

## Answers

| What | Source | Task |
| --- | --- | --- |
| One list on the host, and the bot is a field of a task | Softov, 2026-10-16, chose "One host list, bot as a field" | - |
| A task has a title, status, priority, labels, topic and creation date | Softov, 2026-10-16, "With a priority and labels for topic or labels and topic, date creation and status" | - |
| A task's status is `todo`, `doing`, `review`, `done` or `dropped` | Softov, 2026-10-16, chose "todo, doing, review, done, dropped" for "Which statuses does a task have?" | - |
| The task list is a plugin of its own, with records and host tools | Softov, 2026-10-16, chose "A plugin of its own" for "Where does the task list live?" | - |
| Every user of the host sees every task, for now | Softov, 2026-10-16, "for now everyone. latter we refine." for "Who sees a task on the host list?" | - |

## Resume state

- **Done so far:** draft written 2026-10-16. No tasks yet.
- **Next action:** ask the open questions, then write the tasks.
- **Open questions:** none.
- **Watch out for:** the session ids on a task must stay valid after a session is removed, so a task keeps the id as text.
