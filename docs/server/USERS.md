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
| `ahpd user rm <id>` | Remove them, and their tokens |
| `ahpd user member <id> <team[:project]>...` | Teams and projects their work may be charged to |
| `ahpd user primary <id> [team[:project]]` | Where work that names none is charged |
| `ahpd team add <id>`, `ahpd project add <id>` | Name a team or project |
| `ahpd token mint [--user <id>]` | Mint a token of their own, shown once |
| `ahpd token list [--user <id>]` | Show tokens, without any secret or hash |
| `ahpd token rm <token id> [--user <id>]` | Revoke one token |

`user add` also takes `--issuer <name>`, `--membership <team[:project]>` and `--primary <team[:project]>`.

## Tokens of their own

A person signs in and mints tokens for their own use, or an operator mints one for them. Each token may be limited to some of the person's grants, so a laptop can carry `proxy:write` and nothing else:

```bash
ahpd token mint --user ana --grant proxy:write --label laptop
```

```
<secret>
Shown once. This host keeps only its hash. Revoke it with: ahpd token rm <id>
```

The secret goes to stdout and the warning to stderr, so a script can read the credential alone. `--url` prints the whole `ws://…?tkn=…` address instead. The host keeps only the hash, in the tokens file beside the users file: `users.json` and `users.tokens.json`.

Without `--grant` the token holds every grant its person holds, now and later. A token never holds a grant its person does not hold. A mint refuses one, and each call reads the person's grants again, so a grant taken from the person is taken from the token too. `--expires` takes a date such as `2026-12-31` or an ISO timestamp; without it a token does not expire. A revoked or expired token fails on its next call, with no reconnection.

A minted token cannot mint, list or revoke tokens. Sign in with the person's full token for that. `ahpd user token <id>` still mints that one full token, and the tokens a person minted stay.

At a terminal `--user <id>` names whose tokens they are. `token list` without one lists everybody's; `token mint` and `token rm` need one, because a terminal has nobody signed in. Over `/api` a person's token acts for that person, and `--user` needs `user:write` and is bounded by that person's grants. The host mints at most `tokensPerPerson` live tokens per person, ten unless configured otherwise; an expired token does not count.

`ahpd token list` shows the id, the label, the grants, the creation date and the expiry of each token, and never a secret or a hash.

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

`--issuer-verify` (key `issuerVerify`) says how that token is checked. `userinfo`, the default, asks the issuer who the token belongs to. `jwt` checks it here against the key set the issuer publishes. The issuer is not asked, and the token's own `exp` ends the sign-in. `auto` checks here first, and asks the issuer for a token the keys cannot answer. See [sdk/AUTHENTICATION.md](../sdk/AUTHENTICATION.md#checking-a-token-here).

## Trust the token

By default a person's token lets them connect, and they then sign in with `authenticate`. `--trust-token` (key `trustToken`) makes the token sign them in too.
