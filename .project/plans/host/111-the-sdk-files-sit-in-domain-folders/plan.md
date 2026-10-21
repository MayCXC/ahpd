---
title: The sdk files sit in domain folders
domain: host
status: active
priority: medium
created: 2026-10-20
revalidated: 2026-10-20
refs:
  - "[code://packages/sdk/src](../../../../packages/sdk/src) - 58 files at the top level, beside the folders `host/`, `repo/`, `tools/` and `types/`"
  - "[code://packages/sdk/src/repo](../../../../packages/sdk/src/repo) - a folder named for one domain, the pattern to copy"
  - "[code://packages/sdk/src/types](../../../../packages/sdk/src/types) - the port types, one file for each domain, which do not move"
  - "[code://packages/sdk/package.json](../../../../packages/sdk/package.json) - one export, `.`, so no import from outside the package names a file in `src/`"
  - "[code://scripts/boundary.mjs](../../../../scripts/boundary.mjs) - the dependency check, which reads the imports of `src/`"
---

## Goal

The top level of `packages/sdk/src` holds 58 files, and a reader cannot see which files make one domain.
After this plan, each file that belongs to a domain is in a folder named for that domain, as `host/`, `repo/` and `tools/` are now.
No file gets a new name, and the package exports do not change.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -o "sdk/src/[a-z]+\.(js|ts)" packages -g '!packages/sdk/**'` - tests in `agent-cofold`, `agent-pi`, `agent-claude`, `webhook`, `tasks` and `server` import 14 of the files by path.
- `rg -c "packages/sdk/src/<file>.ts" .project` - about 630 refs name a file that moves, 231 of them `users.ts`.
- `rg -l "sdk/src/" docs` - 8 docs, in `docs/sdk/` and `docs/plugins/PLUGINS.md`.

### Runtime path

```
no change: index.ts exports the same names, from the new paths
```

### Gaps

- The top level of `src/` has no domain folders for access, usage, resources, plugins, automations, sessions, machines and helpers.
- `00-host.md` names `src/git.ts`, `src/github.ts` and `src/worktrees.ts`, which are in `src/repo/` now.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Put the sdk files in domain folders | Softov, 2026-10-20: "I also want to organize sdk folder. put users, people, usage, policy and related on one folder. utils, files or resources" | 01 |
| Move every file in one change | Softov, 2026-10-20, to "How should I go ahead with the sdk folder layout?": "all at once" | 01 |
| Two folders, `access/` and `usage/` | Softov, 2026-10-20, same answer: "split access and usage" | 01 |
| The folder list in the task | (defaulted: each file goes where its first doc line says it belongs) | 01 |
| `types/` does not move | (defaulted: it is already one file for each domain) | 01 |

## Proposed architecture

- **Data flow** - no change. Only the paths of the files change.
- **Source-of-truth files** - [`code://packages/sdk/src/index.ts`](../../../../packages/sdk/src/index.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The files move to domain folders](task-01-the-files-move-to-domain-folders.md) | implemented | - |

## Risks and tradeoffs

- A branch that is open during the move must rebase across it. Build this plan when no other build is running.
- `git mv` keeps each file whole, so the line numbers in a ref stay correct after the path changes.

## Resume state

- **Done so far:** task 01 implemented. The 52 files moved to the eight domain folders, every import names the new path, and `.project` and `docs` were rewritten. `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` pass, and the two-worker suite passed 387 files and 6463 tests.
- **Next action:** review the move.
- **Open questions:** none.
- **Watch out for:** a ref to `packages/sdk/src/types/<name>.ts` must not change when `src/<name>.ts` moves.
