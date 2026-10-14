---
title: npm starts through node on Windows
status: todo
depends: []
layer: server
refs:
  - "[code://packages/server/src/install.ts#L55-L72](../../../../packages/server/src/install.ts#L55-L72) - `run`, which spawns the program by its name"
  - "[code://packages/server/test/plugin-install.test.ts](../../../../packages/server/test/plugin-install.test.ts) - the test file to extend"
---

## Objective

On Windows, `run` starts `npm` as `process.execPath` with `npm-cli.js`, with no shell.
When no `npm-cli.js` is found, it runs `npm` through the shell with quoted arguments.
On other platforms, `run` does not change.

## Files

- `UPDATE: packages/server/src/install.ts:55-72` - a pure `launch` function, and `run` spawns what it answers.
- `UPDATE: packages/server/test/plugin-install.test.ts` - the `launch` cases below.

## Steps

1. Read the decision in the plan's *Decisions locked in* table.
2. Add an exported `launch(program, argv, platform, env, execPath, exists)` to `install.ts`.
3. Make `launch` answer `{ command, args, shell }` and give the arguments unchanged off `win32`.
4. On `win32` for `npm`, use `env.npm_execpath` when its base name is `npm-cli.js` and it exists.
5. Else use `node_modules/npm/bin/npm-cli.js` in the folder of `execPath` when it exists.
6. Answer `execPath` as the command and the `npm-cli.js` path before the arguments.
7. When neither file exists, answer `npm` with `shell: true` and each argument in double quotes.
8. Make `run` call `launch` with `process.platform`, `process.env`, `process.execPath` and `existsSync`.
9. Keep the `stdio` of `run` and its answers as they are.
10. Add the test cases below.

## Validation

- `plugin-install.test.ts`: on `linux`, `launch` answers `npm` and the arguments unchanged, with no shell.
- `plugin-install.test.ts`: on `win32` with `npm_execpath` at a `npm-cli.js` that exists, `launch` answers `execPath` and that path first.
- `plugin-install.test.ts`: on `win32` with `npm_execpath` at `pnpm.cjs`, `launch` uses the `npm-cli.js` next to `execPath`.
- `plugin-install.test.ts`: on `win32` with no `npm-cli.js`, `launch` answers the shell and quotes a path with a space.
- By hand on Windows: `ahpd configure` installs `@ahpd/agent-claude`, `@ahpd/agent-cofold` and `@ahpd/agent-pi`.
- Run `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema`; each exits 0.
- Run vitest on `packages/sdk`, `packages/server`, `packages/agent-claude` and `packages/agent-acp`; all pass.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
