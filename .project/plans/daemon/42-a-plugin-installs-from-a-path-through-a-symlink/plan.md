---
title: A plugin installs from a path through a symbolic link
domain: daemon
status: built
priority: medium
created: 2026-10-26
revalidated: 2026-10-26
refs:
  - "[code://packages/server/src/install.ts#L636-L680](../../../../packages/server/src/install.ts#L636-L680) - `namesInstalled`, which names a path by the `file:` spec npm wrote for it"
  - "[code://packages/server/src/install.ts#L630-L634](../../../../packages/server/src/install.ts#L630-L634) - `realOf`, the real path of a path"
  - "[code://packages/computer/src/gitdir.ts#L153-L157](../../../../packages/computer/src/gitdir.ts#L153-L157) - the same `realOf`, the pattern this plan copies"
  - "[code://packages/server/test/plugin-install.test.ts#L391-L426](../../../../packages/server/test/plugin-install.test.ts#L391-L426) - the two cases, with a link to the plugin root and with a link in the path"
  - "[code://tools/test-tmpdir.ts#L16-L22](../../../../tools/test-tmpdir.ts#L16-L22) - the run's temporary folder, which every case reads by its real path"
  - https://github.com/npm/cli/blob/v11.19.0/workspaces/arborist/lib/arborist/build-ideal-tree.js#L524-L565 - npm writes the `file:` spec of a path from the real path of the root, to the real path of a folder
  - https://github.com/npm/cli/blob/v11.19.0/workspaces/arborist/lib/arborist/load-actual.js#L115-L119 - npm loads the root with its real path
---

## Goal

`ahpd plugin install <path>` names the plugin when a symbolic link is on the way to the plugin root or in the path.
Without this plan, npm installs the plugin, and ahpd then refuses it with "npm wrote no dependency for it".
A configuration directory under a linked folder gets that refusal on every install from a path.
The refusal showed on 2026-10-26, on a machine where `~/.config` is a link to another folder.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "realpathSync" packages/*/src` - five packages read a real path in a `try`, and `packages/computer/src/gitdir.ts` names that helper `realOf`.
- npm 11.19.0, `build-ideal-tree.js` lines 524 to 565 - npm writes the spec of a path relative to `tree.target.path`. For a folder, it reads the real path first.
- npm 11.19.0, `load-actual.js` lines 115 to 119 - npm loads the root with its real path, so `tree.target.path` is the real path of the root.

### Runtime path

```
ahpd plugin install <path> -> installPlugins -> npm install --prefix <root> -- <path>
  -> npm writes "file:<from the real root to the real folder>" into <root>/package.json
  -> namesInstalled resolves the spec against <root> as given -> no match -> exit 2
```

### Gaps

- `namesInstalled` resolves the `file:` spec against the plugin root as given, and compares it with the path as given.
- npm writes the spec between real paths, so a link on either path makes the two differ.
- On a first install, npm also adds `@ahpd/sdk`, so the fallback for one added dependency does not name the path.
- No case in `plugin-install.test.ts` has a link on either path.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Resolve the spec against the real path of the plugin root, and compare the real paths of both ends | npm 11.19.0, https://github.com/npm/cli/blob/v11.19.0/workspaces/arborist/lib/arborist/build-ideal-tree.js#L524-L565 | 01 |
| Read a real path with `realOf`, as `computer` does | [code://packages/computer/src/gitdir.ts#L153-L157](../../../../packages/computer/src/gitdir.ts#L153-L157) | 01 |
| The fake npm writes the specs that npm 11.19.0 wrote in the runs by hand, `@ahpd/sdk` included | The runs by hand, 2026-10-26 | 01 |

## Proposed architecture

- **Data flow** - `namesInstalled` reads the real path of the plugin root once. It resolves each `file:` spec there, and compares the real path of the result with the real path of the source.
- **Layer responsibilities** - server: `install.ts`.
- **Source-of-truth files** - [`code://packages/server/src/install.ts`](../../../../packages/server/src/install.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A path and its spec are compared as real paths](task-01-a-path-and-its-spec-are-compared-as-real-paths.md) | done | - |

## Risks and tradeoffs

- `realOf` gives back a path that is not there. A spec for a folder that is gone then compares as before, and nothing throws.

## Resume state

- **Done so far:** planned and built 2026-10-26. See [implemented.md](implemented.md).
- **Next action:** none.
- **Checked by hand:** on Linux with npm 11.19.0 and the daemon from source. See [implemented.md](implemented.md).
- **Open questions:** none.
- **Watch out for:** a case for this needs `@ahpd/sdk` in `added`. Without it, the fallback for one added dependency names the path, and the case passes without the fix.

## Final verification checklist

- [x] The two cases fail without the fix, with "npm wrote no dependency", and pass with it.
- [x] With npm 11.19.0, `ahpd plugin install <path>` names the plugin through a linked configuration directory and through a linked path.
- [x] `plans/index.md` updated.
