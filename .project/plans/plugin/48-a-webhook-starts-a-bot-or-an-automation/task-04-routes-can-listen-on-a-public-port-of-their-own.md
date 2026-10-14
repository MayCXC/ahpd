---
title: Routes can listen on a public port of their own
status: implemented
depends: [task-01-the-webhook-plugin-keeps-endpoints-and-checks-the-caller.md]
layer: "packages/server, docs"
refs:
  - "[code://packages/server/src/config.ts#L23-L28](../../../../packages/server/src/config.ts#L23-L28) - `HttpSetting`, the port and host shape to mirror"
  - "[code://packages/server/src/commands/options.ts#L852-L859](../../../../packages/server/src/commands/options.ts#L852-L859) - `httpOf`, which refuses a host without a port"
  - "[code://packages/server/src/rootconfig.ts#L33](../../../../packages/server/src/rootconfig.ts#L33) - `DAEMON_KEYS`, the daemon keys that root config shows"
  - "[code://packages/server/src/commands/run.ts#L466-L484](../../../../packages/server/src/commands/run.ts#L466-L484) - the request chain and the API's own listener"
  - "[code://packages/server/src/commands/run.ts#L924-L929](../../../../packages/server/src/commands/run.ts#L924-L929) - `pluginRoutes`, mounted on the daemon's listener with its Host authorities"
  - "[code://packages/server/src/http.ts#L276-L282](../../../../packages/server/src/http.ts#L276-L282) - `listenApi`, a listener for one handler"
  - "[code://packages/server/test/plugin-route.test.ts](../../../../packages/server/test/plugin-route.test.ts) - the route cases to extend"
  - "[code://docs/HOST.md#L83](../../../../docs/HOST.md#L83) - the `http` row of the configuration keys"
---

## Objective

A daemon key `routes` with a `port` serves every plugin route on a listener of its own, which serves `/plugins/*` only and never AHP.
With no `routes.port`, the routes stay on the daemon port, which is the default that the plan locks in.

## Files

- `UPDATE: packages/server/src/config.ts:23-28` - add `RoutesSetting { port?, host? }` beside `HttpSetting`.
- `UPDATE: packages/server/src/config.ts:263` - add `routes?: RoutesSetting` after `http`.
- `UPDATE: packages/server/src/commands/options.ts:117-125` - add `routes?: RoutesSetting` after `http`.
- `UPDATE: packages/server/src/commands/options.ts:561-569` - add the `routes` field schema after the `http` field schema.
- `UPDATE: packages/server/src/commands/options.ts:608` - add `routes` to `FILE_ONLY`.
- `UPDATE: packages/server/src/commands/options.ts:852-859` - add `routesOf`, which refuses `routes.host` without `routes.port`, as `httpOf` does.
- `UPDATE: packages/server/src/commands/options.ts:1030` - read `routes` from the file with `routesOf`.
- `UPDATE: packages/server/src/rootconfig.ts:33` - add `routes` to `DAEMON_KEYS` after `http`.
- `UPDATE: packages/server/src/commands/run.ts:317-334` - refuse `routes` with `--stdio`, as `http` is refused.
- `UPDATE: packages/server/src/commands/run.ts:466-484` - open the routes listener through `listenApi` when `routes.port` is set.
- `UPDATE: packages/server/src/commands/run.ts:924-929` - mount `pluginRoutes` on the routes listener when it exists, with that listener's port in its authorities.
- `UPDATE: packages/server/src/commands/run.ts:1158` - close the routes listener at shutdown.
- `UPDATE: packages/server/test/plugin-route.test.ts` - cases for a route on its own port.
- `UPDATE: packages/server/test/server-root-config.test.ts:71` - add `routes` to the list of daemon keys.
- `UPDATE: docs/HOST.md:83` - add a `routes` row after the `http` row.
- `UPDATE: docs/PLUGINS.md:183-205` - say that `routes.port` moves every route to a listener of its own.
- `UPDATE: docs/WEBHOOKS.md` - say how to put the webhooks on a public port.

## Steps

1. Add the option cases from Validation to `plugin-route.test.ts`, and see them fail.
2. Add `RoutesSetting` to `config.ts`, with a comment on each field.
3. Add `routes` to `Config`, to `Options`, to the field schema and to `FILE_ONLY`.
4. Write `routesOf`, and refuse a `routes.host` that has no `routes.port`.
5. Add `routes` to `DAEMON_KEYS`, and update the key list in `server-root-config.test.ts`.
6. See the option cases pass.
7. Add the listener cases from Validation to `plugin-route.test.ts`, and see them fail.
8. In `run.ts`, refuse `routes` together with `--stdio`.
9. When the file sets `routes.port`, open a listener with `listenApi` on that port.
10. Bind that listener on `routes.host`, or on the daemon's host when `routes.host` is absent.
11. Give that listener `pluginRoutes` with a 404 below it, so it never answers AHP, `/api` or `/v1`.
12. Give the routes listener's `pluginRoutes` the Host authorities of its own port.
13. On the daemon's listener, answer 404 to `/plugins/*` when the routes have a port of their own.
14. Close the routes listener at shutdown, beside `apiListener`.
15. See the listener cases pass.
16. Write the `routes` row in `docs/HOST.md`, and the notes in `docs/PLUGINS.md` and `docs/WEBHOOKS.md`.
17. Run the gates.

## Validation

- `plugin-route.test.ts` holds these option cases:
  - A file with `routes.host` and no `routes.port` stops the daemon with a message that names both keys.
  - `--stdio` with `routes` stops the daemon.
- `plugin-route.test.ts` holds these listener cases:
  - With `routes.port`, a route answers on that port.
  - With `routes.port`, the daemon's port answers 404 to the same route.
  - With `routes.port`, the routes port answers 404 to an AHP upgrade, to `/api` and to `/v1`.
  - With `routes.port`, the routes port refuses a Host header that does not name it.
  - With no `routes` key, a route still answers on the daemon's port.
- `server-root-config.test.ts` lists `routes` among the daemon keys.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass.
- `pnpm exec vitest run packages/server/test/plugin-route.test.ts packages/server/test/server-root-config.test.ts` passes.

## Resume

Built in `packages/server/src/config.ts`, `commands/options.ts`, `rootconfig.ts` and `commands/run.ts`. `plugin-route.test.ts` gained 6 cases, and `server-root-config.test.ts` lists `routes` among the twelve daemon keys.

How the parts work:

- `RoutesSetting { port?, host? }` is a file-only key, and `routesOf` refuses `routes.host` without `routes.port`.
- `run.ts` refuses `routes` with `--stdio`.
- With `routes.port`, a `listenApi` listener serves `pluginRoutes` with a 404 below it, bound on `routes.host` or the daemon's host.
- Its `Host` check takes `apiOrigins` at its own port.
- On the daemon's port, the route mount then holds no routes, so `/plugins/*` answers 404.
- The daemon announces the listener in a line `routes on http://<host>:<port>/plugins/`, and closes it at shutdown after the API listener.

Where the build departs from the plan:

- The announcement line is new. The tests read the bound port from it, and an operator learns the port when it is `0`.
- The routes listener does not take the names that a plugin announced, because a tunnel forwards to the daemon's port. It takes `resource` and `origins`, as the API's own listener does.
- The existing group `a route with http off` covers a route on the daemon port with no `routes` key, so that case is not new.

Gates: `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass. `pnpm exec vitest run packages/sdk packages/server packages/bot packages/webhook` passes 3999 of 3999 tests.
