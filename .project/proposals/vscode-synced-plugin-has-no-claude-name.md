---
title: A synced customization bundle reaches Claude as a plugin named by its revision nonce
target: https://github.com/microsoft/vscode
date: 2026-10-16
refs:
  - file:///github/externals/vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/syncedCustomizationBundler.ts#L30-L38 - the bundle's manifest: the name `VS Code Synced Data`
  - file:///github/externals/vscode/src/vs/workbench/contrib/chat/browser/agentSessions/agentHost/syncedCustomizationBundler.ts#L386-L388 - the manifest is written to `.plugin/plugin.json` and to no other path
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/agentPluginManager.ts#L177-L192 - `_sanitize` and `_dirFor`: a revision is materialized at `<uri key>/<nonce key>`
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/claude/claudeSdkOptions.ts#L195-L197 - the Claude agent hands the CLI that directory as a local plugin
---

## Summary

A person who runs a Claude session on an agent host that syncs their customizations sees every skill of the synced bundle offered under a number instead of a name.
The bundle VS Code's own syncer writes is named `VS Code Synced Data` (`syncedCustomizationBundler.ts:30`, `:35-38`), and its skill comes back in the slash list as `/1683262406:advisor`.
The part before the colon is the revision's nonce, so the name a person is shown is a number that changes every time one of their customizations is edited.

## Where it comes from

Four pieces, each doing what it says it does:

- The syncer writes one manifest, `.plugin/plugin.json`, holding `name: 'VS Code Synced Data'` and a description, and writes it there and nowhere else (`syncedCustomizationBundler.ts:386-388`).
- The plugin manager materializes a revision at `<sanitized uri>/<sanitized nonce>` (`agentPluginManager.ts:177-192`), so the directory a revision lands in is named after the nonce rather than after the plugin: `1683262406`.
- The Claude agent hands the CLI that directory as a local plugin, `{ type: 'local', path: plugin.uri.fsPath }` (`claudeSdkOptions.ts:195-197`).
- The Claude CLI reads `.claude-plugin/plugin.json` and no other manifest, so it finds no name in the bundle and falls back to the directory it was given. The plugin is `1683262406`, and each skill of it is `1683262406:<skill>`.

Nothing here is a bug on its own.
It is an Open Plugins manifest meeting a Claude-only reader, and the fallback that reader uses is the directory name, which for this materializer is the revision nonce.

## Why it is worth a look

- The name is a number a person cannot act on: it does not match the name of the bundle it came from, it does not match the name of the skill's own folder, and nothing in the window says what `1683262406` is.
- It is not stable. A nonce is content-derived, so editing any one customization renames every skill of the bundle: `/1683262406:advisor` today, `/1684198822:advisor` after the next edit. A skill's name cannot be relied on between two sessions, kept in a note, or put in a document.
- The same skill is listed more than once wherever a host also lists the bundle's own parts. The bundle's `skills/` folder gives a host the name `advisor`, so the person is shown two rows for one file, under two names, and only one of them came from the file.
- It reaches VS Code users without a third-party host: this is VS Code's own Claude agent and VS Code's own syncer, so it is the window a person gets on the shipped product.

## Suggested change

Either of these resolves it, and the first needs nothing new:

- Write a `.claude-plugin/plugin.json` into the bundle beside `.plugin/plugin.json`, with the name in the spelling a Claude plugin's name is written in (`vs-code-synced-data` for `VS Code Synced Data`) and the description carried over. The CLI reads it and names the plugin, and every skill of it, by that.
- Or hand the CLI a name where the plugin is handed over. The SDK's local plugin option takes a path and no name, so this would need a field beside `path` that does not exist yet, and until it does the materializer has nowhere to put a name other than inside the bundle.

The first is the smaller change and it is in the syncer's gift, because the syncer is what writes the bundle.
It is also the safer of the two: a bundle that carries its own Claude manifest keeps working on a host that reads it without any special handling, which the path-based route would need.

## How a sibling project handles it

The daemon in `softov/ahpd` met the same two causes from the other side, with the same symptom: a copy filed under its nonce, announced as `VS Code Synced Data`, and every skill of it offered as `1683262406:advisor`.
It fixed it on 2026-10-16 by the first route.
Its copy step, which is the sibling of `agentPluginManager`'s, gives a copy that brought `.plugin/plugin.json` and no `.claude-plugin/plugin.json` the second manifest, named by the Open Plugins name in kebab case with the description carried over, and leaves a copy that brought a Claude manifest of its own exactly as it is (`packages/sdk/src/clientplugins.ts`, `claudeManifestIn`).
The other half is on the listing side: a backend drops a skill of a plugin the host handed over, because the host's own entry for the copy already lists that file, which is what made the second row (`packages/agent-claude/src/session/customizations.ts`, `handedOf`).

The first half is the one this proposal asks for, and it is the one that has to be in the bundle: only whatever writes the bundle can put a name inside it.
