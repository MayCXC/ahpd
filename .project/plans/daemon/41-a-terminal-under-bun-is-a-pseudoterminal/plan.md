---
title: A terminal under Bun is a pseudoterminal
domain: daemon
status: built
priority: high
created: 2026-10-26
revalidated: 2026-10-26
changes:
  - specs/daemon.md
refs:
  - "[code://packages/server/src/pty.ts#L33-L122](../../../../packages/server/src/pty.ts#L33-L122) - `bunTerminal`, Bun's terminal as the port"
  - "[code://packages/server/src/pty.ts#L124-L160](../../../../packages/server/src/pty.ts#L124-L160) - `pty`, the loader, whose answer the daemon spreads into `shellTerminals`"
  - "[code://packages/server/src/pty.ts#L162-L172](../../../../packages/server/src/pty.ts#L162-L172) - the probe child, which must load nothing but `node-pty`"
  - "[code://packages/server/src/pty.ts#L174-L192](../../../../packages/server/src/pty.ts#L174-L192) - the shapes Bun hands back"
  - "[code://packages/server/src/commands/run.ts#L898-L899](../../../../packages/server/src/commands/run.ts#L898-L899) - the start asks `pty()` once"
  - "[code://.project/plans/daemon/27-ahpd-installs-with-one-line/plan.md#L81](../../../../.project/plans/daemon/27-ahpd-installs-with-one-line/plan.md#L81) - the intent: a terminal under Bun comes from Bun's own install"
  - "[code://packages/sdk/src/types/terminals.ts#L134-L161](../../../../packages/sdk/src/types/terminals.ts#L134-L161) - `Pty` and `SpawnPty`, the port; a host on another runtime passes its own"
  - "[code://packages/sdk/src/listen.ts#L19-L33](../../../../packages/sdk/src/listen.ts#L19-L33) - `runtime()`, which a second reader calls rather than copies, and its test of a global's presence"
  - "[code://packages/sdk/src/listen.ts#L180-L181](../../../../packages/sdk/src/listen.ts#L180-L181) - the Bun branch and the cast of `globalThis` it reaches Bun through"
  - "[code://packages/sdk/src/listen.ts#L615-L620](../../../../packages/sdk/src/listen.ts#L615-L620) - `BunServer` and `BunSocket`, only the members called, with no `bun-types`"
  - "[code://packages/server/src/plugins.ts#L418](../../../../packages/server/src/plugins.ts#L418) - the server asks `runtime()` from `@ahpd/sdk`"
  - "[code://packages/sdk/src/machines/terminals.ts#L241-L258](../../../../packages/sdk/src/machines/terminals.ts#L241-L258) - `createTerminal`, which takes the platform as a parameter"
  - "[code://packages/sdk/src/machines/terminals.ts#L332-L344](../../../../packages/sdk/src/machines/terminals.ts#L332-L344) - the environment a shell gets, `TERM` included"
  - "[code://packages/sdk/src/machines/terminals.ts#L405-L427](../../../../packages/sdk/src/machines/terminals.ts#L405-L427) - how the store calls a `SpawnPty`, and the one string `cmd.exe` gets"
  - "[code://packages/sdk/src/machines/terminals.ts#L491-L517](../../../../packages/sdk/src/machines/terminals.ts#L491-L517) - on pipes: `127` for a refused start, and the exit said once the output is drained"
  - "[code://packages/sdk/src/machines/terminals.ts#L581-L587](../../../../packages/sdk/src/machines/terminals.ts#L581-L587) - input goes to the pseudoterminal with no check of its state"
  - "[code://packages/sdk/src/machines/terminals.ts#L650-L654](../../../../packages/sdk/src/machines/terminals.ts#L650-L654) - the store's `close`, which names no signal"
  - "[code://packages/sdk/src/host/sleep.ts#L220-L221](../../../../packages/sdk/src/host/sleep.ts#L220-L221) - `queueMicrotask` for work after the current action"
  - "[code://packages/sdk/test/pty.test.ts#L21-L52](../../../../packages/sdk/test/pty.test.ts#L21-L52) - `fakePty` and `opened`, a stand-in binding and the store around it"
  - "[code://packages/sdk/test/github.test.ts#L19-L39](../../../../packages/sdk/test/github.test.ts#L19-L39) - `vi.stubGlobal`, undone in `afterEach`"
  - "[code://docs/sdk/TERMINALS.md#L21](../../../../docs/sdk/TERMINALS.md#L21) - a directory that is not there exits `127`"
  - https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L318-L342 - "Terminal (PTY) support" and its example, which awaits `exited` and then closes the terminal
  - https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L351-L382 - the terminal's options and methods
  - https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L417 - up to 1.3.13, terminals on Linux and macOS only
  - https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L486-L593 - the spawn options, the subprocess and the terminal as declared
  - https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L141-L147 - `kill` with a signal's name
  - https://github.com/oven-sh/bun/blob/bun-v1.3.13/test/js/bun/terminal/terminal.test.ts#L959-L985 - Bun's own test reads the whole output once `exited` has resolved
  - https://github.com/oven-sh/bun/blob/bun-v1.3.13/packages/bun-types/bun.d.ts#L7189 - `exited` is the exit code of the process
  - https://github.com/oven-sh/bun/blob/bun-v1.3.13/packages/bun-types/bun.d.ts#L7800-L7806 - the class `Terminal` in the `bun` module, and its `closed`
  - https://github.com/oven-sh/bun/blob/bun-v1.3.4/docs/runtime/child-process.mdx - no terminal section yet; it came with 1.3.5
  - https://github.com/oven-sh/bun/blob/bun-v1.3.14/docs/runtime/child-process.mdx#L419 - from 1.3.14, a terminal on Windows through ConPTY
  - npm://node-pty@1.1.0 - the shape the port names, read at its tag below
  - https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L50-L52 - arguments as one string are refused on Unix
  - https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L76 - the output is UTF-8 unless told otherwise
  - https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L109-L111 - the output is decoded with `setEncoding`
  - https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L249-L253 - `kill` sends `SIGHUP` when no signal is named
  - https://github.com/microsoft/node-pty/blob/v1.1.0/src/terminal.ts#L190-L195 - once the output closes, `write` does nothing
  - https://github.com/microsoft/node-pty/blob/v1.1.0/typings/node-pty.d.ts#L145-L155 - `onData` and `onExit` add a listener
  - https://github.com/microsoft/node-pty/blob/v1.1.0/src/unix/pty.cc#L418-L442 - on Linux, a failed `chdir` or `execvp` writes the failure and exits `1`
  - https://github.com/microsoft/node-pty/blob/v1.1.0/src/unix/spawn-helper.cc#L17-L22 - on macOS, a failed `chdir` exits `1` and writes nothing
