# Bots

A **bot** is a record a person keeps on the host, with a folder of its own, talked to in a chat of its own. `@ahpd/bot` serves it as the `bot:` scheme, so a bot is made, read, listed, edited and deleted through the same `resource*` methods every other resource uses - [RESOURCES.md](../sdk/RESOURCES.md).

A bot is not a backend of its own. It names whichever harness the host already has, by its `preset`, or by its `harness` and `model`, and the chat a person talks to it in runs no model at all - [The chat](#the-chat).

## The record

| Field | What it is |
| --- | --- |
| `id` | The slug. Read but never obeyed: it is the URI path, and a body naming another one is refused |
| `name` | What a person called it. The only field a make must carry |
| `labels` | Words a client groups bots by. Two bots may share one |
| `description` | One line about it, for a list of bots |
| `body` | Which body it is drawn with. Any word: the fifteen below are the suggestions |
| `color` | Which colour it is drawn in: one of the eleven below, or a hex colour `#rrggbb` |
| `instructions` | What it was asked to be, in its own words |
| `template` | The template a chat with it would open with, by name. Absent is the default template - [The template](#the-template) |
| `harness` | The backend a session of it runs on, where a bot chooses one |
| `model` | The model it asks for |
| `preset` | The session preset it starts from. Where one is set it wins over `harness` and `model` |
| `workspace` | The folder it works in, under `root`. Its own, and never moved |
| `computer` | The machine it runs in, where it names one |
| `owner` | Whose it is: `user:<id>`, `team:<team>`, `project:<team>:<project>` or `root:<host>`. A make may name the maker, or a team or project the maker belongs to; a holder of `*:*` may name any owner, this host's own `root:<host>` among them. A body naming anybody else is refused `-32009`, and an edit may not move it. Any `root:` is this host, whatever name follows it: one a make names is written under the host's name today, and a renamed machine keeps its bots. The manifest gives this host's own owner as a `const` in `owner`, so a client sends it as given |
| `chat` | The reader's own chat with this bot. Answered by a read and never obeyed: it is a different conversation for each reader, so what a body carries is not kept - [The chat](#the-chat) |
| `createdAt`, `updatedAt` | The times. Read but never obeyed: what they hold is the host's |

A body that names a key a bot does not have is refused `-32602`, and so is a `body` that is not a word or a `color` that is neither a name below nor `#rrggbb`. A bot has no session, so a body that names `session` is refused like any other key it does not have.

## The file

Each bot is one file a person can edit: `<configDir>/bots/<slug>.md`, the fields as YAML frontmatter between two `---` lines and `instructions` as the Markdown below them. The file name is the `id`, and a file whose frontmatter names another one is reported and left out.

```md
---
id: motion
name: Motion
labels:
  - review
  - ci
description: Reads pull requests and says what would break.
body: robot
color: teal
harness: claude
model: claude-sonnet-5
workspace: /srv/bots/motion
owner: user:soft
createdAt: 2026-10-11T09:00:00.000Z
updatedAt: 2026-10-11T09:00:00.000Z
---
You review pull requests. Say what would break, in one paragraph.
```

A record an older daemon left as `<slug>.json` is converted when the daemon starts: the Markdown file is written beside it, and the `.json` file is renamed `<slug>.json.migrated`, which is what says it has been read. Both files stay where they are, and only the Markdown one is read from then on.

A file a person edits is read while the daemon runs, and the change reaches watchers and the catalogue as any other edit does. Two fields an edit by hand may not change:

| Field | What happens |
| --- | --- |
| `owner` | The bot keeps the owner it had, and the change is reported |
| `workspace` | The bot keeps its folder, and the change is reported |

A file that is not a bot record - a field of the wrong type, or a colour that is neither one of the eleven nor `#rrggbb` - is reported in the same way, and the bot reads as it did before the edit.

## The slug

A bot's address is `bot://<slug>`, and the slug is the URI path, the record's `id` and the name of its folder - one thing written once. It is lowercase letters, digits and dashes, one to forty of them, starting with a letter; anything else is refused `-32602`, because the slug is a folder name and a URI path at once.

A slug is fixed when the bot is made and an edit cannot move it. A deleted slug is never made again: the host keeps a tombstone, and a make on one is refused `-32010`. A client held that address, and a different bot answering to it would be a lie about what that client has.

## The folder

A bot works in a folder of its own, `<root>/<slug>` unless the body named one, where `root` is the plugin's option and starts at `~/.bots`. No two bots share a folder and an edit never moves one: two bots in one tree would be two of them working over each other, so a body naming a folder another bot has is refused `-32602`. The folder is made when the bot is made, so a bot has one whether or not anybody has talked to it yet.

## Bodies and colours

The suggested bodies are `robot`, `humanoid`, `alien`, `gumbo`, `circle`, `semicircle`, `smash`, `square`, `triangle`, `pentagon`, `hexagon`, `drop`, `bean`, `cloud` and `ghost`. A body is a tag, so any other word is kept too, and a client draws a body it does not know with one of its own. A make with no body gets one of the fifteen at random. The colours are `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`, `brown`, `grey` and `black`. A colour may also be a hex colour, `#rrggbb`, which the host keeps in lowercase; `#fff` and `2f6fdf` are refused.

A make that names neither gets a body at random and the first colour.

## The chat

A person talks to a bot in a **chat**: one session of the `bot-chat` provider per bot and person. That provider runs no model - a turn ends in the call that starts it - and keeps each turn as one JSON line under `<configDir>/bot-chats/`, so a chat is still readable after a daemon restarts.

A chat is opened by a **read**. `resourceRead bot://<slug>` answers the record with one more key, `chat`, the URI of the reader's own conversation with that bot, and the first read by a reader who may chat starts it and keeps the row. Reading the same bot again answers the same chat, and two people reading one bot are answered two different chats.

A reader may chat when they hold `bot:chat`, or when the bot is theirs. A reader who may not is answered the record alone: no `chat` key and no refusal, because there is nothing wrong with their read - there is simply no conversation of theirs to name.

A chat is the reader's own session: it works in the bot's `workspace`, it is titled with the bot's `name`, and starting one needs the reader's own `session:create`, asked by the host the way it is asked at the door. A refusal there is the read's refusal.

`chat` is answered and never obeyed. A client that read a bot and writes the record back, `chat` and all, is writing what it was given, and the key is dropped rather than kept: a chat is the reader's, and the next reader's read answers the next reader's chat.

A chat's log is the whole of its state. Nothing about a chat is kept in memory past the process that made it, so a daemon that starts again lists, opens and replays the chats it has logs for.

## The template

A bot may name a `template`, which is what a chat with it would open with. A bot that names none gets the default one the plugin ships:

```text
You are {{name}}. {{description}}

{{instructions}}

## Your last chats

{{chats}}
```

| Word | What it becomes |
| --- | --- |
| `{{name}}` | The bot's `name` |
| `{{description}}` | The bot's `description`, or nothing |
| `{{instructions}}` | The bot's `instructions`, or nothing |
| `{{chats}}` | One line `- <title>` per chat the bot is in, newest first, at most `lastChats` of them. `None.` when there are none |

A word that is not in this table is left as it was written.

A template is a record in the `templates` collection, so the daemon keeps each one as a file: `<configDir>/templates/<name>.md`. Its frontmatter holds `title`, and its body is the text:

```markdown
---
title: Short
---

You are {{name}}. {{instructions}}
```

A bot names it as `template: short`. A make or an edit that names a template that does not exist is refused `-32602`, with a sentence that names it. An edit that does not name `template` passes even when the bot's template was deleted, and the bot keeps the name.

Nothing fills a template yet. A chat runs no model, so there is no first turn for one to open, and what a template reaches is decided with the work a bot does.

## Who may do what

| Who | What they may do |
| --- | --- |
| The owner | Read, edit, delete |
| A member of the owning team or project | Read, edit, delete |
| `bot:get` | Read any bot |
| `bot:list` | List every bot |
| `bot:put` | Make a bot in the scheme, edit their own |
| `bot:chat` | Be answered a chat by any bot they may read |
| `*:*` | Any of it, on any bot, and make a bot for any owner |
| A root connection | Any of it, on any bot |

A listing shows what a read would allow: a list that showed a bot the reader cannot open would be a list of names they cannot use.

A read that opens a chat also needs the reader's own `session:create`, because the chat is theirs rather than the bot's - [USERS.md](../sdk/USERS.md#roles).

## A watch

| Command | What it hears |
| --- | --- |
| `createResourceWatch bot://` | Every bot the reader may see |
| `createResourceWatch bot://<slug>` | That one bot |

A make is `added`, an edit is `updated` and a delete is `deleted`, one change per `resourceWatch/changed`.

A watcher hears only the bots it may read, by the table above, and a watch on `bot://` also hears every bot when the reader holds `bot:list`. The reader is the one that opened the watch, so a membership changed after that applies at the next watch.

A watch needs `bot:watch`, or a bot the reader may read: a watch on `bot://` is open to anybody signed in, and a watch on one bot to whoever may read it. A slug that does not exist is refused, as a read of it is.

## The catalogue

A client that subscribes to `x-ahpd-bots://` gets every bot it may read in one snapshot, then an action for each change. It reads the bots without one `resourceRead` per bot, and it hears changes that other clients make.

The snapshot state is `{ bots: BotRecord[] }`. Each record is the bot's own, the JSON object a write takes and a read answers, without `chat` - a chat belongs to whoever read the bot, and the catalogue is one snapshot for the whole client. Three actions follow it:

| Action | When the client gets it |
| --- | --- |
| `{ type: 'x-ahpd-bots/added', bot: BotRecord }` | A bot was made that it may read, or a bot it did not have became readable |
| `{ type: 'x-ahpd-bots/changed', bot: BotRecord }` | A bot it has was edited, and it may still read it |
| `{ type: 'x-ahpd-bots/removed', id: string }` | A bot it has was deleted, or it may no longer read it. `id` is the slug |

When an edit changes whether a client may read the bot, that client gets `added` or `removed`, never `changed`. When the users file changes, each subscriber gets `added` and `removed` for the bots its memberships gave or took away. Only that subscriber gets them.

Each client gets only the actions about bots it may read, so it sees gaps in `serverSeq` on this channel. A client cannot dispatch an action to the channel.

A subscribe needs `bot:read`. Without it, a reader who may read at least one bot is let in, and sees the bots it may read. `bot:get` reads every bot, so a holder of `bot:read` sees them all.

The channel is in `_meta['ahpd.channels']` on `initialize` and on the root state, as `{ scheme: 'x-ahpd-bots', title: 'Bots', description, grant: 'bot:read' }`. [PLUGINS.md](PLUGINS.md#a-channel-of-your-own) describes a plugin channel.

## An example

A make from a name alone, which is the whole of what is required:

```json
{ "name": "Motion" }
```

A bot that runs on a harness of its own, with something to be:

```json
{
  "name": "Motion",
  "labels": ["review", "ci"],
  "description": "Reads pull requests and says what would break.",
  "body": "robot",
  "color": "teal",
  "instructions": "You review pull requests. Say what would break, in one paragraph.",
  "harness": "claude",
  "model": "claude-sonnet-5"
}
```

An edit that asks for a harness, leaving everything else as it was:

```json
{ "harness": "claude", "model": "claude-sonnet-5" }
```

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `root` | `~/.bots` | The folder a bot's workspace is under, as `<root>/<slug>` |
| `lastChats` | `10` | How many chats `{{chats}}` lists |

```json
{ "plugins": [{ "name": "@ahpd/bot", "options": { "root": "/srv/bots" } }] }
```

The records are kept beside the daemon's own configuration, one file per bot in `<configDir>/bots/` - [The file](#the-file) shows one - and the tombstones in `<configDir>/bots-gone/`. The templates are in `<configDir>/templates/`. The chats are in `<configDir>/bot-chats/`: one row per bot and person, and beside it the log of the chat that row names. A plugin that takes the record store over keeps them wherever that store keeps them.

## See also

| | |
| --- | --- |
| [RESOURCES.md](../sdk/RESOURCES.md) | What a scheme is, and the grants each resource method asks for |
| [SESSIONS.md](../sdk/SESSIONS.md) | What a session is and who it is charged to |
| [COMPUTERS.md](COMPUTERS.md) | Making a machine, and running a session inside it |
| [PLUGINS.md](PLUGINS.md) | Writing a plugin, and starting a session as an owner |
