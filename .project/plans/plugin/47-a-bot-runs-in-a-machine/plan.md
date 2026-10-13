---
title: A bot runs in a machine
domain: plugin
status: draft
priority: high
created: 2026-10-13
revalidated: 2026-10-13
requires:
  - plans/plugin/37-a-bot-is-a-record-with-a-session/plan.md
decisions:
  - decisions/a-bot-owns-one-folder.md
  - decisions/a-bot-from-a-profile-gets-its-own-machine-and-a-named-machine-is-shared.md
  - decisions/a-bot-keeps-its-own-agent-state.md
refs:
  - "[code://packages/bot/src/record.ts#L76-L77](../../../../packages/bot/src/record.ts#L76-L77) - `computer`, kept on the record and never checked"
  - "[code://packages/bot/src/start.ts#L27-L38](../../../../packages/bot/src/start.ts#L27-L38) - `sessionFor`, which passes `computer` as session config"
  - "[code://packages/bot/src/provider.ts#L527-L530](../../../../packages/bot/src/provider.ts#L527-L530) - the one start, when a bot is made; no folder is made for a machine"
  - "[code://packages/computer/src/plugin.ts#L1800-L1815](../../../../packages/computer/src/plugin.ts#L1800-L1815) - a disposable machine removed after `disposableDelay`"
  - "[code://packages/computer/src/runtime.ts#L122-L140](../../../../packages/computer/src/runtime.ts#L122-L140) - the state volume name, by profile, owner and provider"
  - "[code://packages/computer/src/manifest.ts#L141](../../../../packages/computer/src/manifest.ts#L141) - `sessionFolder`, which mounts the working folder at the same path"
---

## Goal

A bot that names a machine runs there for its whole life.
The host checks the machine when the bot is made, and refuses a value it cannot use with a sentence.
A bot from a profile gets a machine of its own that stays while the bot stays.
Bots that name one `computer://` machine share it, and each works in its own folder there.
The bot's folder is at the same path inside the machine as on this host.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "computer" packages/bot/src` - the bot keeps `computer` and passes it on; it checks nothing.
- `rg "disposableDelay" packages/computer/src` - one timer removes a disposable machine after its last session.
- `rg "ahpd-state" packages/computer/src` - the state volume is named by profile, owner and provider.

### Runtime path

```
resourceWrite bot://<slug> -> botProvider.write -> check computer -> sessionFor -> host start -> computer plugin makes or finds the machine -> agent runs in <workspace>
```

### Gaps

- A bot's `computer` is not checked: a bad value fails only when the session starts.
- A disposable machine goes after `disposableDelay`, and the bot's transcript with it.
- A bot's state volume is its owner's, so two bots of one person share one sign-in.
- A shared machine has no rule that it holds the bots' folders.
- Deleting a bot leaves its machine.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [A bot owns one folder, and every session the host starts for it runs there](../../../decisions/a-bot-owns-one-folder.md) | The decision file, 2026-10-07 |
| 2 | [A bot from a profile gets its own machine, and a named machine is shared](../../../decisions/a-bot-from-a-profile-gets-its-own-machine-and-a-named-machine-is-shared.md) | Softov, 2026-10-13, "Profile: own; machine: shared" |
| 3 | [A bot keeps its own agent state, and its owner pays for the machine](../../../decisions/a-bot-keeps-its-own-agent-state.md) | Softov, 2026-10-13, "The bot's own" |

| What | Source | Task |
| --- | --- | --- |
| `computer` is `disposable:<profile>` or `computer://<id>`, checked at make for shape, for existence, and for `computer:write` for every owner kind | Softov, 2026-10-13, "Either, checked at make" | 01 |
| The bot's folder is mounted at the same path inside the machine | Softov, 2026-10-13, "Mounted, same path" | 01 |
| A profile with no `sessionFolder` is refused for a bot on a local Docker | Decision 1: the folder must reach the machine | 01 |
| A shared machine that does not mount the bots' root is refused for a bot | Decision 2 | 01 |
| A bot's machine stays as long as the bot, and goes with it | Decision 2 | 02 |
| The state volume of a bot is named for `bot:<slug>` | Decision 3 | 03 |

## Proposed architecture

- **Data flow** - A make carries `computer`. The bot plugin asks the computer plugin whether the value is usable for this bot, before the record is saved.
- **State flow** - The session config carries the bot's slug. The computer plugin reads it to keep the machine and to name the state volume.
- **Layer responsibilities** - bot: the check at make and the delete · computer: the kept machine, the mount check, the state owner · docs: BOT.md and COMPUTER.md.
- **Source-of-truth files** - [`code://packages/bot/src/provider.ts`](../../../../packages/bot/src/provider.ts), [`code://packages/computer/src/plugin.ts`](../../../../packages/computer/src/plugin.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| 01 - A bot's machine is checked when the bot is made | not written | - |
| 02 - A bot's machine lives as long as the bot | not written | 01 |
| 03 - A bot's state volume is its own | not written | 02 |

## Risks and tradeoffs

- A host can run without the computer plugin - Then the host refuses a bot that names a machine.
- A kept machine costs up-time for as long as the bot exists - The delete answer says the machine goes too.
- The container/05 p8 plan has no row for a bot with no folder - p8 is asked again after this plan settles.

## Resume state

- **Done so far:** the plan and its decisions, 2026-10-13.
- **Next action:** write the three task files.
- **Open questions:** none.
- **Watch out for:** `sessionFor` must keep `workingDirectory` as the bot's workspace, also in a machine.

## Final verification checklist

- [ ] `pnpm vitest run packages/bot packages/computer` passes.
- [ ] `pnpm -s typecheck` passes.
- [ ] `plans/index.md` updated.
