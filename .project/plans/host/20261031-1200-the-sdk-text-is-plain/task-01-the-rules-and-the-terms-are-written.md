---
title: The rules and the terms are written
status: todo
depends: []
layer: docs
refs:
  - "[code://.project/briefs/the-text-a-person-reads-is-plain.md](../../../briefs/the-text-a-person-reads-is-plain.md) - the writing rules and the translation rules"
  - "[code://packages/sdk/src/i18n/pt.json](../../../../packages/sdk/src/i18n/pt.json) - the terms the Portuguese catalog uses now"
  - "[code://packages/sdk/src/i18n/es.json](../../../../packages/sdk/src/i18n/es.json) - the terms the Spanish catalog uses now"
---

## Objective

`docs/sdk/TEXT.md` holds the rules for the text a person reads, and a table of terms in English, Portuguese and Spanish.
Each later task and plan writes against this page.

## Files

- `CREATE: docs/sdk/TEXT.md` - the writing rules, the translation rules and the term table.
- `UPDATE: docs/sdk/HOST.md` - link `TEXT.md` from *See also*.

## Steps

1. Copy the writing rules and the translation rules of the brief into `TEXT.md`, as rules for a writer.
2. List the nouns of the sdk's texts and the two catalogs, such as session, chat and worktree.
3. Pick one English word for each thing, and one word in Portuguese and in Spanish.
4. Keep a protocol name or an identifier as it is, and say so in its row.
5. Put the terms in a table with the columns English, Portuguese, Spanish and a note.
6. Show the page to Softov, and change it until he approves it.

## Validation

- Softov approves `TEXT.md`.
- `HOST.md` links to it.

## Resume
