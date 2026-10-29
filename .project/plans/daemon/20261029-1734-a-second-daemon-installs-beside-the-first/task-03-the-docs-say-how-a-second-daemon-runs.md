---
title: The docs say how a second daemon runs
status: todo
depends: [task-01-a-service-is-installed-under-its-name.md, task-02-its-daemon-is-reached-under-that-name.md]
layer: docs
refs:
  - "[code://docs/server/RUN.md#L89-L122](../../../../docs/server/RUN.md#L89-L122) - *Service*, the files, the manager and the commands"
  - "[code://docs/server/CONFIGURE.md#L102](../../../../docs/server/CONFIGURE.md#L102) - the keys with no flag"
---

## Objective

*Service* in `RUN.md` says how a second daemon runs beside the first.
`CONFIGURE.md` names the `service` key among the keys with no flag.

## Files

- `UPDATE: docs/server/RUN.md:89-122` - a section on a second daemon: its configuration home, its port, its `service.name`, and the names and files that follow.
- `UPDATE: docs/server/CONFIGURE.md:102` - add `service` to the keys with no flag.

## Steps

1. Add *More than one daemon* to `RUN.md`, after the paragraph on `service install` and `ahpd start`.
2. Say that each daemon has its own `XDG_CONFIG_HOME` and port, and that its file names its service.
3. Give the unit and the label of a named service, and the file each manager reads.
4. Say that every command for that daemon runs with its `XDG_CONFIG_HOME`.
5. Add `service` to the keys with no flag in `CONFIGURE.md`.

## Validation

- Run `node .agents/skills/do-spec/scripts/lint-prose.mjs docs/server/RUN.md docs/server/CONFIGURE.md`, and see no new finding.
- Read the section against the code of tasks 01 and 02.

## Resume

