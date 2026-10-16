---
title: npm says what it installs before it runs
domain: daemon
status: active
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
refs:
  - "[code://packages/server/src/install.ts#L589-L606](../../../../packages/server/src/install.ts#L589-L606) - `installPlugins`: one npm call, and the only line comes after it"
  - "[code://packages/server/src/install.ts#L716-L735](../../../../packages/server/src/install.ts#L716-L735) - `plugin update`: one npm call, or one call for each package with `--force`"
  - "[code://packages/server/src/install.ts#L788](../../../../packages/server/src/install.ts#L788) - `plugin uninstall`: one npm call"
  - "[code://packages/server/test/plugin-install.test.ts#L107](../../../../packages/server/test/plugin-install.test.ts#L107) - `say` collects the lines a test reads"
---

## Goal

`ahpd configure` and the plugin commands print a line before npm runs.
The line names the packages.
Today the terminal shows nothing while npm works, and an install of three agents took a minute on Windows with no output.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `git grep -n "options.run('npm'" packages/server/src/install.ts` - four npm calls, at L602, L723, L731 and L788.
- `git grep -n "say(" packages/server/src/install.ts` - no line is said before an npm call.

### Gaps

- No line before an npm call in install, update or uninstall.

## Answers

| What | Source | Task |
| --- | --- | --- |
| One line before each npm call, and npm runs once as it does now | Softov, 2026-10-16, asked how configure and the plugin commands show progress, chose "One line before npm" | 01 |
| The lines are `Installing <names> with npm.`, `Updating <names> with npm.` and `Removing <names> with npm.` | (defaulted: verb and object, like the `Installed` line after it) | 01 |
| `plugin update --force` says one line for each package, before its own npm call | (defaulted: each package is its own npm call there) | 01 |
| The `node-domexception` warning stays: it comes from `@ahpd/agent-pi` through `@earendil-works/pi-ai`, `@google/genai` and `node-fetch@3` | Softov, 2026-10-16, shown the cause | - |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A line names the packages before npm runs](task-01-a-line-names-packages-before-npm.md) | implemented | - |

## Risks and tradeoffs

- The served form says the same lines. A client that reads the lines gets one more line, and no line changes.

## Resume state

- **Done so far:** planned 2026-10-16; the one task implemented 2026-10-16, not reviewed and not set to done.
- **Next action:** the review of [task-01-a-line-names-packages-before-npm.md](task-01-a-line-names-packages-before-npm.md).
- **Open questions:** none.
- **Watch out for:** a test that checks the full list of said lines needs the new line.

## Final verification checklist

- [ ] A test: install, update, update with `--force` and uninstall each say their line before npm runs.
- [ ] The gates pass: build, typecheck, boundary, schema and vitest.
- [x] By hand: `ahpd configure` on Windows prints the line before npm.
- [ ] `plans/index.md` updated.
