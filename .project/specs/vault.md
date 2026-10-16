---
title: Vault
status: current
covers:
  - packages/sdk/src/vault.ts
  - packages/sdk/src/types/vault.ts
  - packages/server/src/vault.ts
  - packages/server/src/commands/vault.ts
  - packages/server/src/plugins.ts
  - packages/computer/src/secrets.ts
refs:
  - "[code://packages/sdk/src/types/vault.ts#L18-L53](../../packages/sdk/src/types/vault.ts#L18-L53) - `Vault`, `SecretRef` and `SecretWork`"
  - "[code://packages/sdk/src/vault.ts#L38-L54](../../packages/sdk/src/vault.ts#L38-L54) - `scopeOf`, the three forms of a secret name"
  - "[code://packages/sdk/src/vault.ts#L129-L138](../../packages/sdk/src/vault.ts#L129-L138) - `readSecret`, the scope check before the store is asked"
  - "[code://packages/server/src/vault.ts#L65-L98](../../packages/server/src/vault.ts#L65-L98) - `fileVault`, the daemon's own vault over one file"
  - "[code://packages/sdk/src/types/plugin.ts#L762-L770](../../packages/sdk/src/types/plugin.ts#L762-L770) - `registerVault`"
  - "[code://packages/server/src/plugins.ts#L640-L670](../../packages/server/src/plugins.ts#L640-L670) - `resolveSecrets`, a plugin option that names a secret"
  - "[code://packages/server/src/plugins.ts#L1084-L1086](../../packages/server/src/plugins.ts#L1084-L1086) - the vault a plugin load reads through"
  - "[code://packages/server/src/commands/vault.ts#L52-L84](../../packages/server/src/commands/vault.ts#L52-L84) - `mayWrite` and `mayList`, the grants per scope"
  - "[code://packages/computer/src/secrets.ts#L95-L121](../../packages/computer/src/secrets.ts#L95-L121) - `revealed`, a machine need read for the machine's owner"
  - git://d9d4f950^ - the deleted decisions this spec was written from: a-secret-is-named-in-a-host-team-or-user-scope, the-local-vault-is-a-plain-file-until-it-is-encrypted, the-vault-is-a-port-with-an-encrypted-local-fallback
---

The vault keeps the secrets that plugins and machines need, so the configuration file names a secret and does not hold it.
A value in the configuration written `{ "$secret": "<name>" }` is a reference, and the host reads the value from the vault when it is needed.
The vault is the `vault` port, and the daemon fills it with a local vault, a plain JSON file beside the configuration.
A plugin can take the port over with `registerVault(vault, 'replace')`, for example for a secret manager or a shared database.
The name of a secret carries its scope, and the scope decides which work may read it.
The code is in [`code://packages/sdk/src/vault.ts`](../../packages/sdk/src/vault.ts) and [`code://packages/server/src/vault.ts`](../../packages/server/src/vault.ts).

## Scenarios

### A secret name carries its scope

WHEN a secret is named
THEN the name is `host:<name>`, `team:<team>/<name>` or `user:<id>/<name>`
AND a name with another form, an empty part, whitespace or a control character is refused.

### Which work may read a secret

WHEN work asks for a secret
THEN a `host:` secret is read for any work
AND a `team:` secret is read only for work charged to that team
AND a `user:` secret is read only for that person's own work
AND the scope is checked before the store is asked, so a store never learns of a name out of scope
AND a name in scope that the vault does not hold is refused, not answered with nothing.
The reason: a person's token is not resolvable by every session on the host.

### A plugin option names a secret

WHEN a plugin option in the configuration is a `$secret` reference
THEN the host reads it from the vault when the plugin loads, and the plugin gets the value
AND only a `host:` secret can be read there, because a load is no person's work
AND an option that the plugin's schema marks `secretAtUse` is passed whole, and the plugin reads it later with `host.secret`
AND a reference that cannot be read stops that plugin, with a line that names the option and the secret.

### A configuration shows a reference as written

WHEN a client or a command reads a plugin's options back
THEN a `$secret` reference is shown as it was written, whatever the schema says
AND a value that the schema marks `writeOnly` is shown as `<set>`
AND a reference written through the root config is held to the name rule and not to the option's schema.

### A machine need names a secret

WHEN the computer plugin makes a machine
AND a need value, or an agent's default for a need, is a `$secret` reference
THEN the plugin reads it for the machine's owner and team at the time the machine is made
AND a need that no agent on that machine declares is not read
AND the values read from the vault are kept off the command that makes the machine.

### The daemon's own vault is a plain file

WHEN no plugin takes the vault over
THEN the vault is `vault.json` in the configuration directory, with a `version` of 1 and a `secrets` map of strings
AND the file is made with mode 0600 and written to a temporary file that is then renamed over it
AND the file is read again on every call, so a secret set at the terminal reaches a running daemon at its next read
AND a missing file is an empty vault.
The file is not encrypted, so it is as safe as the account the daemon runs as.

### A vault file that cannot be read

WHEN `vault.json` is not JSON, holds no secrets map of strings, or has a `version` other than 1
THEN every read and write refuses, with a fixed sentence that quotes nothing from the file
AND the file is left as it is.
The reason: a parser error quotes its source, and the source is the secret.

### A plugin takes the vault over

WHEN a plugin registers a vault with `'replace'`
THEN that vault is the store for every plugin that loads after it, and for `ahpd vault`
AND a registration without `'replace'` does not take over the daemon's vault
AND a plugin that registers a vault and whose own options name a secret is skipped.
The reason: a vault cannot read its own options out of the store that it is.

### Managing secrets with ahpd vault

WHEN a person runs `ahpd vault set <name>`, `ahpd vault delete <name>` or `ahpd vault list`
THEN `set` at a terminal reads the value from piped standard input, and drops one trailing newline
AND `set` never takes the value from the command line, because the command line shows in `ps` and in the shell history
AND `delete` of a name the vault does not hold is a conflict
AND no command ever answers a value.

### A served vault command is held to the name's scope

WHEN a caller who is not root runs a vault command through the daemon
THEN a `host:` name needs `config:write` to set or delete it, and `config:read` to list it
AND a `team:` name needs `team:write` and a membership in that team
AND a `user:` name is only that person's own
AND `list` shows only the names the caller may see, with each name's state and where the configuration names one that is not set.
