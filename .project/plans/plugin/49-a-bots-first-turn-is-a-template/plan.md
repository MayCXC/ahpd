---
title: A bot's first turn is a template
domain: plugin
status: draft
priority: medium
created: 2026-10-13
revalidated: 2026-10-13
requires:
  - plans/plugin/45-a-plugin-keeps-records-in-the-host-store-p2-the-bot-keeps-its-records-there/plan.md
refs:
  - "[code://packages/bot/src/start.ts#L27-L38](../../../../packages/bot/src/start.ts#L27-L38) - `sessionFor`, which sends `instructions` as the first turn"
  - "[code://packages/bot/src/record.ts#L52-L86](../../../../packages/bot/src/record.ts#L52-L86) - `BotRecord`, the facts a template fills in"
  - "[code://packages/sdk/src/wakemessage.ts#L34-L62](../../../../packages/sdk/src/wakemessage.ts#L34-L62) - the `{{word}}` filler, which leaves a name it does not know as written"
  - "[code://packages/sdk/src/types/plugin.ts#L669](../../../../packages/sdk/src/types/plugin.ts#L669) - `connect()`, how the plugin hears a new chat, as push does"
---

## Goal

A bot's first turn is built from a template, not from its instructions alone.
The template gives the bot its name, its instructions, its last chats and the work it left.
The bot plugin ships a default template, and a bot can name another.
Each new chat of the bot starts with the template filled again, so a bot never starts a chat without its context.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "instructions" packages/bot/src` - the instructions are the first turn and nothing else.
- `rg "\{\{" packages/sdk/src` - one filler exists, for wake messages.

### Runtime path

```
bot made, or a chat added to its session -> read template -> fill {{word}} -> first turn of that chat
```

### Gaps

- A bot has no template field.
- A new chat of a bot's session starts empty.
- The filler knows only the wake's words.

## Decisions locked in

| What | Source | Task |
| --- | --- | --- |
| A bot names a template as `template: <name>` in its frontmatter, read from `<configDir>/templates/<name>.md` | Softov, 2026-10-13, "Named file, default shipped" | 01 |
| The plugin ships a default template, used when a bot names none | Softov, 2026-10-13, "Named file, default shipped" | 01 |
| `{{instructions}}` places the bot's body in the template | Softov, 2026-10-13, "Named file, default shipped" | 01 |
| The template is filled on every new chat of the bot | Softov, 2026-10-13, "Every new chat" | 02 |
| The filler is the wake filler, given more words | (defaulted: one filler in the host) | 01 |
| The last sessions are the bot's chats, newest first, with their titles | (defaulted: a bot has one session) | 01 |
| The work left is `PENDING.md` in the bot's workspace | (defaulted: the idea's example) | 01 |

## Proposed architecture

- **Data flow** - `sessionFor` asks for the filled template, not the bare instructions. The words are `name`, `description`, `instructions`, `chats` and `pending`.
- **Event flow** - The plugin's own client hears a chat added to a bot's session and sends the filled template as its first turn.
- **Layer responsibilities** - bot: the template field, the reading, the new chat · sdk: the filler takes a map of words · docs: BOT.md.
- **Source-of-truth files** - [`code://packages/bot/src/start.ts`](../../../../packages/bot/src/start.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| 01 - A bot's first turn is its filled template | not written | - |
| 02 - Each new chat of a bot starts with the template | not written | 01 |

## Risks and tradeoffs

- A short question gets the whole template first - The default template is short, and a bot can name a shorter one.
- `PENDING.md` in a machine is not on this host's disk - Read it through the machine's folder, which decision `a-bot-owns-one-folder` mounts at the same path.

## Resume state

- **Done so far:** the plan, 2026-10-13.
- **Next action:** write the two task files.
- **Open questions:** none.
- **Watch out for:** a chat the plugin itself made for the first turn must not get the template twice.

## Final verification checklist

- [ ] `pnpm vitest run packages/bot packages/sdk` passes.
- [ ] `pnpm -s typecheck` passes.
- [ ] `plans/index.md` updated.
