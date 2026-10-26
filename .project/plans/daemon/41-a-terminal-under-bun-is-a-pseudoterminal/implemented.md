---
title: A terminal under Bun is a pseudoterminal - implemented
date: 2026-10-26
refs:
  - "[code://packages/server/src/pty.ts#L33-L160](../../../../packages/server/src/pty.ts#L33-L160) - `bunTerminal` and the loader's Bun branch"
  - "[code://packages/server/test/server-pty.test.ts](../../../../packages/server/test/server-pty.test.ts) - the thirteen cases"
---

On a Bun that has `Bun.Terminal`, from 1.3.5, on Linux and macOS, a terminal is Bun's own pseudoterminal.
Every other Bun gets pipes, and `node-pty` is never loaded on Bun.

## What was built

- [`code://packages/server/src/pty.ts`](../../../../packages/server/src/pty.ts) - `bunTerminal`, which starts the shell with `Bun.spawn` and its `terminal` option, as Bun's example does, and the loader's Bun branch.
- [`code://packages/server/test/server-pty.test.ts`](../../../../packages/server/test/server-pty.test.ts) - the binding against a stand-in of Bun, and the loader's choice on Bun.
- `TERMINALS.md`, `INSTALL.md`, `README.md`, `DEVELOPER.md`, the comments on `runtime()` and `Pty`, the daemon spec and `CHANGELOG.md` say which runtime gets which terminal.

## Verified

- `server-pty.test.ts`: 13 of 13 pass. The `exit` callback case fails when the callback is added back. The closed `write` case fails without the check of `closed`. The `Bun.Terminal` case fails without the presence test. The refused signal case fails without the `try` around `proc.kill`.
- `pnpm -s typecheck`, `pnpm -s boundary`, `pnpm -s schema` and `pnpm -s build` exit 0.
- Vitest on `packages/server` and `packages/sdk`, with `--maxWorkers=2 --testTimeout=10000`: 5030 tests pass, 4 skip and 5 fail.
- The 4 in `server-cli-restart.test.ts` pass alone, 12 of 12.
- The fifth, a `plugin` case in `server-cli-verbs.test.ts`, starts the command line five times under the 5 s default. With a 60 s limit it passes in 2.2 s here, and in 5.4 s on upstream's binding.

### The daemon by hand

`run-daemon.sh` starts the daemon from `packages/server/dist/main.js` on a runtime, with XDG folders under a temp folder and `--no-plugins`.
`drive.mjs` drives it over AHP with the protocol's own TypeScript client.
Terminal one runs `tty; stty size`, a resize, a marker, a `^C` on `sleep 30` and `exit 7`.
Two is disposed, and three opens in `/no/such/dir`.
Four runs `seq 1 20000; exit 3`, and five opens after input to the exited four.

| Daemon | Runtime | One | Two | Three | Four | Five |
| --- | --- | --- | --- | --- | --- | --- |
| this branch | Node 24.21, `node-pty` | pty, 5 commands, resize seen, `^C` stops it, exit 7 | exit 0 | exit 1, `chdir(2) failed.: No such file or directory` | 20000 lines in order, exit 3, no output after it | pty, exit 0 |
| this branch | Bun 1.3.13 | the same | exit 129 | exit 127, `ENOENT: no such file or directory, posix_spawn '/bin/bash'` | the same | the same |
| this branch | Bun 1.4.4 | the same | exit 129 | exit 127, the same message | the same | the same |
| upstream ed1534d4 | Bun 1.3.13 | pty, exits 0 after 121 ms, no output | already exited | exit 1, `chdir(2) failed.` | no output, exit 0 | exits at once |
| upstream ed1534d4 | Bun 1.4.4 | pty, exits 0 after 130 ms, no output | already exited | exit 1, `chdir(2) failed.` | no output, exit 0 | exits at once |

The daemon logs on Bun hold no `Terminal is closed`, no panic and no uncaught error.

### Probes

`probe-drain.mjs` reads a terminal's output at three points, 200 runs each, 228,894 characters a run:

