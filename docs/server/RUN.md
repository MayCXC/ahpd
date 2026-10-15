# Run

| Command | Does |
| --- | --- |
| `ahpd` | Run in this terminal. Ctrl+C stops it |
| `ahpd start` | Run in the background |
| `ahpd status` | Say if it runs, and where |
| `ahpd stop` | Stop it, and wait up to 30 s |
| `ahpd restart` | Stop and start again with the same flags |
| `ahpd restart --force` | Restart even while a turn runs |

`start` takes the same flags as `ahpd`. A bad flag is refused before anything starts.

## Files

All in `~/.config/ahpd/` (or `$XDG_CONFIG_HOME/ahpd/`):

| File | Holds |
| --- | --- |
| `config.json` | The configuration |
| `daemon.log` | What a background daemon prints. Moved aside at 5 MiB |
| `daemon.json` | The running daemon's pid, URL and flags. Mode 0600 |
| `sessions/` | Each session's settings and owner |
| `automations/` | One Markdown file per automation |
| `vault.json` | Secrets. See [Vault](VAULT.md) |

```bash
tail -f ~/.config/ahpd/daemon.log
```

## Restart

`ahpd restart` keeps the sessions, and the port when it is fixed. It is refused while a turn runs, and the refusal names the sessions:

```bash
ahpd restart            # waits for no turn
ahpd restart --force    # ends the running turns
```

Before it stops, the daemon checks that the new code accepts the recorded flags. If it does not, the restart is refused and the old daemon keeps running.

::: info Environment and folder
The new daemon keeps the old one's environment variables and working folder. To change either, use `ahpd stop` and `ahpd start`.
:::

From another machine: `ahpd --remote <url> restart`. See [Remote access](REMOTE.md#run-commands-from-another-machine).

## Served folders

The daemon serves the folders in `paths`. With none, it serves the folder it started in.

```bash
ahpd paths list
ahpd paths add /work/web
ahpd paths remove /work/web
```

A running daemon with the [HTTP API](REMOTE.md#http-api) on takes the change at once. Otherwise, run `ahpd restart`.

Started at a terminal in a folder it does not serve, `ahpd` asks:

```
Serve /work/new? [y/N]:
```

Yes adds it to `paths`. To never ask, pass `--no-cwd`. It serves only `paths` and `--path`.

::: tip
A path is where sessions are listed and created by default. It is not a fence: a client may still open a session in any folder on the machine. The [connection token](REMOTE.md#the-connection-token) decides who may connect.
:::

## Output for scripts

Every command takes these:

| Flag | Does |
| --- | --- |
| `--json` | Print the answer as JSON on stdout |
| `--quiet` | Print only the id the answer names |
| `--verbose` | Add diagnostics on stderr |
| `--no-color` | No colour. Also off for a non-terminal or with `NO_COLOR` |
| `--yes` | Remove without asking. A script with no terminal needs it |

```bash
ahpd status --json | jq .url
ahpd plugin list --json | jq '.[].state'
```

## Shell completion

::: code-group

```bash [bash]
ahpd completion bash > /etc/bash_completion.d/ahpd
```

```bash [zsh]
ahpd completion zsh > "${fpath[1]}/_ahpd"
```

```bash [fish]
ahpd completion fish > ~/.config/fish/completions/ahpd.fish
```

:::
