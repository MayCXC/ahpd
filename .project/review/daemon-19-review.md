---
title: Review plugin ids
plans:
  - plans/daemon/19-a-plugin-is-known-by-its-id/plan.md
---

# Review plugin ids

Tasks 01 to 05 are merged in `9d64f99`, and released in 0.11.0. Root config, the `ahpd plugin` verbs, the listing and `--plugin-option` name a plugin by its id. Every first-party id is its package name.

## Read

- `packages/server/src/plugins.ts`: `namePlugin` and `pluginIdsOf`.
- `packages/server/src/commands/options.ts`: `namedOptionsFrom`.
- [implemented.md](../plans/daemon/19-a-plugin-is-known-by-its-id/implemented.md): four departures. Two entries with one id load the first one and report both. A plugin installed while the daemon runs keeps a provisional id until the next start.

## Check by hand

1. Run `ahpd plugin list`. Each line shows the id, and the spec beside it when the two differ.
2. Run `ahpd plugin config @ahpd/agent-claude`. It shows that plugin's settings.
3. Start a second daemon with `--plugin-option @ahpd/agent-claude.workerStop=session`. A typo in the id is refused before the start.

## Reply

Write "approved", or the findings. Approval sets tasks 01 to 05 to `done`.
