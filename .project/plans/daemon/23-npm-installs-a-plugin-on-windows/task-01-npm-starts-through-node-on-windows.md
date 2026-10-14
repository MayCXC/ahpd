---
title: npm starts through node on Windows
status: implemented
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

Done 2026-10-13. Every step is built, and every case the Validation names passes.

File by file:

- `packages/server/src/install.ts` - `Launch`, the shape `spawn` takes, and the exported `launch`, which answers it for one program on one platform. Steps 2 to 7. Off `win32`, and for any program but `npm`, it answers the program by its name with the arguments unchanged and no shell. On `win32` for `npm` it takes `npm-cli.js` from `env.npm_execpath` when that names one and it exists, else from `node_modules/npm/bin/npm-cli.js` beside `execPath`. Either way the answer is `execPath` with that script first and no shell. Neither file is a Node whose npm is elsewhere, and then the answer is `npm` through the shell, each argument in double quotes. `run` calls it with `process.platform`, `process.env`, `process.execPath` and `existsSync`, and gives `spawn` the `command`, the `args` and the `shell` it answers. Steps 8 and 9. The `stdio` and the `Ran` answers are as they were.
- `packages/server/test/plugin-install.test.ts` - four cases, and `launch` added to the import. Step 10. The first holds a Linux `npm` and a Windows `git` both unchanged. The second holds `npm_execpath` at an `npm-cli.js` that exists. The third holds `npm_execpath` at `pnpm.cjs`, so npm's script is looked for beside node. The fourth holds neither file, so npm goes to the shell and an argument with a space comes back quoted. 52 cases before, 56 after.

Judgement calls the plan does not decide:

- The paths are read with `node:path`'s `win32` flavour, not the host's. The branch that reads them is the Windows one, and the function is given the platform, so it should answer the same wherever it runs. A case on Linux can then hand it a real `C:\Program Files\...` path. `packages/computer/src/runtime.ts` reads container paths with `posix` in the same way.
- The early return covers any program but `npm`, which the decision reaches for npm alone. `git`, `gh` and `ssh` are `.exe` files on Windows, and a shell there would only put `cmd.exe` between the daemon and the program.
- `exists` is a parameter rather than `existsSync` read inside, so a case can hold both lookups and answer differently for each.

Validation:

- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` each exit 0.
- Vitest on the four packages in one command, with `pnpm -s schema` first and `--maxWorkers=2 --testTimeout=10000`: 241 files and 4345 tests pass. `plugin-install.test.ts` is 56 tests, its four new ones among them.
- The Windows checks by hand are not run: this build is on Linux, and the spawn itself is what a case here cannot hold. `ahpd configure` and `ahpd plugin remove` on Windows are the task's last two Validation lines.

Left:

- `packages/sdk/test/fixtures/wire.jsonl` is rewritten by the suite, as for every task in this plan. 33 lines differ, none of them about npm. One is the `getNetworkDiagnosticsInfo` endpoint line, which this box answers with its own model URL where the committed file names `https://api.anthropic.com/v1/models`. The other 32 are session and chat ids and `changes` fields. Every command that would put it back is denied in this mode, so run `git restore packages/sdk/test/fixtures/wire.jsonl` before committing.
- `.project/plans/index.md` has no row for daemon 23 yet. That is the plan's own checklist, and not this task's.
