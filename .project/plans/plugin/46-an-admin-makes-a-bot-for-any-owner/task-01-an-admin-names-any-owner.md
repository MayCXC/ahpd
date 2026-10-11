---
title: An admin names any owner, and the manifest gives the host owner
status: done
depends: []
layer: "bot"
refs:
  - "[code://packages/bot/src/provider.ts#L281-L307](../../../../packages/bot/src/provider.ts#L281-L307) - `ownerFor`, the rule that changes"
  - "[code://packages/bot/src/provider.ts#L161-L184](../../../../packages/bot/src/provider.ts#L161-L184) - `MANIFEST`, which gains the host owner"
---

## Objective

A holder of `*:*` makes a bot for any user, team, project or this host.
The bot manifest's `owner` property names this host's own owner as a `const`.

## Files

- `UPDATE: packages/bot/src/provider.ts:281-307` - `ownerFor` lets a `*:*` reader name any owner, and refuses a `root:` that is not this host.
- `UPDATE: packages/bot/src/provider.ts:161-184` - the manifest is built with `hostName`; `owner` gains `anyOf` with a `const` of `root:<hostName>`.
- `UPDATE: packages/bot/test/bot-provider.test.ts` - the admin cases below.
- `UPDATE: docs/BOTS.md` - the owner rule and the host owner, if the page lists the owner rules.

## Steps

1. In `ownerFor`, return `asked` when `reader.can('*:*')` and `asked` is `user:`, `team:`, `project:` or `root:<hostName>`.
2. Record `root:<hostName>` for any asked `root:` owner, and compare two `root:` owners as equal in `mayLink`.
3. Keep every other rule in `ownerFor` as it is.
4. Move `MANIFEST` into a function of `hostName`, and call it from the scheme description.
5. Give the `owner` property an `anyOf` of a string and `{ const: "root:<hostName>", title: "This host" }`.
6. Add the owner rules for an admin to the scheme's `owner` description in one short sentence.
7. Update the owner rules in `docs/BOTS.md`.

## Validation

- `packages/bot/test/bot-provider.test.ts`: an admin makes a bot for `user:ana`, and `ana` reads it.
- Same file: an admin makes a bot for a team they do not belong to.
- Same file: an admin makes a bot for `root:<hostName>`, and a person without `bot:get` does not see it.
- Same file: an admin who names `root:old-name` gets a bot owned by `root:<hostName>`.
- Same file: a host bot links to a session owned by `root:old-name`.
- Same file: the host refuses `root:<hostName>` to a person without `*:*`, with `-32009`.
- Same file: the host still refuses a person without `*:*` who names `user:ana`, with `-32009`.
- Same file: the manifest's `owner` names `root:<hostName>` as a `const`.
- Run `pnpm vitest run packages/bot` and `pnpm typecheck`; both pass.

## Resume

`ownerFor` lets a `*:*` reader name any owner.
It records any `root:` owner as `root:<hostName>`, and `mayLink` treats two `root:` owners as one.
The manifest gives `root:<hostName>` as a `const`.
A bot for another person starts its session as that person.
The host refuses that make with `-32009` until the person signs in once.
Review fix: an edit keeps the owner on record, and `checkRecord` takes any `root:` owner for a host bot.
