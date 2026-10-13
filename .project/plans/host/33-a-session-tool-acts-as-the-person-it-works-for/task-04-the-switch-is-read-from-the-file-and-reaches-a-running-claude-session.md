---
title: The switch is read from the file and reaches a running claude session
status: todo
depends: []
layer: server
refs:
  - "[code://packages/server/src/commands/options.ts#L477-L491](../../../../packages/server/src/commands/options.ts#L477-L491) - `sessionTools` and `sessionToolsProviders`, each with a `default` that hides the file"
  - "[code://packages/server/src/commands/options.ts#L924](../../../../packages/server/src/commands/options.ts#L924) - `given`, the flag before the file"
  - "[code://packages/server/src/commands/options.ts#L1051-L1053](../../../../packages/server/src/commands/options.ts#L1051-L1053) - the fallbacks, which give the same defaults"
  - "[code://packages/sdk/src/host/tooling.ts#L1085-L1092](../../../../packages/sdk/src/host/tooling.ts#L1085-L1092) - `retool`, which drops what `setTools` answers"
  - "[code://packages/agent-claude/src/session/clienttools.ts#L482-L492](../../../../packages/agent-claude/src/session/clienttools.ts#L482-L492) - claude's `setTools`, through `setMcpServers`"
---

## Objective

`"sessionTools": false` and `"sessionToolsProviders"` in `config.json` take effect when no flag is given.
A live change of either key reaches a running claude session: a tool switched off cannot be called, and a tool switched on can.

## Files

- `UPDATE: packages/server/src/commands/options.ts:477-491` - the two fields have no `default`; the fallbacks give it.
- `UPDATE: packages/sdk/src/host/tooling.ts:1085-1092` - `retool` logs a `false` or a failure from `setTools`.
- `UPDATE: packages/agent-claude/src/session/clienttools.ts:482-492` - `setTools` makes the running CLI use the new tool list.
- `UPDATE: packages/server/test` - a case that a file value reaches the options with no flag.
- `UPDATE: packages/agent-claude/test` - a case that a live `setTools` changes what the CLI can call.

## Steps

1. Read the plan's *Resume state*, which says how task 03 failed live.
2. Remove `default` from `sessionTools` and `sessionToolsProviders` in `serverFields`.
3. Check that `--help` still says the defaults, and that `advancedTools` reads the same way.
4. Add a test that `"sessionTools": false` in the file, with no flag, gives `sessionTools: false`.
5. Make `retool` log the session's URI when `setTools` answers `false` or throws.
6. Find what the Claude SDK does when `setMcpServers` declares the `ahp` server again with other tools.
7. If the SDK keeps the old tools, stop and report what you found, with the options you see.
8. Otherwise, fix `setTools` so the CLI takes the new list, and add the agent-claude test.

## Validation

- A file value of `sessionTools: false`, with no flag, offers no session tool, and the startup line says so.
- A file value of `sessionToolsProviders`, with no flag, offers the session tools to those providers only.
- A live `sessionTools: false` makes a running claude session refuse `mcp__ahp__get_current_session`.
- A live `sessionTools: true` makes a running claude session able to call `mcp__ahp__list_sessions`.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume

