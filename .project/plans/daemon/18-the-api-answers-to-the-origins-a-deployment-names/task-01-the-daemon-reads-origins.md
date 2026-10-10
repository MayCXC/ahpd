---
title: The daemon reads `origins` and `--origin`
status: implemented
depends: []
layer: "server"
refs:
  - "[code://packages/server/src/commands/options.ts#L398-L404](../../../../packages/server/src/commands/options.ts#L398-L404) - `paths`, the repeatable flag to copy"
  - "[code://packages/server/src/commands/options.ts#L439-L443](../../../../packages/server/src/commands/options.ts#L439-L443) - `resource`, the field to put `origins` beside"
  - "[code://packages/server/src/config.ts#L138-L146](../../../../packages/server/src/config.ts#L138-L146) - `Config.resource`"
---

## Objective

`Options.origins` holds the origins from `--origin` or from the key `origins`.
An entry that is not an `http:` or `https:` origin stops the start with a message that names it.

## Files

- `UPDATE: packages/server/src/config.ts:138-146` - add `origins?: string[]` to `Config`, with a doc comment.
- `UPDATE: packages/server/src/commands/options.ts:57` - add `origins?: string[]` to `Options`.
- `UPDATE: packages/server/src/commands/options.ts:439-443` - add the `origins` field, an array of strings, with `cli: { flag: '--origin', value: 'URL' }`.
- `UPDATE: packages/server/src/commands/options.ts:926-947` - read `origins`, check each entry, and return it.
- `UPDATE: packages/server/src/main.ts:264` - add `origins` to the list of keys in the help text.
- `UPDATE: packages/server/test/server-http.test.ts` - the cases below.

## Steps

1. Add `origins` to `Config` and to `Options`, beside `resource`.
2. Add the `origins` field to `serverFields`, after `resource`, in the shape of `paths`.
3. Use the description "An origin this host also answers to, such as http://203.0.113.5:9187. Repeatable."
4. In the options reader, parse each entry with `new URL`.
5. Refuse an entry whose protocol is not `http:` or `https:`.
6. Refuse an entry whose `url.origin` differs from the entry with a trailing `/` removed.
7. Make each refusal name the entry and say that an origin is a scheme, a host and a port.
8. Return `origins` only when the list has entries.
9. Add `origins` to the key list in `main.ts`.

## Validation

- A test: `--origin http://203.0.113.1:37537` gives `origins: ['http://203.0.113.1:37537']`.
- A test: the key `origins` in the configuration file gives the same list.
- A test: the start refuses `ftp://x`, `http://x/path` and `x:37537`, and each message names the entry.
- `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

Built in the worktree `build-agents-0f517bb0`. `originOf` in `options.ts` checks each entry. `server-commands.test.ts` also lists `--origin` as repeatable.
