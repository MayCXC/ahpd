---
title: The webhook plugin keeps endpoints and checks the caller
status: done
depends: []
layer: "packages/webhook"
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L801](../../../../packages/sdk/src/types/plugin.ts#L801) - `registerRoute`, the one route this plugin serves"
  - "[code://packages/sdk/src/types/plugin.ts#L586](../../../../packages/sdk/src/types/plugin.ts#L586) - `secret()`, which reads the vault secret that an endpoint names"
  - "[code://packages/sdk/src/types/plugin.ts#L629](../../../../packages/sdk/src/types/plugin.ts#L629) - `records()`, where the endpoints are kept"
  - "[code://packages/sdk/src/plugins/plugins.ts#L139](../../../../packages/sdk/src/plugins/plugins.ts#L139) - `routePrefix`, which serves `@ahpd/webhook` under `/plugins/%40ahpd/webhook/`"
  - "[code://packages/server/src/http.ts#L192-L227](../../../../packages/server/src/http.ts#L192-L227) - `pluginRoutes`, which checks Host only and leaves the caller to the route"
  - "[code://packages/push/package.json](../../../../packages/push/package.json) - the package shape to copy"
  - "[code://packages/bot/src/plugin.ts](../../../../packages/bot/src/plugin.ts) - the plugin entry and the seam pattern to copy"
---

## Objective

A new package `@ahpd/webhook` serves one route and keeps its endpoints in the `webhooks` collection.
The route lets a call through only when its bearer matches the endpoint's vault secret.
One plugin serves both kinds of endpoint, a bot and an automation, and this task leaves both targets to tasks 02 and 03.

## Files

- `CREATE: packages/webhook/package.json` - a copy of the `@ahpd/push` manifest, with the name `@ahpd/webhook`, the title `Webhook`, and the peer range `>=0.11 <1`, because `records()` arrived in 0.11.0.
- `CREATE: packages/webhook/tsconfig.json` - the same file as `packages/push/tsconfig.json`.
- `CREATE: packages/webhook/LICENSE` - the MIT license of the sibling packages.
- `CREATE: packages/webhook/README.md` - what the plugin does, and a link to `docs/plugins/WEBHOOKS.md`.
- `CREATE: packages/webhook/src/index.ts` - re-exports `name`, `title`, `defaults`, `optionsSchema` and `apply`, as `packages/bot/src/index.ts` does.
- `CREATE: packages/webhook/src/plugin.ts` - `apply`: opens the `webhooks` collection, registers the route, and builds the seams from `host`.
- `CREATE: packages/webhook/src/record.ts` - the endpoint record and its check.
- `CREATE: packages/webhook/src/route.ts` - `webhookRoute(seams)`, the handler that finds the endpoint and checks the bearer.
- `CREATE: packages/webhook/test/webhook-record.test.ts` - cases for the endpoint check.
- `CREATE: packages/webhook/test/webhook-route.test.ts` - cases for the route.
- `CREATE: docs/plugins/WEBHOOKS.md` - the endpoint record, the route path, the bearer, and an example file, in the shape of `docs/plugins/BOTS.md`.
- `UPDATE: docs/README.md:27` - add a `WEBHOOKS.md` row after the `USERS.md` row, in name order.
- `UPDATE: docs/plugins/PLUGINS.md:183-205` - name `@ahpd/webhook` as a plugin that authenticates its own caller.
- `UPDATE: package.json:15` - add `tsc -p packages/webhook` to the `build` script.
- `UPDATE: .github/workflows/release.yml:20` - add `webhook` to `PUBLISHED`.
- `UPDATE: README.md:16` - add the `@ahpd/webhook` badge after the `@ahpd/bot` badge.
- `UPDATE: README.md:286` - add the `@ahpd/webhook` row after the `@ahpd/bot` row.
- `UPDATE: pnpm-lock.yaml` - let `pnpm install` add the new workspace package.

## Steps

1. Write `webhook-record.test.ts` with the endpoint cases from Validation, and see it fail.
2. In `record.ts`, define the endpoint fields `id`, `bot` or `automation`, `secret`, and `reply` with the default `callback`.
3. Make `bot` a `bot://<slug>` URI, and `automation` the value `true`, because the automation's trigger names the endpoint.
4. Make the record check refuse an endpoint with both targets, with no target, or with no `secret`.
5. Make the record check accept only the three reply values `callback`, `sync` and `none`.
6. See the record tests pass.
7. Write `webhook-route.test.ts` with the route cases from Validation, and see it fail.
8. In `route.ts`, write `webhookRoute(seams)`, where the seams are `endpoint(id)`, `secret(name)` and one handler for each target.
9. Read the endpoint id as the one path segment after the plugin's prefix, and answer 404 for any other shape.
10. Answer 405 to a method that is not `POST`.
11. Answer 404 to an endpoint id that the collection does not hold.
12. Read `Authorization: Bearer <token>`, and answer 401 when it is missing.
13. Compare the token with the vault value through `timingSafeEqual` over equal lengths, and answer 401 when they differ.
14. Answer 401, and report the problem, when the vault refuses the secret name.
15. Pass a checked call to the handler of the endpoint's target.
16. Answer 501 for a target whose handler is not given, so tasks 02 and 03 each add one.
17. See the route tests pass.
18. In `plugin.ts`, open `host.records('webhooks')` and register `webhookRoute` with seams over `host.secret` and the collection.
19. Create `package.json`, `tsconfig.json`, `LICENSE`, `README.md` and `index.ts` from the `@ahpd/push` shape.
20. Add the package to the root build, `PUBLISHED`, the README badge and the README table.
21. Run `pnpm install` so that the lockfile holds the new package.
22. Write `docs/plugins/WEBHOOKS.md` and its row in `docs/README.md`.
23. Run the gates.

## Validation

- `webhook-record.test.ts` holds these cases:
  - It accepts an endpoint with a `bot` target and a `secret`.
  - It accepts an endpoint with an `automation` target and a `secret`.
  - It refuses an endpoint with both targets, and an endpoint with neither.
  - It refuses an endpoint with no `secret`.
  - It gives `reply: 'callback'` when the record has no `reply`.
  - It refuses a `reply` that is not `callback`, `sync` or `none`.
- `webhook-route.test.ts` calls the handler with `new Request(...)` over `memoryRecords` and a secret stub, and holds these cases:
  - A `GET` answers 405.
  - An unknown endpoint answers 404.
  - A path with more than one segment after the prefix answers 404.
  - A call with no `Authorization` header answers 401.
  - A call with a wrong bearer answers 401.
  - When the vault refuses the secret name, the call answers 401 and the plugin reports the problem.
  - A call with the right bearer reaches the target's handler with the endpoint record.
  - A call to a target with no handler answers 501.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- `pnpm exec vitest run packages/webhook` passes.

## Resume

Built as the task says. The package is `packages/webhook`, with `record.ts`, `route.ts`, `plugin.ts` and `index.ts`, and the two test files hold 18 cases.

Where the build departs from the plan:

- The route has a fourth seam, `problem(line)`. A record in `webhooks` that fails `checkEndpoint` is reported through it, and the call answers 404, as for an endpoint that does not exist. The plan did not say what a broken record answers.
- `NAME` and `PREFIX` live in `route.ts`, and `plugin.ts` takes `name` from there, so the two files do not import each other.
- `index.ts` also exports `checkEndpoint`, `REPLIES`, `PREFIX` and `webhookRoute`, as `packages/bot/src/index.ts` exports its parts.

Gates: `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass. `pnpm exec vitest run packages/webhook packages/sdk packages/server` passes 3872 of 3873 tests. The one failure is `packages/sdk/test/nested-start.test.ts`, which times out at 5 s under the parallel load and passes alone; it does not touch this package.
