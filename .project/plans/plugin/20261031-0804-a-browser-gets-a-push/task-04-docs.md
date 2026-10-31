---
title: The plugin is documented
status: todo
depends: [task-03-a-browser-is-sent-a-push.md]
layer: docs
refs:
  - "[code://docs/plugins/push.md](../../../../docs/plugins/push.md) - the plugin's page"
  - "[code://packages/push/README.md](../../../../packages/push/README.md) - the package README"
---

## Objective

The plugin's page and README say how a browser registers, what `push://vapid` holds, what `audience` does, and the two new options.

## Files

- `UPDATE: docs/plugins/push.md` - the web body, `push://vapid`, `audience`, `webPushHosts` and `contact`.
- `UPDATE: packages/push/README.md` - the same, in the README's own words.
- `UPDATE: packages/push/package.json:5` - the description names Web Push beside Expo.

## Steps

1. Add the web body beside the Expo body, with each field.
2. Add `push://vapid` and its content.
3. Add `audience`, its two values and its default.
4. Add the two options, with the default list of `webPushHosts`.
5. Say that a push service sees which host talks to which browser.

## Validation

- `pnpm docs:build` passes.
- `node <do-spec>/scripts/lint-prose.mjs docs/plugins/push.md` prints nothing new.
