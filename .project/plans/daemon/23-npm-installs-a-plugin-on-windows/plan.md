---
title: npm installs a plugin on Windows
domain: daemon
status: planned
priority: high
created: 2026-10-13
revalidated: 2026-10-13
decisions:
  - decisions/windows-runs-npm-as-node-and-npm-cli.md
refs:
  - "[code://packages/server/src/install.ts#L55-L72](../../../../packages/server/src/install.ts#L55-L72) - `run`, the one runner of every npm call"
  - "[code://packages/server/src/install.ts#L551](../../../../packages/server/src/install.ts#L551) - the install of `ahpd configure`"
  - "[code://packages/server/src/install.ts#L672-L680](../../../../packages/server/src/install.ts#L672-L680) - the installs of `ahpd plugin install`"
  - "[code://packages/server/src/install.ts#L737](../../../../packages/server/src/install.ts#L737) - the uninstall of `ahpd plugin remove`"
  - "[code://packages/server/test/plugin-install.test.ts](../../../../packages/server/test/plugin-install.test.ts) - the install cases, with a runner in place of `run`"
---

## Goal

`ahpd configure` and `ahpd plugin` install and remove plugins on Windows as they do on Linux and macOS.
Today every npm call on Windows fails with `spawn npm ENOENT`, because npm there is `npm.cmd`.
Softov found it on 2026-10-13, when `ahpd configure` could not install `@ahpd/agent-claude`, `@ahpd/agent-cofold` and `@ahpd/agent-pi`.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "'npm'" packages/*/src` - the four calls in `install.ts`, all through `run`.
- `rg -n "spawn\(|execFile\(" packages/*/src` - `git`, `gh` and `ssh` are `.exe` files on Windows. `pnpm` in `computer/src/parts.ts` is a build step, not a daemon path.

### Runtime path

```
ahpd configure | ahpd plugin install | remove -> options.run('npm', argv) -> run -> spawn('npm', argv) -> ENOENT on win32
```

### Gaps

- `run` has no Windows path.

## Decisions locked in

| Decision | Source |
| --- | --- |
| [npm runs as `node` with `npm-cli.js` on Windows](../../../decisions/windows-runs-npm-as-node-and-npm-cli.md) | Softov, 2026-10-13 |

## Proposed architecture

- **Data flow** - `run` asks a pure function how to start a program, then spawns what it answers.
- **Layer responsibilities** - server: `install.ts` only.
- **Source-of-truth files** - [`code://packages/server/src/install.ts`](../../../../packages/server/src/install.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - npm starts through node on Windows](task-01-npm-starts-through-node-on-windows.md) | todo | - |

## Risks and tradeoffs

- A version manager can put npm in another folder. The shell path then runs, with quoted arguments.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-npm-starts-through-node-on-windows.md](task-01-npm-starts-through-node-on-windows.md).
- **Open questions:** none.
- **Watch out for:** the build runs on Linux, so the Windows path is tested through the pure function only.

## Final verification checklist

- [ ] On Windows, `ahpd configure` installs the three plugins.
- [ ] On Windows, `ahpd plugin remove` removes a plugin.
- [ ] `plans/index.md` updated.
