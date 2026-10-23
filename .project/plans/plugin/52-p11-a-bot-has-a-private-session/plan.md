---
title: A bot has a private session
domain: plugin
status: dropped
priority: medium
created: 2026-10-18
revalidated: 2026-10-18
requires:
  - plans/plugin/52-p9-front-and-back-are-chats-of-one-session/plan.md
changes:
  - specs/bots.md
creates: []
refs:
  - "[code://packages/bot/src/wake.ts#L202-L215](../../../../packages/bot/src/wake.ts#L202-L215) - `sessionFor`, the request a bot's session is started from"
  - "[code://packages/bot/src/context.ts](../../../../packages/bot/src/context.ts) - `contextBlock`, the shape the wake templates keep"
  - "[code://packages/bot/src/template.ts#L91-L115](../../../../packages/bot/src/template.ts#L91-L115) - the shipped `AGENTS.md` template, the pattern the wake templates copy"
---

Dropped 2026-10-22: merged into [p14 - A bot session has a Front, Backs and wakes](../52-p14-a-bot-session-has-a-front-and-backs/plan.md).

## Goal

Each bot has one private session, and no person can chat in it.
Only the host's instructions and wake automations send turns to it.
A mention in a group chat and an automation wake this session, each with an instruction from a template.
The bot answers a group with `post_message`, which names the group.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Runtime path

```
@ello in a group -> wait the delay -> wake -> template filled with the group, the sender and the last messages -> Ello's private session -> post_message to the group
```

### Gaps

- A wake with no person behind it starts a new session for each fire.
- The wake instructions are text in the code, and an owner cannot change them.
- The plugin writes only `AGENTS.md` to `templates/bots/`, and the wake templates have no default text in the code.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Each bot has one private session, where no person chats, and only system instructions and wake automations send to it | Softov, 2026-10-18, "each bot will have its own private session.. no one can chat on it.. only system instructions or wake automations." This replaces "No, new per fire" of 2026-10-16 | - |
| A group chat is a session with no model | Softov, 2026-10-18, "each group will have a session too no model" | p4 |
| A mention waits a delay, then wakes the bot's private session with the group's URI and its last messages | Softov, 2026-10-18, "When someone mention a bot on a group call. it wait X seconds and make a wake on that bot." | - |
| Each wake instruction is a template in `<configDir>/templates/bots/`, shipped as a default like `AGENTS.md` | Softov, 2026-10-18, "we need examples of those instructions on /home/softov/.config/ahpd/templates" | - |
| The default text of each wake template is in the code, and the plugin writes the file at load or when needed, if it does not exist | Softov, 2026-10-18, "Those templates need to be installed with the ahpd if not existed. Like when plugin start or when needed and do not exists." | - |

## Resume state

- **Done so far:** draft written 2026-10-18. No tasks yet. Example templates are in `~/.config/ahpd/templates/bots/`: `wake-mention.md` and `wake-automation.md`. Their text becomes the shipped default in the code.
- **Next action:** ask the open questions, then write the tasks.
- **Open questions:**
  1. The delay before a mention wakes the bot - proposed: 10 seconds, and a new mention in that time restarts the wait.
  2. How many messages the wake gives - proposed: the last 20, set by a plugin option.
  3. Is the private session a session of the bot provider with a Back chat - proposed: yes, the same shape as p9.
- **Watch out for:** a group message is text from people the owner may not trust. The mention template tells the bot so, and the tools must refuse it too.
