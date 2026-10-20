---
title: The host keeps one task list
domain: plugin
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-18
requires:
  - plans/plugin/52-a-bot-manages-and-delegates/plan.md
changes: []
creates: []
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L692](../../../../packages/sdk/src/types/plugin.ts#L692) - `PluginHost.records`, a record collection to keep tasks and plans in"
  - "[code://packages/sdk/src/types/records.ts#L31-L49](../../../../packages/sdk/src/types/records.ts#L31-L49) - `CollectionOptions`, whose `body` keeps a record's long text as the Markdown body"
  - "[code://packages/bot/src/plugin.ts#L65-L83](../../../../packages/bot/src/plugin.ts#L65-L83) - `defaults` and `optionsSchema`, the shape of a plugin's settings with defaults"
  - "[code://packages/bot/src/plugin.ts#L328](../../../../packages/bot/src/plugin.ts#L328) - `apply`, a plugin that opens collections and registers a tool"
  - "[code://packages/bot/package.json](../../../../packages/bot/package.json) - the package layout and the `ahpd` manifest to copy"
  - "[code://packages/bot/src/post.ts](../../../../packages/bot/src/post.ts) - a host tool a plugin registers"
  - "[code://packages/sdk/src/tools/session.ts#L280-L282](../../../../packages/sdk/src/tools/session.ts#L280-L282) - `allowed`, the grant check a host tool makes"
  - "[code://packages/sdk/src/tools/session.ts#L443-L500](../../../../packages/sdk/src/tools/session.ts#L443-L500) - `create_session`, a host tool to copy the pattern of"
  - "[code://packages/sdk/src/types/host.ts#L768-L793](../../../../packages/sdk/src/types/host.ts#L768-L793) - `ToolCall`, which names the session and not the person"
  - "[code://packages/sdk/src/host/tooling.ts#L1370-L1376](../../../../packages/sdk/src/host/tooling.ts#L1370-L1376) - `toolContext`, where a call's context is built"
  - "[code://packages/sdk/src/host/spawn.ts#L297-L302](../../../../packages/sdk/src/host/spawn.ts#L297-L302) - the host keeps the sender of each turn"
  - "[code://package.json](../../../../package.json) - the root build script names each package"
  - "[code://.github/workflows/release.yml](../../../../.github/workflows/release.yml) - `PUBLISHED`, the packages a release publishes"
  - "[code://docs/.vitepress/config.mts#L60-L77](../../../../docs/.vitepress/config.mts#L60-L77) - the plugin pages in the docs sidebar"
---

## Goal

The host keeps one list of tasks and plans for all bots and people, in a tasks plugin of its own.
A task has a title, a status, a priority, labels, a topic, an optional plan, and stamps that say when, who and in which session.
A plan belongs to a folder or a bot, and a task names its plan.
Every agent reads and writes the list with host tools, so Claude, pi, cofold and an ACP server reach the same list.
An approval before an agent starts a task, and a sweep of finished plans, are settings that are off by default.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "records\(" packages/bot/src/plugin.ts` - the bot plugin opens its collections with `host.records`, and a `body` option keeps the long text.
- `rg -n "registerTool" packages/bot/src` - `post_message` is a host tool that a plugin registers.
- `rg -n "sender|principal" packages/sdk/src/types/host.ts` - `ToolCall` has no field for the person behind the call.
- `rg -n "'ahpd.sender'" packages/sdk/src/host` - the host keeps the sender of each turn.

### Runtime path

```
model -> host tool (task_add, task_set, ...) -> tasks plugin -> records `tasks` and `plans` -> one line back to the model
```

### Gaps

- No task record, no plan record and no task tools.
- `ToolCall` does not name the person behind a call, so a tool cannot write `by` on a stamp.
- No plugin package for tasks, and the build, release and docs do not name one.

## Answers

| What | Source | Task |
| --- | --- | --- |
| One list on the host, and the bot is a field of a task | Softov, 2026-10-16, chose "One host list, bot as a field" | 02 |
| A task has a title, status, priority, labels, topic and creation date | Softov, 2026-10-16, "With a priority and labels for topic or labels and topic, date creation and status" | 02 |
| A task's status is `todo`, `doing`, `review`, `done` or `dropped` | Softov, 2026-10-16, chose "todo, doing, review, done, dropped" for "Which statuses does a task have?" | 02 |
| The task list is a plugin of its own, with records and host tools | Softov, 2026-10-16, chose "A plugin of its own" for "Where does the task list live?" | 01 |
| Every user of the host sees every task, for now | Softov, 2026-10-16, "for now everyone. latter we refine." for "Who sees a task on the host list?" | 04, 05 |
| A task may name a plan; a task with no plan stays in the flat list | Softov, 2026-10-18, chose "optional plan" for "Should a p1 task belong to a plan?" | 02, 05 |
| A task also has the status `blocked`, with a note on what it waits for | Softov, 2026-10-18, chose "Yours plus blocked" for "Which statuses does a task have?" | 02, 05 |
| A task keeps five stamps: `created`, `approved`, `started`, `finished`, `reviewed`, each with `at`, `by` and `in`; the host writes them from the caller | Softov, 2026-10-18, chose "All five" for "Does a task keep stamps that say when, who and in which session?" | 03, 05, 06 |
| Approval before an agent starts a task is a setting, off by default | Softov, 2026-10-18, chose "Off" for "What should its default be?" (approval) | 01, 05 |
| A plan made with `plan_create` belongs to its folder or bot, and outlives the session | Softov, 2026-10-18, chose "Its folder or bot" for "Where does a plan made with the host's plan_create belong?" | 04 |
| A done or dropped plan is kept; sweeping after a set time is a setting, off by default | Softov, 2026-10-18, chose "Keep forever" for "Sweeping a done or dropped plan ... What should its default be?" | 01, 02 |
| Anyone may change a plan or task that another session made, for now | Softov, 2026-10-18, chose "Everyone, for now" for "Who may change a plan or task that another session made?" | 05 |
| A task also has `blockedBy` (task ids), `active` (one line while `doing`), `note` (one line), `refs`, `source` (tool and harness id, on a translated task only) and `body` (free text) | (defaulted: the model in the request to write this plan, 2026-10-18) | 02 |
| `reviewed` has an optional `verdict`: `approved` or `changes` | (defaulted: the model in the request to write this plan, 2026-10-18) | 02, 06 |
| A plan has `id`, `scope` (folder or bot), `title`, `goal`, `status` (`draft`, `active`, `done`, `dropped`), `refs`, and the stamps `created`, `approved`, `reviewed` | (defaulted: the model in the request to write this plan, 2026-10-18) | 02 |
| A task names its plan, and a plan does not list its tasks | (defaulted: the model in the request to write this plan, 2026-10-18) | 02 |
| The tools are `plan_create`, `plan_show`, `plan_list`, `task_list`, `task_add`, `task_set`, `plan_approve`, `task_approve` and `task_review`, and each answers in one line | (defaulted: the model in the request to write this plan, 2026-10-18) | 04, 05, 06 |
| `task_list` filters on `status`, `approved`, `ready`, `by` and `since` | (defaulted: the model in the request to write this plan, 2026-10-18) | 05 |
| Approving needs a grant that a person holds | (defaulted: the model in the request to write this plan, 2026-10-18) | 06 |
| A task keeps the session and the project folder as text, so a removed session leaves a valid task | (defaulted: a removed session must not break a task) | 02 |
| pi and cofold reach the tools as host tools, with no change to their packages | (defaulted: a host tool is offered to every session) | 07 |
| `plan_set` sets a plan's title and status, the way `task_set` does for a task | Softov, 2026-10-18, chose "add a `plan_set` tool" for "No tool changes a plan's status or title." | 04 |
| When no person is behind a call, `by` holds the session owner, else `host` | (defaulted: proposed by the planner, 2026-10-18; Softov may change it) | 03 |
| A task id is `t<n>` and a plan id is `p<n>`, counted up per collection | (defaulted: proposed by the planner, 2026-10-18; Softov may change it) | 02 |
| `priority` is `high`, `medium` or `low`, the values of an ACP plan entry, with `medium` as the default | (defaulted: proposed by the planner, 2026-10-18; Softov may change it) | 02 |
| `task_approve` and `plan_approve` both take the grant `task:approve` | (defaulted: proposed by the planner, 2026-10-18; Softov may change it) | 06 |
| `task_review` takes no grant, so a reviewer session can review | (defaulted: proposed by the planner, 2026-10-18; Softov may change it) | 06 |
| The `by` and `since` filters of `task_list` read any of the five stamps | (defaulted: proposed by the planner, 2026-10-18; Softov may change it) | 05 |
| `ready` means `todo`, every task in `blockedBy` is `done`, and `approved` is stamped when approval is on | (defaulted: proposed by the planner, 2026-10-18; Softov may change it) | 05 |
| `finished` is stamped once, at the first of `review`, `done` or `dropped` | (defaulted: proposed by the planner, 2026-10-18; Softov may change it) | 05 |
| `started` is stamped once, at the first `doing` | (defaulted: proposed by the planner, 2026-10-18; Softov may change it) | 05 |
| A sweep removes the tasks that name a swept plan, with the plan | (defaulted: proposed by the planner, 2026-10-18; Softov may change it) | 02 |
| The settings are `requireApproval` (boolean, `false`) and `sweepAfterDays` (integer, absent means keep forever) | (defaulted: proposed by the planner, 2026-10-18; Softov may change it) | 01 |

The rows on Claude, ACP and the translation are in [p12](../52-p12-claude-and-acp-write-the-task-list/plan.md).
The rows on what a client sees are in [p13](../52-p13-a-client-sees-the-task-list/plan.md).

## Proposed architecture

- **Data flow** - a model calls a host tool. The tasks plugin checks the input, writes the stamp from the caller, keeps the record, and answers one line.
- **State flow** - a task is a record of the `tasks` collection, and its `body` is the Markdown body. A plan is a record of the `plans` collection, and its `goal` is the body.
- **Layer responsibilities** - sdk: a `ToolCall` names the person behind the call. tasks: the records, the statuses, the stamps, the two settings and the nine tools.
- **Source-of-truth files** - [`code://packages/sdk/src/types/records.ts`](../../../../packages/sdk/src/types/records.ts), [`code://packages/sdk/src/types/host.ts`](../../../../packages/sdk/src/types/host.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the-tasks-package-has-its-settings](task-01-the-tasks-package-has-its-settings.md) | done | - |
| [02 - tasks-and-plans-are-records](task-02-tasks-and-plans-are-records.md) | done | 01 |
| [03 - a-tool-call-names-its-person](task-03-a-tool-call-names-its-person.md) | done | - |
| [04 - the-plan-tools](task-04-the-plan-tools.md) | done | 02, 03 |
| [05 - the-task-tools](task-05-the-task-tools.md) | done | 02, 03 |
| [06 - approving-and-reviewing-take-a-grant](task-06-approving-and-reviewing-take-a-grant.md) | done | 04, 05 |
| [07 - every-harness-is-offered-the-tools](task-07-every-harness-is-offered-the-tools.md) | done | 06 |
| [08 - the-docs-say-how-the-list-works](task-08-the-docs-say-how-the-list-works.md) | done | 06 |

## Risks and tradeoffs

- Everyone may change every task, so one session can undo the work of another. The stamps say who changed what, and a later plan refines the access.
- A model may try to write a stamp in its input. The tools take no stamp field, so the host is the one writer.
- A sweep removes records for good. It is off by default, and it removes only a plan that is `done` or `dropped`.

## Resume state

- **Done so far:** draft written 2026-10-16. Answers on the model, translation and client view recorded 2026-10-18. Tasks written 2026-10-18. The Claude, ACP and translation rows moved to p12, and the client view rows moved to p13. Open questions answered 2026-10-18. Tasks 01 to 08 are implemented. `packages/tasks` exists with its two settings, the two records, the store and the sweep, and `ToolCall` answers `person()`. All ten tools are registered, with the two approvals behind `task:approve`. pi and cofold are offered every one, and `docs/plugins/TASK-LIST.md` says what the list holds.
- **Review fixes:** a plan gets a `finished` stamp at its first move to `done` or `dropped`. The sweep counts from the newest stamp of the plan and of its tasks. The plugin runs one tool call at a time, so two calls at once cannot share an id. The reference moved to `docs/plugins/TASK-LIST.md`, because `TASKS.md` and `tasks.md` clash on a system that ignores case.
- **Closed:** Softov reviewed tasks 01 to 08 on 2026-10-19, and they are done. The plan is built; [implemented.md](implemented.md) says what exists.
- **Next action:** none. The Claude and ACP sessions on the list are p12's, and the client view is p13's.
- **Open questions:** none.
- **Watch out for:** the session ids on a task must stay valid after a session is removed, so a task keeps the id as text. A plan does not list its tasks; `plan_show` finds them with `find({ plan })`. The checklist's Claude line is p12's: this plan proves pi and cofold, and p12 takes the Claude and ACP sessions.

## Final verification checklist

- [ ] A Claude, a pi and a cofold session each add a task, and each sees the tasks of the others.
- [x] Every stamp names the person and the session of the call, and no tool input can set one.
- [x] With approval on, an agent cannot set an unapproved task to `doing`.
- [x] With the sweep off, a `done` plan stays.
- [x] `docs/plugins/TASK-LIST.md` and `plans/index.md` updated.
