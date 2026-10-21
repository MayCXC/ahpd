---
title: A plugin that does not resolve has an id with a slash, and a client cannot change it
status: open
date: 2026-10-21
severity: minor
refs:
  - "[code://packages/server/src/plugins.ts#L82-L91](../../packages/server/src/plugins.ts#L82-L91) - `unimportedId` falls back to the spec as written"
  - "[code://packages/server/src/pluginschannel.ts#L165-L171](../../packages/server/src/pluginschannel.ts#L165-L171) - `idParam` refuses an id with `/` or `?`"
---

## Symptom

A configured spec such as `https://example.invalid/p.tgz` or `./plugins/x` that does not resolve is listed in `x-ahpd-plugins` under the spec as its id.
That id contains `/`.
`x-ahpd/plugins/enable`, `disable` and `options` refuse an id with `/`, so a client cannot change that plugin.

## Cause

`unimportedId` answers `nameOf(spec)` when a spec does not resolve or its package is refused.
The commands refuse `/` and `?` in an id, because the id is part of a record URI.

## Impact

A client sees the row but cannot enable, disable or edit that plugin.
The command line still can, by the spec as written.
The userinfo of a URL in the id is masked, so no credential leaks.

## Workaround

Use `ahpd plugin enable`, `disable` or `config set` with the spec as written.

## Fix

- Give a plugin that does not resolve a slug id derived from its spec, such as the last path segment.
- Let the commands take the spec as written in a separate param, beside `id`.
- Encode the id in the record URI, and let the commands accept the encoded form.
