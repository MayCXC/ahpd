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

1. List each title, description and enum label of the form with its key, its English and its Portuguese.
2. Read the code behind each field before you rewrite its text.
3. Rewrite each English text with the rules and the terms of `TEXT.md`.
4. Translate each new English text into Portuguese and Spanish by its meaning.
5. Show the list, old and new, to Softov, and change it until he approves each string.
6. Put the approved texts in the code and in both catalogs, in one commit.
7. Update each test that names one of the old texts.

## Validation

- Softov approves each string.
- `pnpm vitest run packages/sdk/test` passes.
- `pnpm typecheck` is clean.
- By hand, open the new session form in ahpw in English and in Portuguese.

## Resume
