---
title: A hand-written old owner reads as the new one
status: done
depends: [task-03-an-old-owner-name-reads-as-the-new-one.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/triggers.ts#L193-L194](../../../../packages/sdk/src/triggers.ts#L193-L194) - a trigger's `owners` filter, read through `currentOwner`"
  - "[code://packages/sdk/src/plugins.ts#L791-L796](../../../../packages/sdk/src/plugins.ts#L791-L796) - a plugin's principal: no roles, no memberships, and the `grants` of its entry"
  - "[code://packages/sdk/src/policies.ts#L145-L165](../../../../packages/sdk/src/policies.ts#L145-L165) - a policy's `scope`"
  - "[code://packages/sdk/src/policies.ts#L52](../../../../packages/sdk/src/policies.ts#L52) - `LIMIT_POOLS`, the pools a usage limit names"
  - "[code://packages/sdk/src/types/policies.ts#L34](../../../../packages/sdk/src/types/policies.ts#L34) - the value types a policy matches"
  - "[code://packages/sdk/src/host/automations.ts#L91-L94](../../../../packages/sdk/src/host/automations.ts#L91-L94) - an automation's owner"
  - "[code://packages/sdk/src/validate.ts#L322](../../../../packages/sdk/src/validate.ts#L322) - the owner a plugin registers an automation with"
  - "[code://packages/bot/src/record.ts#L126](../../../../packages/bot/src/record.ts#L126) - a bot's owner"
  - "[code://packages/computer/src/runtime.ts#L1022](../../../../packages/computer/src/runtime.ts#L1022) - a machine's owner label, read through `ownerOf`"
---

## Objective

Each grant, policy, usage rule or other configuration that a person writes and that names a principal or an owner reads `plugin:@ahpd/<x>` as `plugin:<x>`.
Nothing on disk is rewritten.

## Files

- `UPDATE: plan.md` - the risk on hand-written owners is removed.
- No code changes. Each reader below either reads through `currentOwner` already or cannot hold a `plugin:` reference.

## Places that read a principal or an owner

| Place | Takes `plugin:` | Reads through `currentOwner` |
| --- | --- | --- |
| A trigger's `owners` filter, `triggers.ts:193-194` | yes | yes, since task 03 |
| A machine's owner label, `computer/src/runtime.ts:1022` | yes | yes, through `ownerOf` |
| A plugin's `grants`, on its configuration entry | no: a grant names a scheme and a verb, and the entry is keyed by spec | does not apply |
| A plugin's roles and memberships, `sdk/src/plugins.ts:791-796` | no: a plugin principal has none | does not apply |
| A policy's `scope`, `policies.ts:145-165` | no: `all`, `user:`, `team:` or `project:` only | does not apply |
| A policy's `match`, `types/policies.ts:34` | no: `model`, `proxy`, `agent` and `computer` only | does not apply |
| A usage limit's `pool`, `policies.ts:52` | no: `shared` or `each` only | does not apply |
| An automation's owner, `host/automations.ts:91-94` | no: `user:`, `team:`, `project:` or `root:` only | does not apply |
| An automation a plugin registers, `validate.ts:322` | no: the same four kinds | does not apply |
| A bot's owner, `bot/src/record.ts:126` | no: the same four kinds | does not apply |

## Steps

1. Search for every reader of a principal or an owner in `packages/*/src`.
2. For each reader, check whether it takes a `plugin:` reference, and whether it reads through `currentOwner`.
3. Remove the risk on hand-written owners from the plan.

## Validation

- The `triggers.test.ts` case from task 03 passes: a rule with the owner `plugin:@ahpd/webhook` matches a session owned by `plugin:webhook`.
- `rg -n "plugin:" packages/sdk/src packages/server/src` shows no other reader of a written `plugin:` reference.

## Resume

- **Done:** 2026-10-14. The search found no reader to change. The only hand-written configuration that takes `plugin:` is a trigger's `owners` filter, and task 03 reads it through `currentOwner`.
- **Searches:** `rg` for `plugin:`, `ownerOf(`, `as Owner`, the owner patterns `^(?:user|team|project|root` and `startsWith('plugin:')` in `packages/*/src`.
- **Not changed:** a usage read by pool name, such as `usage://plugin:@ahpd/bot`, is a query and not configuration. Task 07 reads it through `currentOwner`.
- **Gates:** no code changed, so the task 05 gates stand.
