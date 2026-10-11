---
title: The store reads and writes a bot as Markdown
status: todo
depends: []
layer: "packages/bot"
refs:
  - "[code://packages/bot/src/store.ts#L40-L48](../../../../packages/bot/src/store.ts#L40-L48) - `written`, the whole-file write"
  - "[code://packages/bot/src/store.ts#L83-L128](../../../../packages/bot/src/store.ts#L83-L128) - `botStore`"
---

## Objective

`botStore` keeps each bot as `<slug>.md`, with the fields in YAML frontmatter and `instructions` as the body.

## Files

- `UPDATE: packages/bot/src/store.ts` - read and write `.md`, with frontmatter and body.
- `CREATE: packages/bot/test/bot-store.test.ts` - cases for the file shape.

## Steps

1. Import `parseYaml` and `stringifyYaml` from `@ahpd/sdk`.
2. Write a record as `---`, `stringifyYaml` of every field except `instructions`, `---`, and then `instructions` as the body.
3. Read a file by splitting the frontmatter from the body, and parse the frontmatter with `parseYaml`.
4. Set `instructions` from the body, and leave it out when the body is empty.
5. Pass the joined record through `kept`, as a JSON record passes today.
6. List `.md` files in `slugsIn` in place of `.json` files.
7. Keep the mode `0600` and the rename into place.

## Validation

- `bot-store.test.ts` writes a record with multi-line `instructions`, reads it back, and gets the same record.
- The file on disk has `instructions` as plain text below the frontmatter.
- Make sure the store reports a file whose frontmatter is not YAML, and loads the other bots.
- `pnpm exec vitest run packages/bot` passes.

## Resume
