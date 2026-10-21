---
title: install.sh updates the ahpd it finds
status: todo
depends: []
layer: scripts
refs:
  - "[code://scripts/install/install.sh#L376-L392](../../../../scripts/install/install.sh#L376-L392) - `resolve_prefix`"
  - "[code://scripts/install/install.sh#L438-L470](../../../../scripts/install/install.sh#L438-L470) - `install_package`"
  - "[code://scripts/install/install.sh#L596-L643](../../../../scripts/install/install.sh#L596-L643) - `do_install`"
  - "[code://scripts/install/test/install-sh.test.ts#L86-L107](../../../../scripts/install/test/install-sh.test.ts#L86-L107) - the fakes to reuse"
---

## Objective

When an ahpd is on the PATH, `install.sh` says its version and folder and asks before it updates it.
The update goes into the npm prefix that holds that ahpd.
After the install, the script fails when `ahpd --version` does not print the target version.

## Files

- `UPDATE: scripts/install/install.sh` - find the installed ahpd and its prefix, ask, install there, check the version, add `--yes` and `AHPD_YES`.
- `UPDATE: scripts/install/test/install-sh.test.ts` - cases for each step below.
- `UPDATE: docs/server/INSTALL.md` - say what the script does when ahpd is installed, and name `--yes`.

## Steps

1. Before `resolve_prefix`, find `ahpd` on the PATH and read its version with `ahpd --version`.
2. Get the target version from `--version`, or else from `npm view <package> version`.
3. When the two versions are the same, print that ahpd is already at that version and stop with exit 0.
4. Find the npm prefix from the real path of the installed ahpd, the part before `/lib/node_modules/`.
5. When that prefix is not writable, or is not an npm prefix, stop with exit 1 and name the folder.
6. Print `ahpd <old> is installed at <path>.` and ask `Update it to <new>?` with `ask_yes`.
7. Without a terminal, continue only with `--yes` or `AHPD_YES=1`, and else stop with exit 1.
8. Install with `npm install -g --prefix <prefix>` and stop with exit 1 when npm fails.
9. Remove the `carrying on` branch from `install_package`.
10. Remove `npm config set prefix` from `resolve_prefix`, and give the home folder prefix to that install with `--prefix`.
11. After the install, run `ahpd --version` from the PATH.
12. When it prints another version, fail and name the path of that ahpd.
13. Keep the first install, with no ahpd on the PATH, as it is now.
14. Add a test for each of steps 3, 5, 6, 7, 8, 10 and 12, with the fakes in `install-sh.test.ts`.
15. Run the install tests, and set this task and the plan row to `implemented`.

## Validation

- `pnpm vitest run scripts/install/test/install-sh.test.ts` passes from the repository root.
- A new case for a refused answer fails when you remove the question from the script.
- `bash scripts/install/install.sh --dry-run` with a fake ahpd prints the question and the prefix.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:**
  - The CI job `install (node:22-bookworm-slim, installs)` has no ahpd before it runs, so it stays on the first install path.
  - The question reads `/dev/tty`, because the script itself arrives on stdin.
