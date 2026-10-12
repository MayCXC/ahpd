---
title: Review automations as Markdown files
plans:
  - plans/host/80-an-automation-is-a-markdown-file/plan.md
---

# Review automations as Markdown files

Tasks 01 to 06 are merged in `1b2b493` and `4e3756e`, and released in 0.11.0. An automation is now `<configDir>/automations/<id>.md`, with run state in `automations-state.json`. Your three automations converted on 2026-10-11, and they show in the clients.

## Read

- `packages/server/src/scheduled.ts`: the store, the folder watch, the conversion and the id rule `^[a-z0-9][a-z0-9-]{0,63}$`.
- `packages/server/src/records.ts`: `RESERVED_COLLECTIONS` now names `automations`.
- [implemented.md](../plans/host/80-an-automation-is-a-markdown-file/implemented.md): task 06 was added in review, for the UUID ids ahpc makes.

## Check by hand

1. Edit the message of an automation in its `.md` file. The next run sends the new text, with no restart.
2. Copy an automation file to a new name. A second automation shows, with its own runs.
3. Make an automation in ahpc. Its UUID id is kept, and a file with that name appears.

## Reply

Write "approved", or the findings. Approval sets tasks 01 to 06 to `done`.
