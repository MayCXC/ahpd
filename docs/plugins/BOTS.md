# Bots

A **bot** is a record a person keeps on the host, with a folder of its own and a session to talk to it in. `@ahpd/bot` serves it as the `bot:` scheme, so a bot is made, read, listed, edited and deleted through the same `resource*` methods every other resource uses - [RESOURCES.md](../sdk/RESOURCES.md).

A bot is not a backend. It runs on whichever harness the host already has, named by its `preset`, or by its `harness` and `model`, and this is what lets a bot be tried today rather than once a bot harness exists.

## The record

| Field | What it is |
| --- | --- |
| `id` | The slug. Read but never obeyed: it is the URI path, and a body naming another one is refused |
| `name` | What a person called it. The only field a make must carry |
| `labels` | Words a client groups bots by. Two bots may share one |
| `description` | One line about it, for a list of bots |
| `body` | Which body it is drawn with, from the fifteen below |
| `color` | Which colour it is drawn in: one of the eleven below, or a hex colour `#rrggbb` |
| `instructions` | What it was asked to be, in its own words. The template puts it in the first turn |
| `template` | The template its first turn is made from, by name. Absent is the default template - [The first turn](#the-first-turn) |
| `harness` | The backend a session of it runs on, where a bot chooses one |
| `model` | The model it asks for |
| `preset` | The session preset it starts from. Where one is set it wins over `harness` and `model` |
| `workspace` | The folder it works in, under `root`. Its own, and never moved |
| `computer` | The machine it runs in, where it names one |
| `session` | The session it is linked to |
| `owner` | Whose it is: `user:<id>`, `team:<team>`, `project:<team>:<project>` or `root:<host>`. A make may name the maker, or a team or project the maker belongs to; a holder of `*:*` may name any owner, this host's own `root:<host>` among them. A body naming anybody else is refused `-32009`, and an edit may not move it. Any `root:` is this host, whatever name follows it: one a make names is written under the host's name today, and a renamed machine keeps its bots. The manifest gives this host's own owner as a `const` in `owner`, so a client sends it as given |
| `createdAt`, `updatedAt` | The times. Read but never obeyed: what they hold is the host's |

A body that names a key a bot does not have is refused `-32602`, and so is a `body` outside the list below or a `color` that is neither a name below nor `#rrggbb`.

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

A bot works in a folder of its own, `<root>/<slug>` unless the body named one, where `root` is the plugin's option and starts at `~/.bots`. No two bots share a folder and an edit never moves one: two bots in one tree would be two sessions working over each other, so a body naming a folder another bot has is refused `-32602`. The folder is made when the bot is made - before its session starts, since that is where the session works.

## Bodies and colours

The bodies are `robot`, `humanoid`, `alien`, `gumbo`, `circle`, `semicircle`, `smash`, `square`, `triangle`, `pentagon`, `hexagon`, `drop`, `bean`, `cloud` and `ghost`. The colours are `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`, `brown`, `grey` and `black`. A colour may also be a hex colour, `#rrggbb`, which the host keeps in lowercase; `#fff` and `2f6fdf` are refused.

A make that names neither gets a body at random and the first colour.

## The session

A bot is talked to in its session, and there are two ways it gets one.

A body may **link** a session its owner already has, by naming it in `session`. The link is kept only where the host has that session and it belongs to the bot's owner: a URI the host has no session for is refused `-32602`, and one that belongs to somebody else is refused `-32009`. A link to somebody else's conversation would be this bot's work in a room its writer has no business in.

A bot made with **no** `session` is given one. The host starts it as the bot's owner, which is the same session that person could have made themselves: the owner's own `session:create` is asked first, and a refusal reads exactly as it does at the door. The session runs the bot's `preset`, or its `harness` and `model`, or the host's own default harness and model, in the bot's `workspace` - on this host, or in the `computer` the record names. Its first turn is the bot's template, filled, so a bot never opens silent. Each new chat in the session starts with the template as well - [The first turn](#the-first-turn). Its title is the bot's `name`.

A start the owner may not make leaves no record at all: the host is asked before the bot is saved, so a make that failed is one that did not happen rather than one claiming a session it has not got.

An edit that sets `session` to `null` takes the link away. An edit that says nothing about `session` leaves the link as it was, so changing a bot's name does not unlink it.

## The first turn

A bot's session opens with its template, filled. A bot that names no `template` gets the default one that the plugin ships:

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
| `{{chats}}` | One line `- <title>` per chat of the bot's session, newest first, at most `lastChats` of them. `None.` when there are none, which is every make |

A word that is not in this table is left as it was written.

A template is a record in the `templates` collection, so the daemon keeps each one as a file: `<configDir>/templates/<name>.md`. Its frontmatter holds `title`, and its body is the text:

```markdown
---
title: Short
---

You are {{name}}. {{instructions}}
```

A bot names it as `template: short`. A make or an edit that names a template that does not exist is refused `-32602`, with a sentence that names it. An edit that does not name `template` passes even when the bot's template was deleted, and the bot keeps the name; its next chat gets the default template and a problem, as below.

Each chat a person or a tool opens in a bot's session starts with the template too. It is filled again, with the session's chats at that moment. The text is hidden context before the chat's first message. A chat opened with no message gets it with the person's first message. The template is read for each chat, so an edit reaches the next one. A template that no longer exists gives the default one, and the plugin reports a problem that names the bot and the template.

## Who may do what

| Who | What they may do |
| --- | --- |
| The owner | Read, edit, delete |
| A member of the owning team or project | Read, edit, delete |
| `bot:get` | Read any bot |
| `bot:list` | List every bot |
| `bot:put` | Make a bot in the scheme, edit their own |
| `*:*` | Any of it, on any bot, and make a bot for any owner |
| A root connection | Any of it, on any bot |

A listing shows what a read would allow: a list that showed a bot the reader cannot open would be a list of names they cannot use.

Making a bot also needs the maker's `session:create` where a session has to be started for it, because the session is theirs - [USERS.md](../sdk/USERS.md#roles).

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

The snapshot state is `{ bots: BotRecord[] }`. Each record is the same JSON object that `resourceRead bot://<slug>` returns. Three actions follow it:

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

An edit that links a session the owner already has, and one that takes a link away:

```json
{ "session": "claude:/6f1c0b6e-2a5a-4a1e-9a4a-0f0e0b1c0d0e" }
```

```json
{ "session": null }
```

## Options

| Option | Default | What it does |
| --- | --- | --- |
| `root` | `~/.bots` | The folder a bot's workspace is under, as `<root>/<slug>` |
| `lastChats` | `10` | How many chats `{{chats}}` lists |

```json
{ "plugins": [{ "name": "@ahpd/bot", "options": { "root": "/srv/bots" } }] }
```

The records are kept beside the daemon's own configuration, one file per bot in `<configDir>/bots/` - [The file](#the-file) shows one - and the tombstones in `<configDir>/bots-gone/`. The templates are in `<configDir>/templates/`. A plugin that takes the record store over keeps them wherever that store keeps them.

## See also

| | |
| --- | --- |
| [RESOURCES.md](../sdk/RESOURCES.md) | What a scheme is, and the grants each resource method asks for |
| [SESSIONS.md](../sdk/SESSIONS.md) | What a session is and who it is charged to |
| [COMPUTERS.md](COMPUTERS.md) | Making a machine, and running a session inside it |
| [PLUGINS.md](PLUGINS.md) | Writing a plugin, and starting a session as an owner |
