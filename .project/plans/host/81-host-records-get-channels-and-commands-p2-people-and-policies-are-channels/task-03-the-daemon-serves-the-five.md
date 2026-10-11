---
title: The daemon serves the five channels and their commands
status: implemented
depends: [task-02-records-commands.md]
layer: "packages/sdk, packages/server"
refs:
  - "[code://packages/sdk/src/people.ts#L239-L240](../../../../packages/sdk/src/people.ts#L239-L240) - `peopleProviders`"
  - "[code://packages/sdk/src/policy.ts#L151](../../../../packages/sdk/src/policy.ts#L151) - `policyProviders`"
  - "[code://packages/server/src/commands/run.ts#L550-L558](../../../../packages/server/src/commands/run.ts#L550-L558) - the schemes in `HostOptions`"
  - "[code://packages/sdk/src/host/admission.ts#L213-L231](../../../../packages/sdk/src/host/admission.ts#L213-L231) - `ownRecord`"
---

## Objective

A daemon with a users directory serves the four people channels and their commands, and every daemon serves the policy channel and its commands.

## Files

- `UPDATE: packages/sdk/src/people.ts` - `peopleChannels(directory)`, the four channels, methods and providers on one refresh.
- `UPDATE: packages/sdk/src/policy.ts` - `policyChannels(store)`, the policy channel, methods and provider.
- `UPDATE: packages/sdk/src/index.ts` - export the two functions.
- `UPDATE: packages/server/src/commands/run.ts:550-558` - pass `channels` and `methods` beside `resourceProviders`.
- `CREATE: packages/server/test/records-channels.test.ts` - a daemon with users and policies, read through each path.

## Steps

1. Build each provider with the `changed` callback that refreshes its own channel.
2. Give the users channel a `mayRead` that holds when the id is the reader's own.
3. Open `Users.watch`, and refresh the four people channels on each call.
4. Close the watch when the daemon raises `stopping`.
5. Name the channels `x-ahpd-users`, `x-ahpd-teams`, `x-ahpd-projects`, `x-ahpd-roles` and `x-ahpd-policies`.
6. Name the commands `x-ahpd/<domain>/put` and `x-ahpd/<domain>/remove`, with the same domains.
7. Wrap each channel in a `ServedChannel` by the daemon, and bind a handle that sends through it.
8. Pass the channels as `HostOptions.channels`, and the methods as `HostOptions.methods`.

## Validation

- `records-channels.test.ts` subscribes to `x-ahpd-teams://`, writes `team://x`, and gets `added`.
- A change to the users file on disk sends `changed` to a subscriber of `x-ahpd-users://`.
- A person without `user:read` subscribes to `x-ahpd-users://` and gets only their own record.
- `x-ahpd/policies/put` makes a policy that `resourceRead policy://<id>` then reads.
- `pnpm exec vitest run packages/sdk packages/server` passes.

## Resume

Implemented 2026-10-11. `peopleChannels` and `policyChannels` replace `peopleProviders` and `policyProviders` in `run.ts`, and `servedRecords` wraps the channels and methods by `ahpd`. A change to the users file also refreshes the policy channel, so a person who loses `policy:read` is sent `removed`. The cases are in `packages/server/test/records-channels.test.ts`.
