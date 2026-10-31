---
title: The new session form reads plain
status: todo
depends:
  - task-01-the-rules-and-the-terms-are-written.md
layer: sdk
refs:
  - "[code://packages/sdk/src/host/sessionconfig.ts#L76-L270](../../../../packages/sdk/src/host/sessionconfig.ts#L76-L270) - the English of the form"
  - "[code://packages/sdk/src/i18n/pt.json](../../../../packages/sdk/src/i18n/pt.json) - the 24 Portuguese texts under `session`"
  - "[code://packages/sdk/src/i18n/es.json](../../../../packages/sdk/src/i18n/es.json) - the Spanish texts under `session`"
---

## Objective

Each text of the new session form says what a field does for the person, in plain English, Portuguese and Spanish.
The keys and the values the form sends do not change.

## Files

- `UPDATE: packages/sdk/src/host/sessionconfig.ts:76-270` - the rewritten English titles, descriptions and enum labels.
- `UPDATE: packages/sdk/src/i18n/pt.json` - the Portuguese of each rewritten text.
- `UPDATE: packages/sdk/src/i18n/es.json` - the Spanish of each rewritten text.
- `UPDATE: packages/sdk/test/host-sessionconfig-locale.test.ts` - the expected texts, where a test names one.

## Steps

1. Take the approved texts of the form from the list in the research note.
2. Put them in the code and in both catalogs, in one commit.
3. Update each test that names one of the old texts.

## Validation

- `pnpm vitest run packages/sdk/test` passes.
- `pnpm typecheck` is clean.
- By hand, open the new session form in ahpw in English and in Portuguese.

## Resume