```js
const runs = Number(process.argv[2] ?? 100);
const mode = process.argv[3] ?? "exited";
const N = 40000;
let expected = "";
for (let i = 1; i <= N; i++) expected += `${i}\n`;
let incomplete = 0;
let missing = 0;
for (let r = 0; r < runs; r++) {
  const chunks = [];
  const decoder = new TextDecoder();
  let eof;
  const ended = new Promise((resolve) => { eof = resolve; });
  const terminal = { cols: 80, rows: 24, data(_terminal, bytes) { chunks.push(decoder.decode(bytes, { stream: true })); } };
  if (mode === "eof") terminal.exit = () => eof();
  const proc = Bun.spawn(["seq", "1", String(N)], { terminal });
  if (mode !== "spawn") await proc.exited;
  if (mode === "eof") await ended;
  const got = chunks.join("").replaceAll("\r\n", "\n");
  if (mode === "spawn") await proc.exited;
  proc.terminal.close();
  if (got !== expected) incomplete++;
  if (got.replace(/[^0-9\n]/g, "") !== expected) missing++;
}
console.log(Bun.version, mode, `runs=${runs}`, `differ=${incomplete}`, `missing=${missing}`);
```

| Bun | System | At spawn, missing | After `exited`, missing | After the `exit` callback, missing |
| --- | --- | --- | --- | --- |
| 1.3.13 | Linux | 200 | 0 | 0 |
| 1.4.4 | Linux | 200 | 0 | 0 |
| 1.3.13 | macOS | 200 | 0 | 0 |

On macOS, 15 runs after `exited` and 17 after the callback carry a stray `\r`, which is the terminal's own and is no missing output.

`probe-refused.mjs` starts a shell in a folder that is not there:

```js
const callbacks = process.argv[2] ?? "data";
const terminal = { cols: 80, rows: 24, data() {} };
if (callbacks === "both") terminal.exit = () => {};
try {
  Bun.spawn(["/bin/sh", "-c", "echo hi"], { cwd: "/not-there-at-all", terminal });
  console.log(Bun.version, callbacks, "returned without throwing");
}
catch (error) {
  console.log(Bun.version, callbacks, "threw", error.code ?? error.message);
}
await Bun.sleep(300);
Bun.gc(true);
await Bun.sleep(300);
console.log(Bun.version, callbacks, "alive");
```

| Bun | `data` alone | `data` and `exit` |
| --- | --- | --- |
| 1.3.5, Linux | throws `ENOENT`, exits 0 | returns, the error escapes, exits 1 |
| 1.3.12, Linux | throws `ENOENT`, exits 0 | returns, the error escapes, exits 1 |
| 1.3.13, Linux | throws `ENOENT`, exits 0 | returns, the error escapes, exits 1 |
| 1.3.13, macOS | throws `ENOENT`, exits 0 | returns, Bun reports a crash |
| 1.3.14, Linux | throws `ENOENT`, exits 0 | throws `ENOENT`, exits 0 |
| 1.4.4, Linux | throws `ENOENT`, exits 0 | throws `ENOENT`, exits 0 |

With a handler for uncaught errors in place, the same start on 1.3.5, 1.3.12 and 1.3.13 ends in a segmentation fault, status 133.

On Bun 1.3.13 and 1.4.4, `typeof Bun.Terminal` is `function`.
Once closed, a terminal throws `Terminal is closed` on `write` and on `resize`, and `kill` on an exited process does not throw.
A shell ended by `SIGTERM` gives `exited` 143.
An interactive `bash` keeps running after `proc.kill()`, and exits 129 on `SIGHUP`.

`probe-after-exit.mjs` asks the daemon's own binding for a terminal, lets its shell exit, and then writes, resizes and kills it:

```js
const root = process.argv[2];
const { pty } = await import(`${root}/packages/server/dist/pty.js`);
const { pty: spawn } = await pty();
const runtime = typeof Bun === "object" ? `bun ${Bun.version}` : `node ${process.version}`;
if (spawn === undefined) { console.log(runtime, "no binding"); process.exit(1); }
const term = spawn("/bin/sh", ["-c", "echo done"], { cols: 80, rows: 24, env: process.env });
let out = "";
term.onData((data) => { out += data; });
const exit = await new Promise((resolve) => term.onExit(resolve));
await new Promise((resolve) => setTimeout(resolve, 500));
const tryIt = (name, fn) => {
  try { fn(); console.log(runtime, name, "ok"); }
  catch (error) { console.log(runtime, name, "threw", error.message); }
};
console.log(runtime, "exit", JSON.stringify(exit), "output", JSON.stringify(out.trim()));
tryIt("write after exit", () => term.write("x"));
tryIt("resize after exit", () => term.resize(100, 30));
tryIt("kill after exit", () => term.kill());
```

