---
title: A bot runs in a machine
domain: bots
status: draft
priority: high
created: 2026-10-13
revalidated: 2026-10-28
requires:
  - plans/plugin/37-a-bot-is-a-record-with-a-session/plan.md
  - plans/plugin/52-p8-agents-md-is-the-bots-one-copy/plan.md
changes:
  - specs/bots.md
creates: []
refs:
  - "[code://packages/bot/src/record.ts#L116-L117](../../../../packages/bot/src/record.ts#L116-L117) - `computer`, kept on the record and never checked"
  - "[code://packages/bot/src/provider.ts#L298](../../../../packages/bot/src/provider.ts#L298) - the make schema, where `computer` is any string"
  - "[code://packages/bot/src/provider.ts#L836-L843](../../../../packages/bot/src/provider.ts#L836-L843) - a make writes no folder for a bot on a computer"
  - "[code://packages/bot/src/wake.ts#L221-L234](../../../../packages/bot/src/wake.ts#L221-L234) - `sessionFor`, which passes `computer` as session config"
  - "[code://packages/bot/src/wake.ts#L355-L359](../../../../packages/bot/src/wake.ts#L355-L359) - a wake makes no folder for a bot on a computer, because the folder is the machine's"
  - "[code://packages/computer/src/plugin.ts#L1636-L1642](../../../../packages/computer/src/plugin.ts#L1636-L1642) - a disposable machine is removed `disposableDelay` after its session"
  - "[code://packages/computer/src/runtime.ts#L120-L142](../../../../packages/computer/src/runtime.ts#L120-L142) - `stateVolumeOf`, the state volume name by profile, owner and provider"
  - "[code://packages/computer/src/manifest.ts#L137](../../../../packages/computer/src/manifest.ts#L137) - `sessionFolder`, which mounts the working folder at the same path"
  - "[code://.project/plans/plugin/52-p8-agents-md-is-the-bots-one-copy/task-03-an-edit-to-a-computer-bot-waits.md](../../../../.project/plans/plugin/52-p8-agents-md-is-the-bots-one-copy/task-03-an-edit-to-a-computer-bot-waits.md) - the dropped task that task 04 of this plan replaces"
  - "git://d9d4f950^ - the deleted decisions `a-bot-owns-one-folder`, `a-bot-from-a-profile-gets-its-own-machine-and-a-named-machine-is-shared` and `a-bot-keeps-its-own-agent-state`"
  - "[code://.project/plans/plugin/47-a-bot-runs-in-a-machine/plan.md](../../../../.project/plans/plugin/47-a-bot-runs-in-a-machine/plan.md) - the draft this plan replaces"
---

## Goal

A bot that names a machine runs there for its whole life.
The host checks the machine when the bot is made, and refuses a value it cannot use with a sentence.
A bot from a profile gets a machine of its own that stays while the bot stays.
Bots that name one `computer://` machine share it, and each works in its own folder there.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `git grep -n "computer" -- packages/bot/src` - the bot keeps `computer` and passes it on. It checks nothing, and it makes no folder on this host for a bot on a computer.
- `git grep -n "disposableDelay" -- packages/computer/src` - one timer removes a disposable machine after its session.
- `git grep -n "ahpd-state" -- packages/computer/src` - the state volume is named by profile, owner and provider.

### Runtime path

```
resourceWrite bot://<slug> -> botProvider.write -> check computer -> wake -> sessionFor -> host start -> computer plugin makes or finds the machine -> agent runs in the bot's folder
```

### Gaps

