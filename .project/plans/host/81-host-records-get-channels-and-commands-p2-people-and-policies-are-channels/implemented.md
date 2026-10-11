---
title: People and policies are channels and commands - implemented
date: 2026-10-11
refs:
  - git://02a6f20 - the review fixes; the build is 4931409
  - "[code://packages/sdk/src/recordschannel.ts](../../../../packages/sdk/src/recordschannel.ts) - `recordsChannel`, `recordsMethods` and `recordsDomain`"
  - "[code://packages/sdk/src/records.ts](../../../../packages/sdk/src/records.ts) - `putRecord` and `removeRecord`"
  - "[code://packages/sdk/src/people.ts](../../../../packages/sdk/src/people.ts) - `peopleChannels`"
  - "[code://packages/sdk/src/policy.ts](../../../../packages/sdk/src/policy.ts) - `policyChannels`"
  - "[code://packages/server/src/commands/run.ts](../../../../packages/server/src/commands/run.ts) - where the daemon serves the five channels and their commands"
---

Users, teams, projects, roles and policies are each a channel that holds every record a reader may read.
Each has a `put` and a `remove` command, with the same rules as a resource write.

## What was built

- [`code://packages/sdk/src/recordschannel.ts`](../../../../packages/sdk/src/recordschannel.ts) - `recordsChannel`, which sends `added`, `changed` and `removed` to each reader on `refresh`, and `recordsMethods` and `recordsDomain` for the two commands.
- [`code://packages/sdk/src/records.ts`](../../../../packages/sdk/src/records.ts) - `putRecord` and `removeRecord`, which the resource write and remove and the commands share.
- [`code://packages/sdk/src/people.ts`](../../../../packages/sdk/src/people.ts) - `peopleChannels`, the four people channels, their commands and their providers on one refresh.
- [`code://packages/sdk/src/policy.ts`](../../../../packages/sdk/src/policy.ts) - `policyChannels`, the policy channel, its commands and its provider.
- [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts) - `peopleChannels` and `policyChannels` replace `peopleProviders` and `policyProviders`, and `servedRecords` serves them by `ahpd`.
- `docs/USERS.md` has a section "People as channels and commands", and `docs/POLICY.md` has "The channel and its commands".

## Verified

- `packages/sdk/test/recordschannel.test.ts` has the cases for the snapshot, the actions, the reader filter and the commands.
- `packages/server/test/records-channels.test.ts` reads a daemon with users and policies through each path.
- The review fixes add cases to `recordschannel.test.ts` and `records-channels.test.ts`.
- Reviewed on 2026-10-11; `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/bot packages/sdk packages/server` pass on main at 0fcd7ad (3705 cases).

## Departures from the plan

- Task 01 - a refresh runs after the one before it.
- Task 01 - a refresh that cannot read the store is said through `onProblem`, and is not thrown.
- Task 02 - both commands answer `{}`, as a resource write does, so a caller with `put` and no `read` gets no record back.
- Task 02 - a command refuses an id with a `/` or a `?`, and a missing `record`.
- Task 02 - a resource write now parses the body before it checks `createOnly`.
- Task 03 - a change to the users file also refreshes the policy channel, so a person who loses `policy:read` is sent `removed`.
- Review fix 02a6f20 - a channel keeps its state for each client id and person, because several people can share one client id.
- Review fix 02a6f20 - each send carries `to` and a `visible` test.

## Left for later

- A policy file that a person edits by hand reaches no channel - see [deferred.md](deferred.md).
