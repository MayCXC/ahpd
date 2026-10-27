---
title: The daemon on Bun hands the store Bun's own terminal
status: done
depends: []
layer: server
refs:
  - "[code://packages/server/src/pty.ts#L33-L153](../../../../packages/server/src/pty.ts#L33-L153) - `bunTerminal`, Bun's terminal as the port"
  - "[code://packages/server/src/pty.ts#L155-L208](../../../../packages/server/src/pty.ts#L155-L208) - `makesTerminal`, the loader and its Bun branch"
  - "[code://packages/server/src/pty.ts#L222-L241](../../../../packages/server/src/pty.ts#L222-L241) - the shapes Bun hands back"
  - "[code://packages/server/test/server-pty.test.ts](../../../../packages/server/test/server-pty.test.ts) - the binding against a stand-in of Bun, and the loader's choice"
---

## Objective

On a Bun that makes a terminal, `pty()` answers a `SpawnPty` built on `Bun.spawn` with its `terminal` option.
That is Linux and macOS from Bun 1.3.5, and Windows from Bun 1.3.14.
Every other Bun gets pipes, and Node and Deno keep the probe and `node-pty`.

## Files

- `UPDATE: packages/server/src/pty.ts:16-50` - the Bun binding, and the loader's Bun branch.
- `CREATE: packages/server/test/server-pty.test.ts` - the binding against a stand-in of `Bun.spawn`, and the loader's choice on Bun.

## Steps

1. Add `bunTerminal`, which maps each `Pty` member to the one Bun documents.
2. On Unix, refuse arguments as one string with the error `node-pty` throws there.
3. Start the shell with `cols`, `rows` and `data` in the `terminal` option, and no `exit` callback.
4. Close the terminal when `proc.exited` resolves, then say the exit with its code.
5. Say a start that Bun refuses in the output with `127`, in a microtask.
6. Write input only while the terminal is open.
7. On Unix, send `SIGHUP` from `kill` when the store names no signal, and swallow what `kill` throws, as `node-pty` does.
8. On Windows, pass a string as `[file, line]` with `windowsVerbatimArguments`, and an argv as it is.
9. On Windows, refuse a named signal with `node-pty`'s error, and call `proc.kill()` with none.
10. Import `@ahpd/sdk` inside `pty()` and ask `runtime()` there.
11. Answer Bun's binding where Bun makes and closes one terminal, and pipes on every other Bun.
12. Declare `BunRuntime`, `BunSubprocess` and `BunTerminal` at the end of the file.
13. Add `server-pty.test.ts`, which stubs `Bun` with `vi.stubGlobal`.
14. Run the gates, and the daemon by hand on Bun and on Node.

## Validation

- `packages/server/test/server-pty.test.ts` holds 17 cases, and all 17 pass.
- Take out the code behind the `exit` callback, closed `write`, `Bun.Terminal` and refused signal cases, and see each fail.
- Take out the verbatim flag, the try at a terminal and the Windows `kill`, and see their cases fail.
- `pnpm typecheck` and `pnpm boundary` exit 0, and vitest on `packages/server` and `packages/sdk` passes.
- The daemon from `dist` runs by hand on Bun 1.3.13 and 1.4.4, and on Node.
- On Windows, run the checks in `.project/pending/daemon-41-windows-checks.md`.

## Resume

Done 2026-10-26.
A first build gave the terminal an `exit` callback, to say the exit after the end of the output.
On Bun 1.3.5 to 1.3.13 that callback makes a start Bun refuses crash Bun, so that build handed Bun's terminal out only from 1.3.14.
Bun's own example and test read the whole output after `exited`, with no `exit` callback, and the probes found no output missing there.
So the binding follows that example, and every Bun with `Bun.Terminal` gets it.
In review, `kill` took `node-pty`'s swallow of a signal the runtime refuses.
A resize after exit throws under `node-pty` too, measured, so it stays Bun's own.
Windows then took `node-pty`'s Windows behaviour, which the store's own `cmd.exe` handling on pipes already matches.
A terminal made and closed at start decides which Bun gets the binding, since Bun 1.3.13 throws on Windows.
No Windows machine was at hand, so that run waits in `.project/pending/daemon-41-windows-checks.md`.
[implemented.md](implemented.md) has the runs.