- A bot's `computer` is not checked, so a bad value fails only when the session starts.
- A disposable machine goes after `disposableDelay`, and the bot's transcript goes with it.
- A bot's state volume is its owner's, so two bots of one person share one sign-in.
- A shared machine has no rule that it holds the bots' folders.
- Deleting a bot leaves its machine.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A bot owns one folder, and every session the host starts for it runs there | [specs/bots.md](../../../specs/bots.md), "A bot owns one folder" | 01 |
| A bot from a profile gets its own machine, and a named machine is shared | Softov, 2026-10-13, "Profile: own; machine: shared" | 02 |
| A bot keeps its own agent state, and its owner pays for the machine | Softov, 2026-10-13, "The bot's own" | 03 |
| `computer` is `disposable:<profile>` or `computer://<id>`, checked at make for shape, for existence, and for `computer:write` for every owner kind | Softov, 2026-10-13, "Either, checked at make" | 01 |
| The place of the bot's folder depends on the kind of machine | Softov, 2026-10-28, "it will depends on the kind of machine right? Docker can be mounted. while vm/microvm on the future need another approach." | 01, 04 |
| On a machine that can mount a folder, such as Docker, the bot's folder on this host is mounted at the same path | Softov, 2026-10-13, "Mounted, same path", and Softov, 2026-10-28 | 01 |
| On a machine that cannot mount a folder, such as a VM, the bot's folder is on the machine, and the host reads and writes `AGENTS.md` through the machine | Softov, 2026-10-28 | 04 |
| A shared `computer://` machine that does not mount the bots' root is used as a VM is: each bot's folder is on the machine, and the bot is not refused | Softov, 2026-10-28, "treating it like a VM instead" per now | 01, 04 |
| An edit to a bot whose folder is on a machine waits while the machine is offline, and the next back session start writes it | Softov, 2026-10-17, "Its possible to make like a pending sync? For when offline?" | 04 |
| A local Docker profile with no `sessionFolder` is used as a VM is: the bot's folder is on the machine | Softov, 2026-10-28, "we can use it as a vm now... when validating we can maybe change" | 01, 04 |
| A bot's machine stays as long as the bot, and goes with it | A bot from a profile gets its own machine | 02 |
| The state volume of a bot is named for `bot:<slug>` | A bot keeps its own agent state | 03 |

## Proposed architecture

- **Data flow** - A make carries `computer`. The bot plugin asks the computer plugin whether the value is usable for this bot, before the record is saved.
- **State flow** - The session config carries the bot's slug. The computer plugin reads it to keep the machine and to name the state volume.
- **Layer responsibilities** - bot: the check at make and the delete. computer: the kept machine, the mount check and the state owner. docs: `docs/plugins/BOTS.md` and `docs/plugins/COMPUTER.md`.
- **Source-of-truth files** - [`code://packages/bot/src/provider.ts`](../../../../packages/bot/src/provider.ts), [`code://packages/computer/src/plugin.ts`](../../../../packages/computer/src/plugin.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| 01 - A bot's machine is checked when the bot is made | not written | - |
| 02 - A bot's machine lives as long as the bot | not written | 01 |
| 03 - A bot's state volume is its own | not written | 02 |
| [04 - An edit to a bot on a machine waits for the machine](task-04-an-edit-to-a-bot-on-a-machine-waits.md) | todo | - |

## Risks and tradeoffs

- A host can run without the computer plugin. Then the host refuses a bot that names a machine.
- A kept machine costs up-time for as long as the bot exists. The delete answer says that the machine goes too.
- The container/05 p8 plan has no row for a bot with no folder. Ask p8 again after this plan settles.

## Resume state

- **Done so far:** moved from plugin/47 on 2026-10-28, when Softov made the `bots` domain. The plan and its answers were written 2026-10-13. The refs were checked against main `343ca825` on 2026-10-28. The decisions this plan named are now the spec `specs/bots.md`, and their text is at `git://d9d4f950^`.
- **Next action:** write the task files 01 to 03.
- **Open questions:** none.
- **Watch out for:** `sessionFor` must keep `workingDirectory` as the bot's folder, also in a machine. Task 04 came from plugin/52 p8 task 03 on 2026-10-28. The code makes no folder on this host for a bot on a computer today, so task 01 changes that for a machine that mounts.

## Final verification checklist

- [ ] `pnpm vitest run packages/bot packages/computer` passes.
- [ ] `pnpm -s typecheck` passes.
