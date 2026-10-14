---
title: Bots in ahpd
---

# Bots in ahpd

This file shows how a bot gets the text of its first turns, and where the code differs from the plan Softov gave on 2026-10-14.
It comes from `packages/bot/src` at `040eb7b5`.

## The words

| Word | What it is |
| --- | --- |
| bot | A record of the `bots` collection, at `bot:<id>`. It has a session where it works. |
| bot session | The session the bot gets when it is made. Each chat in it is a chat with the bot. |
| template | Text with the words `{{name}}`, `{{description}}`, `{{instructions}}` and `{{chats}}`. The host fills the words from the bot. |
| bot template | A template that one bot names with its `template` field. It is a record of the `templates` collection. |
| system template | The template a bot gets when it names none. |
| creation template | The template that fills the first turn of the bot session, when the bot is made. |
| chat template | The template that fills the first turn of each new chat in the bot session. |

## The templates as asked

There are two uses: the creation of the bot, and each chat after it.
For each use, the bot's own template comes first, and the system template is the fallback.

```mermaid
flowchart TD
  U[A use needs a template<br/>creation, or a new chat] --> B{Does the bot<br/>name a template<br/>for this use?}
  B -->|yes| E{Does that<br/>template exist?}
  E -->|yes| BT[Bot template]
  E -->|no| S[System template<br/>for this use]
  B -->|no| S
  BT --> F[Fill the words from the bot]
  S --> F
  F --> T[First turn]
```

- More uses can come later. Each use then has its own bot template and its own system template.
- Today the first use that matters is the chat. The bot chat and the identity of who talks in it do not exist yet.

## The templates as built

One field, `template`, serves both uses.
The system template is `DEFAULT_TEMPLATE`, a constant in [`code://packages/bot/src/template.ts`](../../packages/bot/src/template.ts). An operator cannot change it.

```mermaid
flowchart TD
  subgraph M[Make a bot: provider.ts]
    M1{bot.template?} -->|none| M2[DEFAULT_TEMPLATE]
    M1 -->|a name| M3{templates/name?}
    M3 -->|yes| M4[Bot template]
    M3 -->|no| M5[The make is refused]
    M2 --> M6[First turn of the bot session]
    M4 --> M6
  end
  subgraph C[New chat: preamble.ts]
    C1{bot.template?} -->|none| C2[DEFAULT_TEMPLATE]
    C1 -->|a name| C3{templates/name?}
    C3 -->|yes| C4[Bot template]
    C3 -->|no| C5[DEFAULT_TEMPLATE<br/>and a problem line]
    C2 --> C6[First turn of the chat]
    C4 --> C6
    C5 --> C6
  end
```

## Gaps

| Asked | Built |
| --- | --- |
| A creation template and a chat template | One `template` field for both uses |
| A system template the operator sets | `DEFAULT_TEMPLATE` in the code |
| A missing bot template falls back to the system template | The chat falls back, and the make is refused |
| Other uses later | No place for a second use |
