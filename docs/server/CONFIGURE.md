# Configure

## First setup

```bash
ahpd configure
```

It asks for the backends, host, port, token and folders. Each question shows the current value, so Enter keeps it. Run it again to change a setting.

| Answer | Writes |
| --- | --- |
| Yes to a backend | Installs it and adds it to `plugins` |
| No to a backend you have | `enabled: false`, options kept |
| Enter at the token | A new token in `connection-token`, mode 0600 |
| No to a folder | Leaves it out of `paths` |

`ahpd` and `ahpd start` offer to run it when there is no `config.json`. They never ask without a terminal.

## config.json

`~/.config/ahpd/config.json` (or `$XDG_CONFIG_HOME/ahpd/config.json`):

```json
{
  "port": 9187,
  "host": "127.0.0.1",
  "paths": ["/work/api", "/work/web"],
  "connectionTokenFile": "connection-token",
  "plugins": ["@ahpd/agent-claude"]
}
```

Every flag is a key, written in camelCase without the dashes: `--worktrees-root` is `worktreesRoot`. [Reference](REFERENCE.md) lists every key.

A relative path in `paths`, `worktreesRoot`, `users` or `connectionTokenFile` is relative to the file's folder.

## Which file wins

```
~/.config/ahpd/config.json   →   the file $AHPD_CONFIG names   →   flags
```

Each one overrides the one to its left, key by key. An object such as `http` merges. A list such as `paths` or `plugins` is replaced whole.

| Want | Use |
| --- | --- |
| Settings for one project | `AHPD_CONFIG=./ahpd.json ahpd` |
| One file only, nothing else | `ahpd --config-file ./ahpd.json` |
| A change for one run | a flag |

::: warning No file is read from the working folder
Starting `ahpd` in a repository never reads an `ahpd.json` there. Use `$AHPD_CONFIG` or `--config-file`.
:::

## Check it

```bash
ahpd config          # files read, then each key and its value
ahpd config --json
```

A wrong value stops the start with exit code 2 and names the file and key:

```
/home/you/.config/ahpd/config.json: port must be an integer
```

An unknown key is logged and ignored:

```
/home/you/.config/ahpd/config.json: plugin is not a setting ahpd knows; ignored
```

## Common settings

| Key | Flag | Default | |
| --- | --- | --- | --- |
| `port` | `--port` | `9187` | `0` picks a free port |
| `host` | `--host` | `127.0.0.1` | `0.0.0.0` needs a token. See [Remote access](REMOTE.md) |
| `paths` | `--path` | the start folder | Folders to serve. See [Run](RUN.md#served-folders) |
| `worktreesRoot` | `--worktrees-root` | `<repo>.worktrees` beside each repo | Where session worktrees go |
| `connectionTokenFile` | `--connection-token-file` | | See [Remote access](REMOTE.md#the-connection-token) |
| `sleepAfterMinutes` | `--sleep-after-minutes` | `30` | Unload a quiet session after this |
| `sessionResidencyLimit` | `--session-residency-limit` | `10` | Most sessions loaded at once |
| `closedChats` | `--closed-chats` | `hidden` | `delete` removes a closed chat from the backend |
| `automations` | `--automations` | `file` | `memory` keeps automations until exit, and fires no schedule |
| `wire` | `--wire` | | Log every frame to this file, for debugging |

Keys with no flag: `http`, `proxy`, `usage`, `policies`, `mcpServers`. Flags with no key: `--no-plugins`, `--no-cwd`, `--plugin-option`, `--stdio`, `--config-file`.

[Reference](REFERENCE.md) has every key.