---

## Goal

On Bun, a terminal is a real pseudoterminal, so a shell there runs its own prompt and its OSC 133 marks become command boundaries.
The daemon gets the terminal from Bun itself, as the daemon 27 plan meant, and never loads `node-pty` on Bun.
Node and Deno keep `node-pty` where it loads, and pipes otherwise.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "runtime\(\)" packages/` - the two calls in `listen.ts` and the Deno branch in `plugins.ts`.
- `rg -n "node-pty|isPty|pseudoterminal" docs/ .project/ README.md DEVELOPER.md` - the docs and records that name the binding.
- `rg -n "queueMicrotask|stubGlobal" packages/` - the deferral and the test pattern.
- `Not found: a Bun pseudoterminal in ahpd - searched "Bun.spawn", "terminal:" and "Bun.Terminal" in packages/.`

### Runtime path

```
ahpd start -> run.ts stamp('start: terminals') -> pty()
  -> runtime() is 'bun' -> Bun.Terminal is there and not win32 -> bunTerminal(Bun)
  -> shellTerminals({ pty }) -> createTerminal -> Bun.spawn([shell, ...args], { terminal: { cols, rows, data } })
  -> data -> terminal/data, OSC 133 -> terminal/commandExecuted, exited -> close -> terminal/exited
```

### Checked by hand on 2026-10-26

[implemented.md](implemented.md) has the commands and the outputs.

- Upstream's daemon at ed1534d4 on Bun 1.3.13 and 1.4.4 says `isPty: true`, and each shell exits `0` at once with no output.
- With an `exit` callback, a start Bun refuses crashes Bun 1.3.5, 1.3.12 and 1.3.13; with `data` alone, they throw `ENOENT`.
- With `data` alone, the whole output has arrived when `exited` resolves: 200 runs each on Linux 1.3.13 and 1.4.4, and macOS 1.3.13.
- On Bun 1.3.13 and 1.4.4, a closed terminal throws on `write` and `resize`.
- An interactive `bash` keeps running after `proc.kill()`, which sends `SIGTERM`, and exits `129` on `SIGHUP`.
- After a shell exits, `node-pty` does nothing on a write, throws `ioctl(2) failed, EBADF` on a resize, and takes a kill. This binding on Bun 1.3.13 and 1.4.4 does the same.
- Bun 1.3.13 and 1.4.4 throw `ERR_INVALID_ARG_TYPE` from `kill` for a signal they do not know, and `node-pty` swallows the same call.

### Gaps

- On Bun, the daemon's terminals say they are pseudoterminals and every shell in them dies at once.
- No binding in ahpd is built on Bun's own terminal.

## Answers

| What | Source | Task |
| --- | --- | --- |
| `pty()` asks `runtime()` from `@ahpd/sdk` which runtime it is on, and never tests `globalThis.Bun` itself | [code://packages/sdk/src/listen.ts#L19-L33](../../../../packages/sdk/src/listen.ts#L19-L33), a second reader "calls this rather than copying it"; [code://packages/server/src/plugins.ts#L418](../../../../packages/server/src/plugins.ts#L418), the server's own call | 01 |
| `@ahpd/sdk` is imported inside `pty()`, not at the top of the file | [code://packages/server/src/pty.ts#L162-L172](../../../../packages/server/src/pty.ts#L162-L172), the probe child: "nothing else is imported, so what it exits with is about `node-pty` alone" | 01 |
| The Bun branch is `if (runtime() === 'bun')`, before the probe | [code://packages/sdk/src/listen.ts#L180](../../../../packages/sdk/src/listen.ts#L180), `if (here === 'bun')` | 01 |
| Bun is reached as `(globalThis as unknown as { Bun: BunRuntime }).Bun` | [code://packages/sdk/src/listen.ts#L181](../../../../packages/sdk/src/listen.ts#L181) | 01 |
| A Bun gets its own terminal where `Bun.Terminal` is there, tested as `Bun.Terminal !== undefined` | [code://packages/sdk/src/listen.ts#L30](../../../../packages/sdk/src/listen.ts#L30), the test of `g.Bun`'s presence; https://github.com/oven-sh/bun/blob/bun-v1.3.13/packages/bun-types/bun.d.ts#L7800-L7806; the 1.3.4 docs have no terminal section | 01 |
| On Windows, Bun gets pipes, as on upstream | (defaulted: upstream's pipes, until open question 1 is answered); https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L417, terminals on Linux and macOS only up to 1.3.13 | 01 |
| On Bun, `node-pty` is neither probed nor loaded, and a Bun with no terminal of its own gets pipes | upstream's daemon at ed1534d4 on Bun 1.3.13 and 1.4.4: every shell exits at once with no output, see [implemented.md](implemented.md) | 01 |
| `BunRuntime` declares `Terminal` and `spawn`, with only the options passed | [code://packages/sdk/src/listen.ts#L615-L620](../../../../packages/sdk/src/listen.ts#L615-L620), the shapes "named so the code above reads"; https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L486-L513 | 01 |
| `BunSubprocess` declares `terminal`, `exited` and `kill` | the same pattern; https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L546-L553 | 01 |
| `BunTerminal` declares `closed`, `write`, `resize` and `close` | the same pattern; https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L583-L593 | 01 |
| Arguments as one string throw `node-pty`'s own error, `args as a string is not supported on unix.` | https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L50-L52 | 01 |
| The shell starts as `Bun.spawn([file, ...args], { cwd, env, terminal: { cols, rows, data } })` | https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L322-L332 | 01 |
| The terminal gets no `exit` callback | the requirement, the exit said after the whole output, is met without it: Bun's example and its test read the output after `exited`, and the 200-run probes found nothing missing; with it, a start Bun refuses crashes Bun 1.3.5 to 1.3.13 | 01 |
| `cwd` is passed only when the store names one | [code://packages/sdk/src/machines/terminals.ts#L416](../../../../packages/sdk/src/machines/terminals.ts#L416), the store's own spread | 01 |
| `env` is passed as the store built it, and the option `name` is not passed | https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L357, "set `TERM` env var separately via `env` option"; [code://packages/sdk/src/machines/terminals.ts#L341](../../../../packages/sdk/src/machines/terminals.ts#L341) sets `TERM` | 01 |
| `onData` and `onExit` each keep a list of listeners | https://github.com/microsoft/node-pty/blob/v1.1.0/typings/node-pty.d.ts#L145-L155, "Adds an event listener" | 01 |
| One `TextDecoder` with `stream: true` decodes the output, and a chunk that decodes to nothing is not said | https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L76 and https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L109-L111, UTF-8 through `setEncoding`, which emits no empty chunk; [code://packages/sdk/src/listen.ts#L221](../../../../packages/sdk/src/listen.ts#L221) decodes Bun's bytes with `TextDecoder` | 01 |
| The exit code is what `proc.exited` resolves to, `128` plus the number for a signal | https://github.com/oven-sh/bun/blob/bun-v1.3.13/packages/bun-types/bun.d.ts#L7189; measured `129` for `SIGHUP` and `143` for `SIGTERM`; [code://packages/sdk/src/machines/terminals.ts#L497-L499](../../../../packages/sdk/src/machines/terminals.ts#L497-L499), the store's own convention for a signal, "128+n is the shell's own convention for one" | 01 |
| Once `exited` resolves, the terminal is closed and the exit said | https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L337-L341, `await proc.exited;` then `proc.terminal.close();`; [code://packages/sdk/src/machines/terminals.ts#L504-L517](../../../../packages/sdk/src/machines/terminals.ts#L504-L517), the exit after the output | 01 |
| `write` is the terminal's `write` while the terminal is open, and does nothing once it is closed | https://github.com/microsoft/node-pty/blob/v1.1.0/src/terminal.ts#L190-L195, `this.write = () => {}`; `closed` at https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L586; [code://packages/sdk/src/machines/terminals.ts#L581-L587](../../../../packages/sdk/src/machines/terminals.ts#L581-L587) writes input with no check | 01 |
| `resize` is the terminal's `resize`, which throws once the terminal has closed, as `node-pty`'s does once its descriptor has | https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L370-L371; https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L271-L278 with https://github.com/microsoft/node-pty/blob/v1.1.0/src/unix/pty.cc#L525; measured after exit: `node-pty` throws `ioctl(2) failed, EBADF`, Bun 1.3.13 and 1.4.4 throw `Terminal is closed` | 01 |
| `kill` sends `signal ?? 'SIGHUP'` through `proc.kill`, and swallows what that throws | https://github.com/microsoft/node-pty/blob/v1.1.0/src/unixTerminal.ts#L249-L253, `signal \|\| 'SIGHUP'` in a `try` whose `catch` swallows; https://github.com/oven-sh/bun/blob/bun-v1.3.13/docs/runtime/child-process.mdx#L141-L147; [code://packages/sdk/src/machines/terminals.ts#L650-L654](../../../../packages/sdk/src/machines/terminals.ts#L650-L654) names no signal; measured: Bun 1.3.13 and 1.4.4 throw `ERR_INVALID_ARG_TYPE` for a signal they do not know | 01 |
| A start Bun refuses writes the error's message and `\r\n` into the output and exits `127` | [code://docs/sdk/TERMINALS.md#L21](../../../../docs/sdk/TERMINALS.md#L21); [code://packages/sdk/src/machines/terminals.ts#L491-L495](../../../../packages/sdk/src/machines/terminals.ts#L491-L495), the same on pipes; a pseudoterminal ends its lines with `\r\n` | 01 |
| That report waits for a microtask | [code://packages/sdk/src/host/sleep.ts#L220-L221](../../../../packages/sdk/src/host/sleep.ts#L220-L221); [code://packages/sdk/src/machines/terminals.ts#L415-L423](../../../../packages/sdk/src/machines/terminals.ts#L415-L423) puts its listeners on after the call | 01 |
| The cases stub `Bun` with `vi.stubGlobal` and undo it in `afterEach` | [code://packages/sdk/test/github.test.ts#L19-L39](../../../../packages/sdk/test/github.test.ts#L19-L39) | 01 |
| `fakeBun` stands in for `Bun.spawn` and says what a case tells it | [code://packages/sdk/test/pty.test.ts#L21-L41](../../../../packages/sdk/test/pty.test.ts#L21-L41), `fakePty` | 01 |
| `fakeBun`'s terminal throws `Terminal is closed` on `write` and `resize` once closed | measured on Bun 1.3.13 and 1.4.4 | 01 |
| `fakeBun`'s `kill` throws when a case says Bun refuses the signal | measured on Bun 1.3.13 and 1.4.4, `ERR_INVALID_ARG_TYPE` | 01 |
| Case: "is Bun's own, started with the argv, directory, size and environment the store gives" | the start, `cwd`, `env` and `exit` callback rows above | 01 |
| Case: "is a pseudoterminal to the store, which reads its output, its marks and its exit code" | [code://packages/sdk/test/pty.test.ts#L43-L52](../../../../packages/sdk/test/pty.test.ts#L43-L52), `opened`; the decoder and exit rows above | 01 |
| Case: "refuses arguments as one string, as node-pty does on Unix" | the arguments row above | 01 |
| Case: "hands over a character split across two reads whole, and nothing for its first half" | the decoder row above | 01 |
| Case: "says the exit once the process has exited, with the code Bun gives, and closes the terminal" | the exit code and close rows above | 01 |
| Case: "writes nothing once its terminal has closed, as node-pty writes nothing once its output has" | the `write` row above | 01 |
| Case: "sends SIGHUP when no signal is named, and a named one as it is" | the `kill` row above | 01 |
| Case: "swallows a signal Bun refuses, as node-pty swallows what process.kill refuses" | the `kill` row above | 01 |
| Case: "writes and resizes Bun's terminal" | the `write` and `resize` rows above | 01 |
| Case: "says a start Bun refuses in its output, with 127, to listeners put on after the call" | the refused start and microtask rows above | 01 |
| Case: "is Bun's own where Bun has Bun.Terminal" | the `Bun.Terminal` row above | 01 |
| Case: "is pipes on a Bun without Bun.Terminal" | the `node-pty` and `Bun.Terminal` rows above | 01 |
| Case: "is pipes on Windows, where the store hands cmd.exe its line as one string" | the Windows row above | 01 |
| `TERMINALS.md` names both bindings in its terms | [code://docs/sdk/TERMINALS.md#L11](../../../../docs/sdk/TERMINALS.md#L11) | 02 |
| `TERMINALS.md` says a missing directory exits `1` under `node-pty`, with the failure written on Linux and nothing on macOS | https://github.com/microsoft/node-pty/blob/v1.1.0/src/unix/pty.cc#L418-L442; https://github.com/microsoft/node-pty/blob/v1.1.0/src/unix/spawn-helper.cc#L17-L22; measured on Node | 02 |
| `TERMINALS.md` says the binding on Node and Deno, and the one on Bun | [code://docs/sdk/TERMINALS.md#L27-L39](../../../../docs/sdk/TERMINALS.md#L27-L39), "Pipes, or a pseudoterminal" | 02 |
| `INSTALL.md` says what Bun gets, in the `node-pty` tip and in "Runtimes" | [code://docs/server/INSTALL.md#L54-L86](../../../../docs/server/INSTALL.md#L54-L86) | 02 |
| `README.md` says it in the "Terminals" row | [code://README.md#L403](../../../../README.md#L403) | 02 |
| `DEVELOPER.md` says a change to `pty.ts` is run on Bun and on Node | [code://DEVELOPER.md#L53-L54](../../../../DEVELOPER.md#L53-L54), "a change to it is run on more than one" | 02 |
| `runtime()`'s comment names the binding as a second caller | [code://packages/sdk/src/listen.ts#L22-L26](../../../../packages/sdk/src/listen.ts#L22-L26) | 02 |
| `Pty`'s comment says the daemon passes Bun's own on Bun | [code://packages/sdk/src/types/terminals.ts#L134-L142](../../../../packages/sdk/src/types/terminals.ts#L134-L142), "a host on another runtime passes its own" | 02 |
| The daemon spec covers `pty.ts` and says which runtime gets which terminal | the do-spec skill: a spec is corrected in place when behaviour changes | 02 |
| `CHANGELOG.md` gets an entry under `## 0.14.1 - unreleased` | the heading read `## 0.14.0 - unreleased` until git://81298483; daemon 40 "ships as 0.14.1" | 02 |
| `plans/index.md` gets the row, and the next free number is `42` | [code://.project/plans/index.md#L67-L69](../../../../.project/plans/index.md#L67-L69) | 02 |

## Proposed architecture

- **Data flow** - Bun's bytes are decoded once and handed to the store as text; the store's input reaches `terminal.write` while the terminal is open.
- **Event flow** - `proc.exited` closes the terminal and says the exit, once; a refused start says its error and `127` after the call.
- **State flow** - nothing outside the terminal: its listeners and its subprocess.
- **Layer responsibilities** - server: the binding and which runtime gets it · sdk: two comments · docs: `TERMINALS.md`, `INSTALL.md`, `README.md`, `DEVELOPER.md`.
- **Source-of-truth files** - [`code://packages/server/src/pty.ts`](../../../../packages/server/src/pty.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The daemon on Bun hands the store Bun's own terminal](task-01-the-daemon-on-bun-hands-the-store-buns-own-terminal.md) | done | - |
| [02 - The docs say which runtime gets which terminal](task-02-the-docs-say-which-runtime-gets-which-terminal.md) | done | 01 |

## Risks and tradeoffs

- A shell that a signal ended exits `128` plus the signal on Bun, and `0` under `node-pty`. `TERMINALS.md` says the one on Bun.
- A directory that is not there exits `127` on Bun, and `1` under `node-pty`. `TERMINALS.md` says which.
- A job the shell left in the background loses what it writes after the shell exits, because the terminal is closed then.
- Bun 1.3.14 and later have a terminal on Windows, and Windows gets pipes on Bun until open question 1 is answered.

## Resume state

- **Done so far:** built 2026-10-26, see [implemented.md](implemented.md).
- **Next action:** an answer to open question 1.
- **Open questions:**
  1. Does Bun 1.3.14 and later get its own terminal, ConPTY, on Windows? - proposed: pipes there, as on upstream, until a Windows run decides.
     The store hands `cmd.exe` its line as one string.
     `Bun.spawn` takes an argv, and has a `windowsVerbatimArguments` option ([docs at 1.3.14](https://github.com/oven-sh/bun/blob/bun-v1.3.14/docs/runtime/child-process.mdx#L516)).
     No source here joins the two, and no Windows machine was at hand to measure it.
- **Watch out for:** never load `node-pty` on Bun, whatever the probe says.
  Never give the terminal an `exit` callback while Bun 1.3.5 to 1.3.13 are supported.
  A by-hand daemon gets XDG folders under a temp folder and a port other than 9187.

## Final verification checklist

- [x] On Bun 1.3.13 and 1.4.4, a terminal is a pseudoterminal where `^C`, a resize, OSC 133 marks and `exit 7` all work.
- [x] On Bun 1.3.13 and 1.4.4 a command's whole output arrives before its exit, and a missing directory exits `127` with no crash.
- [x] On Node the terminals are `node-pty`'s, as on upstream.
- [x] `plans/index.md` updated.
