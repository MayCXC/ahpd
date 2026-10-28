---
title: A bot runs in a machine
domain: plugin
status: dropped
priority: high
created: 2026-10-13
revalidated: 2026-10-28
requires:
  - plans/plugin/37-a-bot-is-a-record-with-a-session/plan.md
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
  - "[code://.project/plans/plugin/52-p8-agents-md-is-the-bots-one-copy/task-03-an-edit-to-a-computer-bot-waits.md](../../../../.project/plans/plugin/52-p8-agents-md-is-the-bots-one-copy/task-03-an-edit-to-a-computer-bot-waits.md) - the task that reads a computer bot's `AGENTS.md` through the machine"
  - "git://d9d4f950^ - the deleted decisions `a-bot-owns-one-folder`, `a-bot-from-a-profile-gets-its-own-machine-and-a-named-machine-is-shared` and `a-bot-keeps-its-own-agent-state`"
---

Dropped 2026-10-28: the plan moved to [A bot runs in a machine](../../bots/20261028-0545-a-bot-runs-in-a-machine/plan.md) in the `bots` domain.

## Goal

A bot that names a machine runs there for its whole life.
The host checks the machine when the bot is made, and refuses a value it cannot use with a sentence.
A bot from a profile gets a machine of its own that stays while the bot stays.
Bots that name one `computer://` machine share it, and each works in its own folder there.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

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
| The bot's folder is mounted at the same path inside the machine | Softov, 2026-10-13, "Mounted, same path" | 01 |
| A profile with no `sessionFolder` is refused for a bot on a local Docker | The folder must reach the machine | 01 |
| A shared machine that does not mount the bots' root is refused for a bot | A named machine is shared | 01 |
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

## Risks and tradeoffs

- A host can run without the computer plugin. Then the host refuses a bot that names a machine.
- A kept machine costs up-time for as long as the bot exists. The delete answer says that the machine goes too.
- The container/05 p8 plan has no row for a bot with no folder. Ask p8 again after this plan settles.

## Resume state

- **Done so far:** the plan and its answers, 2026-10-13. The refs were checked against main `343ca825` on 2026-10-28. The decisions this plan named are now the spec `specs/bots.md`, and their text is at `git://d9d4f950^`.
- **Next action:** answer the open question, then write the three task files.
- **Open questions:**
  1. Where the folder of a bot on a machine is. This plan says that the bot's folder on this host is mounted at the same path in the machine. The code since plugin/52 p8 says that the folder is the machine's, made there at the session start. P8 task 03 reads `AGENTS.md` through the machine.
- **Watch out for:** `sessionFor` must keep `workingDirectory` as the bot's folder, also in a machine. Plugin/52 p8 task 03 changes the same records and the same wake, so build the two in one order.

## Final verification checklist

- [ ] `pnpm vitest run packages/bot packages/computer` passes.
- [ ] `pnpm -s typecheck` passes.
- [ ] `plans/index.md` updated.
