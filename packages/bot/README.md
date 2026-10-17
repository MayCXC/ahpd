# @ahpd/bot

[![npm](https://img.shields.io/npm/v/%40ahpd%2Fbot)](https://www.npmjs.com/package/@ahpd/bot)
[![CI](https://github.com/softov/ahpd/actions/workflows/ci.yml/badge.svg)](https://github.com/softov/ahpd/actions/workflows/ci.yml)
![license MIT](https://img.shields.io/badge/license-MIT-blue)
![node >=22](https://img.shields.io/badge/node-%3E%3D22-5fa04e)
![Agent Host Protocol 0.9.0](https://img.shields.io/badge/AHP-0.9.0-0b7285)

A bot plugin for the [`@ahpd/server`](https://www.npmjs.com/package/@ahpd/server) daemon. It serves the `bot:` scheme, where a bot is a record with a workspace of its own, talked to in a chat of its own.

Part of [ahpd](https://github.com/softov/ahpd). The source is in [`packages/bot`](https://github.com/softov/ahpd/tree/main/packages/bot).

## Install

```bash
ahpd plugin install @ahpd/bot
ahpd restart
```

Update, remove and one-run flags such as `--plugin` are in [Plugins](https://github.com/softov/ahpd/blob/main/docs/server/PLUGINS.md).

## Options

In the configuration file, with every option set:

```json
{ "plugins": [{ "name": "@ahpd/bot", "options": { "root": "/srv/bots", "lastChats": 20 } }] }
```

| Option | Default | What it does |
| --- | --- | --- |
| `root` | `~/.bots` | The folder a bot's workspace is under, as `<root>/<slug>` |
| `lastChats` | `10` | How many chats a template lists for `{{chats}}` |

A bot is a record of the host's record store, so the daemon keeps each one as a file beside its own configuration: `<configDir>/bots/<slug>.md`, the fields as YAML frontmatter and `instructions` as the Markdown body, with the tombstones in `<configDir>/bots-gone/`. A file there that cannot be read is reported and skipped, and every other bot is kept. The chats are in `<configDir>/bot-chats/`: one row per bot and person, and beside it the log of the chat that row names.

The record store is a port, so a plugin that takes it over with `registerRecords(store, 'replace')` - a sqlite or a postgresql store - keeps the bots there instead of in files, and nothing in this plugin changes. [`docs/plugins/BOTS.md`](https://github.com/softov/ahpd/blob/main/docs/plugins/BOTS.md#the-file) shows one bot file and what a hand edit may change.

No option holds a credential, so the plugin takes nothing from the vault.

## In your own host

The package's `apply` is the plugin entry. Hand it a plugin host from `@ahpd/sdk`, then fold what it registered into the host's options:

```ts
import { createHost, foldHostOptions, listen, pluginHost } from '@ahpd/sdk';
import { claude } from '@ahpd/agent-claude';
import { apply, name } from '@ahpd/bot';

const path = process.cwd();
const context = { path, paths: [path], version: '0.10.0', hostName: 'my-host', configDir: '/var/lib/my-host', log: console.log, say: console.log };
const { host: plugin, contribution, seal } = pluginHost(name, context);
await apply(plugin, { root: '/srv/bots' });
seal();

const { options } = foldHostOptions({ path, agents: [claude({ paths: [path] })] }, [contribution]);
const host = createHost(options);
await listen({ port: 9187 }, (peer) => host.accept(peer));
```

## The `bot:` scheme

A bot is addressed by its slug, which is the URI path and the record's own `id`:

| Command | What it does |
| --- | --- |
| `resourceWrite bot://<slug>` with `createOnly` | Makes a bot. The body is the record, and `name` is the only field it must carry. |
| `resourceWrite bot://<slug>` with `ifMatch` | Edits one. `ifMatch` is the `etag` the last `resourceResolve` answered, so a write against a bot somebody else has changed is refused `-32011`. |
| `resourceRead bot://<slug>` | The record, as JSON, with `chat` where the reader may talk to it. |
| `resourceResolve bot://<slug>` | Its metadata, with `etag`. |
| `resourceList bot://` | The bots the reader may see, by slug. |
| `resourceDelete bot://<slug>` | Deletes one, and leaves a tombstone. |
| `createResourceWatch bot://` or `bot://<slug>` | Tells the reader when a bot it may read is made, edited or deleted. |

A slug is lowercase letters, digits and dashes, one to forty of them, starting with a letter. Anything else is refused `-32602`: the slug is a folder name and a URI path at once.

A body may carry `name`, `labels`, `description`, `body`, `color`, `instructions`, `template`, `harness`, `model`, `preset`, `session`, `workspace`, `computer` and `owner`. `id`, `createdAt` and `updatedAt` are read but never obeyed - what they name is the host's, and a write that names another `id` is refused rather than followed. `owner` may be named by a make, as the maker or a team or project the maker belongs to; a write naming anybody else is refused `-32009`, and an edit may not move it. A read answers one key more, `chat`, the reader's own conversation with the bot: it is answered and never obeyed, so a client that writes a record it read back is writing back a bot.

A bot's `session` is the name of the back session a message to it wakes. It is a slug, or a slug holding `{turn}` where the turn id of each message takes that word's place - so a bot that names `{turn}` is a session per message rather than one a person comes back to. A body that names none has `work`, a body that names something that is no name is refused `-32602`, and a file an older daemon wrote without the line is read as the bot that named none.

A bot is drawn in one of fifteen bodies and in one of eleven colours or a hex colour, `#rrggbb`. A make that names neither gets a body at random and the first colour.

### Who may see what

| Who | What they may do |
| --- | --- |
| The owner | Read, edit, delete |
| A member of the owning team or project | Read, edit, delete |
| `bot:get` | Read any bot |
| `bot:list` | List every bot |
| `bot:put` | Make a bot in the scheme, edit their own |
| `bot:chat` | Be answered a chat by any bot they may read |
| `*:*`, or a root connection | Any of it, on any bot |

A listing shows what a read would allow: a list that showed a bot the reader cannot open would be a list of names they cannot use. A read that opens a chat also needs the reader's own `session:create`, because the chat is theirs rather than the bot's.

### The catalogue

A subscribe to `x-ahpd-bots://` answers `{ bots }`, the bots the reader may read, then `x-ahpd-bots/added`, `x-ahpd-bots/changed` and `x-ahpd-bots/removed` as they change - [BOTS.md](https://github.com/softov/ahpd/blob/main/docs/plugins/BOTS.md#the-catalogue).

### The workspace

A bot works in a folder of its own, `<root>/<slug>` unless the body named one, and a named one has to be under `root`. No two bots share a folder, and an edit never moves one: two bots in one tree would be two of them working over each other. The folder is made when the bot is made, so a bot has one whether or not anybody has talked to it yet. A bot in a `computer` is not made a folder here: the machine makes it, as the working directory of whatever runs there.

### The chat

A person talks to a bot in a chat: one session of the `bot-chat` provider per bot and person. The provider runs no model, and a turn it begins stays open until the plugin that started the chat ends it - which is what the bot's back session answers into. Each turn is one JSON line under `<configDir>/bot-chats/`, so a chat is still readable after the daemon restarts. Nothing about a chat is kept in memory past the process that made it.

A chat is opened by a read. `resourceRead bot://<slug>` answers the record with `chat`, the URI of the reader's own conversation with that bot, and the first read by a reader who may chat starts it and keeps the row. Reading the same bot again answers the same chat, and two people reading one bot are answered two different chats. A reader who may not chat is answered the record alone, with no `chat` and no refusal.

A chat works in the bot's `workspace` and is titled with the bot's `name`. Starting one asks the reader's own `session:create`, by the host's own road, and a refusal there is the read's refusal.

A bot may name a `template`, the text a chat with it would open with, and a bot that names none gets the default one the plugin ships. A make or an edit that names a template that does not exist is refused `-32602`. Nothing fills a template yet: a chat runs no model, so there is no first turn for one to open.

### The tombstone

A deleted slug is not made again. A client held the address, and a different bot answering to it would be a lie about what that client has. A make on a deleted slug is refused `-32010`.

## Documentation

| | |
| --- | --- |
| [BOTS.md](https://github.com/softov/ahpd/blob/main/docs/plugins/BOTS.md) | The `bot:` scheme, the record and the chat |
| [PLUGINS.md](https://github.com/softov/ahpd/blob/main/docs/plugins/PLUGINS.md) | Writing and loading a plugin |
| [GET-STARTED.md](https://github.com/softov/ahpd/blob/main/docs/server/GET-STARTED.md) | Running the daemon |

## License

MIT © Softov
