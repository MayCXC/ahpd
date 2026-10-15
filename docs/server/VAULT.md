# Vault

Keep credentials out of `config.json`. A plugin option names a secret, and the daemon reads the value from the vault.

```bash
printenv STRIPE_KEY | ahpd vault set host:stripe
ahpd plugin config orders apiKey '{"$secret":"host:stripe"}'
ahpd restart
```

| Command | Does |
| --- | --- |
| `ahpd vault set <name>` | Store the value read from standard input |
| `ahpd vault list` | Show each name and whether it is set. Never a value |
| `ahpd vault delete <name>` | Remove it |

`vault set` reads standard input only. A value on the command line would land in `ps` and your shell history.

## Names

| Name | Who may write it |
| --- | --- |
| `host:<name>` | `config:write` |
| `team:<team>/<name>` | `team:write` and a member of that team |
| `user:<id>/<name>` | That person |

The deployment's connection token may write any name.

## In config.json

```json
{
  "plugins": [
    { "name": "@ahpd/orders", "options": { "apiKey": { "$secret": "host:stripe" } } }
  ]
}
```

If the name is not set, the plugin is skipped and the log says which name. `ahpd vault list` shows it as not set.

::: warning Not encrypted
The vault is `~/.config/ahpd/vault.json`, plain JSON, mode 0600. Keep it out of repositories, synced folders and container images.
:::
