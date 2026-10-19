---
title: The API and proxy keys get their own names
domain: daemon
status: active
priority: medium
created: 2026-10-18
revalidated: 2026-10-18
requires: []
refs:
  - "[code://packages/server/src/config.ts#L333](../../../../packages/server/src/config.ts#L333) - `Config`, where `http` and `proxy` are declared"
  - "[code://packages/server/src/commands/options.ts#L617-L640](../../../../packages/server/src/commands/options.ts#L617-L640) - the `http` and `proxy` fields"
  - "[code://packages/server/src/commands/options.ts#L673](../../../../packages/server/src/commands/options.ts#L673) - `FILE_ONLY`"
  - "[code://packages/server/src/commands/options.ts#L905-L917](../../../../packages/server/src/commands/options.ts#L905-L917) - the checks and `httpOf`"
  - "[code://packages/server/src/commands/options.ts#L1124](../../../../packages/server/src/commands/options.ts#L1124) - where a run reads `proxy`"
  - "[code://packages/server/src/rootconfig.ts#L32](../../../../packages/server/src/rootconfig.ts#L32) - `DAEMON_KEYS`, the keys a client edits"
  - "[code://packages/sdk/src/vscoderootconfig.ts](../../../../packages/sdk/src/vscoderootconfig.ts) - VS Code's `http.proxy`, `http.noProxy` and `http.proxyKerberosServicePrincipal`"
  - "[code://docs/server/PROXY.md](../../../../docs/server/PROXY.md) - the proxy's configuration examples"
  - "[code://docs/server/REMOTE.md](../../../../docs/server/REMOTE.md) - the HTTP API's configuration examples"
  - "[code://docs/server/UPGRADE.md](../../../../docs/server/UPGRADE.md) - where a renamed key is told"
  - "[code://.project/research/vscode-root-config-keys-against-ahpd.md](../../../research/vscode-root-config-keys-against-ahpd.md) - the review that compared the keys"
---

## Goal

ahpd's `http` key becomes `httpApi`, and its `proxy` key becomes `modelProxy`.
The settings page then shows no ahpd key that reads like a part of VS Code's `http.*` keys.
A configuration file that uses an old name keeps working, and the daemon says which new name to use.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "\.proxy\b|'proxy'" packages/server/src` - the run, the checks and the proxy listener read `proxy`.
- `rg -n -i "renamed|legacy" packages/server/src/config.ts packages/server/src/commands/options.ts` - no key was renamed before, so there is no pattern to copy.

### Runtime path

```
config.json -> config.ts reads the file -> the new name, else the old name with a warning -> options.ts checks -> a run
client form -> root/configChanged -> rootconfig.ts writes the new name and removes the old one
```

### Gaps

- ahpd's `http` and VS Code's `http.proxy` show side by side, and `http` reads like their parent.
- ahpd's `proxy` is the model proxy, and VS Code's `http.proxy` is an outgoing network proxy.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpd renames the two keys, and still reads the old names | Softov, 2026-10-18, chose "Rename, old names kept" for "Should ahpd rename its `proxy` and `http` keys so they don't look like VS Code's `http.*` keys?" | 01 |
| The new names are `httpApi` and `modelProxy` | (defaulted: the names offered in the question) | 01 |
| An old name gives a warning at start that names the new key | Softov, 2026-10-18, same answer | 01 |
| A file with both names for one key stops the start, with a message that names both | (defaulted: two values for one setting have no right answer) | 01 |
| A write from a client writes the new name, and removes the old name from the file | (defaulted: else the next start reads both names) | 01 |
| The settings page shows `modelProxy`, so a client can edit the providers and model names | Softov, 2026-10-19, chose "Keep it on" for "Should `modelProxy` be on the settings page?" | 01 |
| The `proxy` grant and the `proxy` match type of a policy keep their names | (defaulted: they are not configuration keys, and a rename would change roles and policies) | 01 |

## Proposed architecture

- **Data flow** - `config.ts` maps each old name to its new name. The rest of the daemon sees only the new names.
- **Event flow** - Unchanged.
- **State flow** - The file keeps what the person wrote, until a client writes the key.
- **Layer responsibilities** - `config.ts`: the read and the warning · `options.ts`: the fields and checks under the new names · `rootconfig.ts`: the write.
- **Source-of-truth files** - [`code://packages/server/src/config.ts`](../../../../packages/server/src/config.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - the daemon reads the new names](task-01-the-daemon-reads-the-new-names.md) | implemented | - |
| [02 - the docs use the new names](task-02-the-docs-use-the-new-names.md) | implemented | 01 |

## Risks and tradeoffs

- A client written against the old names reads nothing under them.
- ahpw draws from the schema, so it shows the new names with no change.
- The warning shows at every start until the person edits the file.

## Resume state

- **Done so far:** tasks 01 and 02 are implemented. The daemon reads, writes and warns about the new names, and the docs use them.
- **Next action:** review the two tasks, then the plan is done.
- **Open questions:** none.
- **Watch out for:** `rootconfig.ts` edits the file in place, beside keys it does not touch.

## Final verification checklist

- [x] A file with `http` and `proxy` starts, and the daemon warns once for each key.
- [x] A file with `httpApi` and `modelProxy` starts with no warning.
- [x] A file with `http` and `httpApi` stops with a message that names both.
- [x] A client save of the HTTP API writes `httpApi` and removes `http`.
- [x] The settings page shows `httpApi` and `modelProxy`, and no `http` or `proxy`.
- [x] The gates pass.
