---
title: A daemon key picks how a pull request is looked up
status: todo
depends: [task-01-an-inactive-merged-session-is-archived.md]
layer: "sdk, server"
refs:
  - "[code://packages/sdk/src/types/github.ts#L24-L50](../../../../packages/sdk/src/types/github.ts#L24-L50) - the `PullRequests` port"
  - "[code://packages/sdk/src/repo/github.ts#L38-L131](../../../../packages/sdk/src/repo/github.ts#L38-L131) - `forBranch` by API and by `gh`"
  - "[code://packages/sdk/src/host/facts.ts#L410-L449](../../../../packages/sdk/src/host/facts.ts#L410-L449) - `refreshPullRequests` and the recorded `pullRequestUrls`"
  - "[code://packages/sdk/src/types/host.ts#L429-L438](../../../../packages/sdk/src/types/host.ts#L429-L438) - `closedChats`, the host option to mirror"
  - "[code://packages/server/src/rootconfig.ts#L32-L40](../../../../packages/server/src/rootconfig.ts#L32-L40) - `DAEMON_KEYS` and `LIVE`"
  - "git://github.com/microsoft/vscode@b5db36cf258 - `agentHostSessionLifecycle.ts` resolves each pull request URL"
---

## Objective

The daemon key `pullRequestLookup` picks how the pass learns the state of a pull request.
`url`, the default, asks `byUrl` for each related URL.
`branch` asks `forBranch` for the session's branch, as task 01 does.

## Files

- `UPDATE: packages/sdk/src/types/github.ts:24-50` - add the optional `byUrl?(url, token, cwd)`, which answers one `PullRequest` or `undefined`.
- `UPDATE: packages/sdk/src/repo/github.ts:38-131` - `byUrl` by API with a token, else by `gh pr view <url> --json url,state,title`.
- `UPDATE: packages/sdk/src/types/host.ts:438` - add `pullRequestLookup?: 'url' | 'branch'` beside `closedChats`.
- `UPDATE: packages/sdk/src/host/context.ts:194` - add `pullRequestLookup: 'url' | 'branch'`.
- `UPDATE: packages/sdk/src/host/merged.ts` - set `ctx.pullRequestLookup` from the option, else `url`, and ask the port by it.
- `UPDATE: packages/sdk/src/host/actions.ts:470-477` - a push of `pullRequestLookup` changes `ctx.pullRequestLookup`.
- `UPDATE: packages/server/src/config.ts:209` - add the key beside `closedChats`.
- `UPDATE: packages/server/src/commands/options.ts:71` - add the field, with `url` as the default at L1048.
- `UPDATE: packages/server/src/commands/options.ts:487-491` - add the field entry with `enum: ['url', 'branch']`.
- `UPDATE: packages/server/src/commands/run.ts:690` - pass the key to the host.
- `UPDATE: packages/server/src/rootconfig.ts:32-40` - add the key to `DAEMON_KEYS` and to `LIVE`.
- `UPDATE: packages/server/src/main.ts:264` - add the key to the list in the help text.
- `UPDATE: docs/HOST.md:75` - a table row after `closedChats`.
- `UPDATE: docs/HOST.md:138-142` - add the key to the daemon keys and to the keys that apply at once.
- `UPDATE: packages/sdk/test/host-merged.test.ts` - the pass cases in Validation.
- `UPDATE: packages/sdk/test/github.test.ts` - the `byUrl` cases, beside the `forBranch` cases.
- `UPDATE: packages/server/test/server-root-config.test.ts` - the schema and the live push.
- `UPDATE: packages/server/test/config-check.test.ts:219` - the default in the checked options.

## Steps

1. Write the tests first.
2. Add `byUrl` to the port and to `githubPullRequests`.
3. Add the host option and the context field, with `url` as the default.
4. Under `url`, take the recorded `pullRequestUrls` of the session's folder as the related URLs.
5. Drop each baseline URL that the session did not take over.
6. Under `url`, ask `byUrl` for each related URL, and drop a URL that answers `undefined`.
7. Under `url`, ask by branch when the port has no `byUrl`, and log that once.
8. Under `branch`, ask `forBranch` as task 01 does.
9. Add the key to the server configuration, the flags, the root config and the help text.
10. Apply a push of the key at once, as `actions.ts` applies a push of `closedChats`.
11. Write the key in `docs/HOST.md`.

## Validation

- `host-merged.test.ts`: under `url`, the pass asks `byUrl` for each related URL and archives when each one has state `merged`.
- `host-merged.test.ts`: under `branch`, the pass asks `forBranch` and archives when the related ones have state `merged`.
- `host-merged.test.ts`: under `url`, the pass asks a port with no `byUrl` by branch, and the log says so once.
- `host-merged.test.ts`: a push of `pullRequestLookup` changes the next pass.
- `github.test.ts`: `byUrl` reads a merged, an open and a closed pull request by API.
- `server-root-config.test.ts`: the schema has `pullRequestLookup` with `enum: ['url', 'branch']`, and a push answers no restart.
- `config-check.test.ts`: the checked options carry `pullRequestLookup: 'url'` when the file has no value.
- Run `pnpm typecheck`, `pnpm boundary`, `pnpm schema` and the vitest suites of sdk, server, agent-claude and agent-acp.

## Resume

Not started.
