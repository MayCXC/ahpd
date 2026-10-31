---
title: The rules, the terms and the strings are written
status: doing
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
The task also writes each new string of task 02 and task 03 in one list, and Softov approves the list before any code.

## Files

- `CREATE: docs/sdk/TEXT.md` - the writing rules, the translation rules and the term table.
- `UPDATE: docs/sdk/HOST.md` - link `TEXT.md` from *See also*.
- `CREATE: .project/research/sdk-plain-text-strings.md` - each text of the form and each `describe()` text, old and new, in English, Portuguese and Spanish.

## Steps

1. Copy the writing rules and the translation rules of the brief into `TEXT.md`, as rules for a writer.
2. List the nouns of the sdk's texts and the two catalogs, such as session, chat and worktree.
3. Pick one English word for each thing, and one word in Portuguese and in Spanish.
4. Keep a protocol name or an identifier as it is, and say so in its row.
5. Put the terms in a table with the columns English, Portuguese, Spanish and a note.
6. Show the page to Softov, and change it until he approves it.
7. List each title, description and enum label of the session form with its key and its English.
8. List each `describe()` text of the sdk with its command, channel or scheme, and its English.
9. List the put and remove texts that each records domain of the sdk gets.
10. Read the code behind each entry before you rewrite its text.
11. Rewrite each English text with the rules and the terms of `TEXT.md`.
12. Translate each new English text into Portuguese and Spanish by its meaning.
13. Write the list in the research note, with the old and the new text side by side.
14. Show the list to Softov, and change it until he approves each string.

## Validation

- Softov approves `TEXT.md`.
- `HOST.md` links to it.
- Softov approves each string of the list.

## Resume

- 2026-10-31: the rules, the terms and the strings are in [sdk-plain-text-strings.md](../../../research/sdk-plain-text-strings.md). They wait for Softov. `TEXT.md` is written after he approves.
