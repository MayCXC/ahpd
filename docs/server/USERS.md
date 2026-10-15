# Users

Give each person their own token and role, instead of one shared token.

## Turn it on

```json
{ "users": "users.json" }
```

or `--users <file>`. The path is relative to `config.json`'s folder.

## Add a person

```bash
ahpd user add ana --role member
ahpd user token ana --url
```

`--url` prints the whole `ws://…?tkn=…` address, once. Send it to them. Without `--url` it prints the token alone, for a script. Minting again replaces the old token.

| Command | Does |
| --- | --- |
| `ahpd user list` | Show everyone and their grants |
| `ahpd user add <id>` | Add a person. `guest` with no `--role` |
| `ahpd user token <id>` | Mint their token, shown once |
| `ahpd user rm <id>` | Remove them |
| `ahpd user member <id> <team[:project]>...` | Teams and projects their work may be charged to |
| `ahpd user primary <id> [team[:project]]` | Where work that names none is charged |
| `ahpd team add <id>`, `ahpd project add <id>` | Name a team or project |

`user add` also takes `--issuer <name>`, `--membership <team[:project]>` and `--primary <team[:project]>`.

## Roles

| Role | Can |
| --- | --- |
| `admin` | Everything |
| `member` | Read and write files, sessions and terminals; use the proxy; trust a folder |
| `guest` | Read sessions and automations |

You can define your own roles in the file. See [sdk/USERS.md](../sdk/USERS.md).

## Sign in with GitHub or OpenID Connect

```bash
ahpd start --issuer github --resource https://ahpd.example.com/
```

A token from the issuer is accepted for a person whose record names it. See [sdk/AUTHENTICATION.md](../sdk/AUTHENTICATION.md#an-issuer).

## Trust the token

By default a person's token lets them connect, and they then sign in with `authenticate`. `--trust-token` (key `trustToken`) makes the token sign them in too.
