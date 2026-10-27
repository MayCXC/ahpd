---
title: The docs say which runtime gets which terminal
status: done
depends:
  - task-01-the-daemon-on-bun-hands-the-store-buns-own-terminal.md
layer: docs
refs:
  - "[code://docs/sdk/TERMINALS.md#L27-L39](../../../../docs/sdk/TERMINALS.md#L27-L39) - \"Pipes, or a pseudoterminal\""
  - "[code://docs/server/INSTALL.md#L54-L86](../../../../docs/server/INSTALL.md#L54-L86) - the `node-pty` tip and \"Runtimes\""
  - "[code://.project/specs/daemon.md](../../../../.project/specs/daemon.md) - the spec that covers the server's files"
---

## Objective

The docs, the comments and the daemon spec say what a Bun with `Bun.Terminal` gives on Linux and macOS: a terminal of its own.
`Bun.Terminal` came with Bun 1.3.5.
They say that every other Bun gets pipes and that Node and Deno keep `node-pty`.

## Files

- `UPDATE: docs/sdk/TERMINALS.md:11` - the terms row names both bindings.
- `UPDATE: docs/sdk/TERMINALS.md:21` - a missing directory exits `1` under `node-pty`.
- `UPDATE: docs/sdk/TERMINALS.md:31` - the binding on Node and Deno, and the binding on Bun.
- `UPDATE: docs/server/INSTALL.md:61` - the `node-pty` tip says that Bun never loads it.
- `UPDATE: docs/server/INSTALL.md:84` - "Runtimes" says which terminal each runtime gets.
- `UPDATE: README.md:403` - the "Terminals" row names Bun's own.
- `UPDATE: DEVELOPER.md:53` - a change to `pty.ts` is run on Bun and on Node.
- `UPDATE: packages/sdk/src/listen.ts:22-25` - the comment on `runtime()` names the binding as a caller.
- `UPDATE: packages/sdk/src/types/terminals.ts:139-140` - the comment on `Pty` says what the daemon passes on Bun.
- `UPDATE: .project/specs/daemon.md` - `pty.ts` in `covers`, its ref, and a scenario for each runtime.
- `UPDATE: CHANGELOG.md:5` - an entry under `0.14.1 - unreleased`.
- `UPDATE: .project/plans/index.md:66-68` - the row, and `42` as the next free number.

## Steps

1. Write the Bun binding into "Pipes, or a pseudoterminal" in `TERMINALS.md`.
2. Write the exit code `node-pty` gives a missing directory into `TERMINALS.md`.
3. Write what Bun gets into the `node-pty` tip and into "Runtimes" in `INSTALL.md`.
4. Name Bun's own terminal in the "Terminals" row of `README.md`.
5. Add the line on `pty.ts` under "On Bun" in `DEVELOPER.md`.
6. Name the binding in the comments on `runtime()` and on `Pty`.
7. Add `pty.ts` to the daemon spec, with a scenario for each runtime and one for an exit on Bun.
8. Add the entry to `CHANGELOG.md` under `## 0.14.1 - unreleased`.
9. Add the index row, and set the next free number to `42`.

## Validation

- `node .agents/skills/do-spec/scripts/lint-prose.mjs` on the plan folder and the spec exits 0.
- Every link in the changed docs resolves.

## Resume

Done 2026-10-26.
`TERMINALS.md` said `127` for a missing directory under every binding.
Under `node-pty` it is `1`, with the failure written on Linux and nothing on macOS, and the doc now says so.