| Binding | `write` after exit | `resize` after exit | `kill` after exit |
| --- | --- | --- | --- |
| `node-pty` 1.1.0, Node 24.21 | does nothing | throws `ioctl(2) failed, EBADF` | does nothing |
| this binding, Bun 1.3.13 | does nothing | throws `Terminal is closed` | does nothing |
| this binding, Bun 1.4.4 | does nothing | throws `Terminal is closed` | does nothing |

`probe-kill.mjs` sends a terminal's process a signal Bun does not know, while it runs and after it exits:

```js
const proc = Bun.spawn(["sleep", "30"], { terminal: { cols: 80, rows: 24, data() {} } });
const tryIt = (name, fn) => {
  try { fn(); console.log(Bun.version, name, "ok"); }
  catch (error) { console.log(Bun.version, name, "threw", error.code ?? "", error.message); }
};
tryIt("kill('SIGFOO') while running", () => proc.kill("SIGFOO"));
tryIt("kill(99999) while running", () => proc.kill(99999));
tryIt("kill('SIGHUP') while running", () => proc.kill("SIGHUP"));
await proc.exited;
proc.terminal.close();
tryIt("kill('SIGHUP') after exit", () => proc.kill("SIGHUP"));
tryIt("kill('SIGFOO') after exit", () => proc.kill("SIGFOO"));
```

On Bun 1.3.13 and 1.4.4, `SIGFOO` throws `ERR_INVALID_ARG_TYPE` while the process runs and after it exits, and so does `99999`; `SIGHUP` throws in neither case.
`node-pty` 1.1.0 on Node 24.21 takes `kill('SIGFOO')` without throwing.

`probe-binding.mjs` runs this binding from `dist` on macOS, with Bun 1.3.13 from Homebrew:

```js
const root = process.argv[2];
const runs = Number(process.argv[3] ?? 50);
const { pty } = await import(`${root}/packages/server/dist/pty.js`);
const { pty: spawn } = await pty();
const runtime = typeof Bun === "object" ? `bun ${Bun.version} ${process.platform}` : `node ${process.version} ${process.platform}`;
if (spawn === undefined) { console.log(runtime, "no binding"); process.exit(1); }

const N = 40000;
let expected = "";
for (let i = 1; i <= N; i++) expected += `${i}\n`;
let missing = 0;
let lateOutput = 0;
let wrongCode = 0;
for (let r = 0; r < runs; r++) {
  const term = spawn("/bin/sh", ["-c", `seq 1 ${N}; exit 3`], { cols: 80, rows: 24, env: process.env });
  let out = "";
  let exited = false;
  term.onData((data) => { if (exited) lateOutput++; out += data; });
  const exit = await new Promise((resolve) => term.onExit(resolve));
  exited = true;
  await new Promise((resolve) => setTimeout(resolve, 50));
  if (out.replace(/[^0-9\n]/g, "") !== expected) missing++;
  if (exit.exitCode !== 3) wrongCode++;
}
console.log(runtime, `runs=${runs}`, `missing=${missing}`, `output-after-exit=${lateOutput}`, `wrong-exit-code=${wrongCode}`);

const refused = spawn("/bin/sh", ["-c", "echo hi"], { cwd: "/not-there-at-all", cols: 80, rows: 24, env: process.env });
let said = "";
refused.onData((data) => { said += data; });
const refusedExit = await new Promise((resolve) => refused.onExit(resolve));
console.log(runtime, "refused start", JSON.stringify(refusedExit), JSON.stringify(said.trim()));

const tryIt = (name, fn) => {
  try { fn(); console.log(runtime, name, "ok"); }
  catch (error) { console.log(runtime, name, "threw", error.message); }
};
tryIt("write after exit", () => refused.write("x"));
tryIt("kill('SIGFOO') after exit", () => refused.kill("SIGFOO"));
console.log(runtime, "alive");
```

In 100 runs, no output was missing, none arrived after the exit, and each exit code was 3.
The start in a folder that is not there said `ENOENT: no such file or directory, posix_spawn '/bin/sh'` and exited 127.
After that exit, a write and a kill with `SIGFOO` did nothing, and the process lived on.

## Departures from the plan

- none.

## Left for later

- Bun's terminal on Windows, from 1.3.14, is open question 1 in [plan.md](plan.md).
