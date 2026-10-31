---
title: The sdk's lists come in the locale
status: todo
depends:
  - task-01-the-rules-and-the-terms-are-written.md
layer: sdk
refs:
  - "[code://packages/sdk/src/host/root.ts#L445-L515](../../../../packages/sdk/src/host/root.ts#L445-L515) - the three lists"
  - "[code://packages/sdk/src/host/root.ts#L563](../../../../packages/sdk/src/host/root.ts#L563) - `rootState`"
  - "[code://packages/sdk/src/host/handshake.ts#L452-L458](../../../../packages/sdk/src/host/handshake.ts#L452-L458) - `initialize`"
  - "[code://packages/sdk/src/host/context.ts#L103-L105](../../../../packages/sdk/src/host/context.ts#L103-L105) - `localeOf`"
  - "[code://packages/sdk/src/resources/recordschannel.ts#L384-L475](../../../../packages/sdk/src/resources/recordschannel.ts#L384-L475) - `recordsMethods` and `recordsDomain`"
---

## Objective

The titles and descriptions of the sdk's commands, channels and schemes are plain, and the host sends them in the client's locale.
A plugin's own texts stay in English until the plugin slice.

## Files

- `UPDATE: packages/sdk/src/host/root.ts:445-515` - each list takes a locale and translates each text through `HOST_CATALOGS`.
- `UPDATE: packages/sdk/src/host/root.ts:563` - `rootState` passes the connection's locale.
- `UPDATE: packages/sdk/src/host/handshake.ts:452-458` - `initialize` passes the locale it got.
- `UPDATE: packages/sdk/src/resources/records.ts:48` - `Records` gets optional whole texts for its put and remove commands.
- `UPDATE: packages/sdk/src/resources/recordschannel.ts:384-475` - the put and remove texts come whole from the records, with a default.
- `UPDATE: packages/sdk/src/access/me.ts` - the rewritten English.
- `UPDATE: packages/sdk/src/access/tokens.ts` - the rewritten English.
- `UPDATE: packages/sdk/src/access/people.ts` - the whole put and remove texts of each records domain.
- `UPDATE: packages/sdk/src/access/policy.ts` - the whole put and remove texts of the policies domain.
- `UPDATE: packages/sdk/src/agents/channel.ts` - the rewritten English.
- `UPDATE: packages/sdk/src/agents/engines.ts` - the rewritten English.
- `UPDATE: packages/sdk/src/connectors/adapters.ts` - the rewritten English.
- `UPDATE: packages/sdk/src/connectors/channel.ts` - the rewritten English.
- `UPDATE: packages/sdk/src/usage/usage.ts` - the rewritten English.
- `UPDATE: packages/sdk/src/i18n/pt.json` - the keys `methods`, `channels` and `schemes` in Portuguese.
- `UPDATE: packages/sdk/src/i18n/es.json` - the same keys in Spanish.
- `CREATE: packages/sdk/test/host-lists-i18n.test.ts` - the cases of this task.
- `UPDATE: docs/sdk/HOST.md:35-50` - say that the three lists come in the client's locale.

## Steps

1. Take the approved `describe()` texts and their translations from the list in the research note.
2. Put each English text in its code, and each translation in both catalogs.
3. Add optional whole texts for put and remove to the records, and use them in `recordsMethods`.
4. Give each records domain of the sdk its approved whole texts.
5. Make "Save a record" and "Remove a record" the texts of a domain that gives none.
6. Give each list a `locale` parameter, and look up each text at the paths of the plan's *Answers*.
7. Pass the locale of the connection from `rootState` and `initialize`.
8. Check that ahpw, ahpapp and ahpc match each command by its name, not by its title.
9. Add a test that a client with `pt` gets the Portuguese title of an sdk command.
10. Add a test that a client with no locale gets the English.
11. Add a test that a plugin's command keeps its own text.

## Validation

- `pnpm vitest run packages/sdk/test` passes, with the new cases.
- `pnpm typecheck` is clean.
- `rg -n "describe: \(\) => \(\{ title: \`" packages/sdk/src` finds no title built from a variable.

## Resume
