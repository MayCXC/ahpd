---
title: The API and the plugin routes answer to each origin
status: implemented
depends: [task-01-the-daemon-reads-origins.md]
layer: "server"
refs:
  - "[code://packages/server/src/commands/run.ts#L75-L86](../../../../packages/server/src/commands/run.ts#L75-L86) - `apiOrigins`"
  - "[code://packages/server/src/commands/run.ts#L390](../../../../packages/server/src/commands/run.ts#L390) - a call to `apiOrigins`; the others are at L422 and L798"
  - "[code://packages/server/test/server-http.test.ts#L422-L440](../../../../packages/server/test/server-http.test.ts#L422-L440) - the tests of the names the API answers to"
---

## Objective

Each configured origin is one the API accepts as `Origin`, and its `host` is one the API and the plugin routes accept as `Host`.

## Files

- `UPDATE: packages/server/src/commands/run.ts:62-86` - `apiOrigins` takes the configured origins and adds each one; the doc comment says so.
- `UPDATE: packages/server/src/commands/run.ts:390` - pass `options.origins`.
- `UPDATE: packages/server/src/commands/run.ts:422` - pass `options.origins`.
- `UPDATE: packages/server/src/commands/run.ts:798` - pass `options.origins`.
- `UPDATE: packages/server/test/server-http.test.ts:422-440` - the cases below.

## Steps

1. Add an `origins` parameter to `apiOrigins`, after `port`, that defaults to an empty list.
2. For each entry, push `new URL(entry).host` to `authorities`.
3. For each entry, push `new URL(entry).origin` to `origins`.
4. Pass `options.origins` at each of the three calls in `run.ts`.
5. Update the doc comment of `apiOrigins` to name the configured origins and the decision.

## Validation

- A test: `apiOrigins('0.0.0.0', undefined, 37537, ['http://203.0.113.1:37537'])` holds the authority `203.0.113.1:37537` and the origin `http://203.0.113.1:37537`.
- A test: `https://ahpd.example.com` adds the authority `ahpd.example.com` and the origin `https://ahpd.example.com`.
- A test: without that origin configured, a plugin route refuses `Host: 203.0.113.1:37537` with 403, and with it the route answers.
- `pnpm exec vitest run packages/server/test/server-http.test.ts packages/server/test/server-restart.test.ts packages/server/test/vault-command.test.ts` passes.
- `pnpm -s typecheck` and `pnpm -s boundary` pass.

## Resume

Built. `apiOrigins` takes `extra` as its fourth argument. `plugin-route.test.ts` starts a daemon with one origin and checks the `Host` values.
