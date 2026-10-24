---
title: The install script updates the ahpd it finds
domain: daemon
status: built
priority: high
created: 2026-10-20
revalidated: 2026-10-20
refs:
  - "[code://scripts/install/install.sh#L376-L392](../../../../scripts/install/install.sh#L376-L392) - `resolve_prefix`, which moves npm to `~/.npm-global` when the prefix is not writable"
  - "[code://scripts/install/install.sh#L438-L470](../../../../scripts/install/install.sh#L438-L470) - `install_package`, which carries on after a failed npm install when an ahpd exists"
  - "[code://scripts/install/install.sh#L555-L562](../../../../scripts/install/install.sh#L555-L562) - `resolve_ahpd`, which prefers the new prefix over the PATH"
  - "[code://scripts/install/install.sh#L596-L643](../../../../scripts/install/install.sh#L596-L643) - `do_install`, which never reads a version"
  - "[code://scripts/install/install.sh#L204-L224](../../../../scripts/install/install.sh#L204-L224) - `interactive` and `ask_yes`, the question helpers to reuse"
  - "[code://scripts/install/install.ps1#L268-L280](../../../../scripts/install/install.ps1#L268-L280) - `Resolve-Ahpd`, the same lookup on Windows"
  - "[code://scripts/install/install.ps1#L287-L325](../../../../scripts/install/install.ps1#L287-L325) - `Install-Package`, which carries on after a failed npm install too"
  - "[code://scripts/install/install.ps1#L424-L450](../../../../scripts/install/install.ps1#L424-L450) - the upgrade path on Windows"
  - "[code://scripts/install/test/install-sh.test.ts#L86-L107](../../../../scripts/install/test/install-sh.test.ts#L86-L107) - `writeAhpd` and `makeBox`, the fakes a new case starts from"
  - "[code://scripts/install/test/install-ps1.test.ts](../../../../scripts/install/test/install-ps1.test.ts) - the Windows cases"
  - "[code://docs/server/INSTALL.md](../../../../docs/server/INSTALL.md) - the install page"
---

## Goal

Softov had ahpd 0.12 and ran `curl -fsSL https://ahpio.com/ahpd/install.sh | bash`.
The script ran to its end, and `ahpd --version` still printed 0.12.
An earlier run had found `/usr/local` not writable and had run `npm config set prefix ~/.npm-global`.
That setting stayed in `~/.npmrc`, so this run updated a second ahpd in `~/.npm-global` to 0.13.0.
The open shell had not read the PATH line in `~/.bashrc`, so `ahpd` was still the 0.12.0 in `/usr/local/bin`.
After this plan, the script finds an installed ahpd, says its version and folder, and asks before it updates it.
It updates ahpd in the folder ahpd is in, and it fails when `ahpd` on the PATH does not print the new version.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `npm view @ahpd/server dist-tags` - `latest` is 0.13.0, so the registry was not the cause.
- `rg "carrying on" scripts/install` - both scripts ignore a failed npm install when an ahpd exists.
- Softov's machine, 2026-10-20: `npm prefix -g` is `/home/softov/.npm-global` from `~/.npmrc`, `~/.npm-global/bin/ahpd` prints 0.13.0, and `which -a ahpd` finds only `/usr/local/bin/ahpd`.

### Runtime path

```
curl | bash -> do_install -> resolve_prefix (can move to ~/.npm-global) -> install_package (can fail quietly)
  -> write_path (a new shell only) -> plugin update all and configure on whichever ahpd resolve_ahpd finds
```

### Gaps

- The script does not say that an ahpd is installed, or which version it is.
- The script does not ask before it changes an installed ahpd.
- A prefix that is not writable gives a second ahpd in `~/.npm-global`, and the old one stays first on the PATH of the open shell.
- `npm config set prefix` changes the prefix of every later npm install, and every later run of the script.
- A failed npm install continues when an older ahpd exists.
- The script does not compare the version it installed with the version `ahpd` prints.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Find the installed ahpd and ask before an update | Softov, 2026-10-20: "it must detect installation and update or stop the process. I prefer to detect and ask user to continue and update." | 01, 02 |
| Update in the folder of the installed ahpd, and stop when that folder is not writable | (defaulted: a second copy in another folder is the cause of the 0.12 that stayed) | 01, 02 |
| Stop when ahpd is already at the target version | (defaulted: nothing to update) | 01, 02 |
| Without a terminal, stop unless `--yes` is given | (defaulted: the CI install jobs and a container have no terminal) | 01, 02 |
| A failed npm install stops the script | (defaulted: carrying on hid the failure) | 01, 02 |
| The script does not change the npm configuration | (defaulted: the `prefix` it wrote to `~/.npmrc` caused the second ahpd) | 01 |

## Proposed architecture

- **Data flow** - `ahpd --version` of the ahpd on the PATH, and `npm view <package> version` or `--version`, give the two versions before anything is installed. The folder of the installed ahpd gives the npm prefix.
- **Source-of-truth files** - [`code://scripts/install/install.sh`](../../../../scripts/install/install.sh), [`code://scripts/install/install.ps1`](../../../../scripts/install/install.ps1)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - install.sh updates the ahpd it finds](task-01-install-sh-updates-the-ahpd-it-finds.md) | done | - |
| [02 - install.ps1 updates the ahpd it finds](task-02-install-ps1-updates-the-ahpd-it-finds.md) | done | 01 |

## Risks and tradeoffs

- From 0.13, `ahpd update` (daemon 35) also updates in place. The script does not call it, because 0.12 and older do not have it, and one path is simpler to test.
- An ahpd from Bun or from a folder that npm did not write has no npm prefix to read. The script then stops and names the folder.

## Resume state

- **Done so far:** [task-01](task-01-install-sh-updates-the-ahpd-it-finds.md) and [task-02](task-02-install-ps1-updates-the-ahpd-it-finds.md) are implemented. Both scripts find the installed ahpd and update it in its own npm prefix after asking. They stop when npm fails, or when the ahpd on the PATH still prints the old version. `install-sh.test.ts` passed 27 of 27, and `install-ps1.test.ts` skipped all 24 cases here because this box has no `pwsh`. From the repository root, `pnpm -s build`, `pnpm -s typecheck` and `pnpm -s boundary` passed, and the full suite passed 6471 tests with 29 skipped (387 files passed, 1 skipped).
- **Next action:** none. The plan is built.
- **Open questions:** none.
- **Watch out for:** the site serves the scripts from the newest `v*` tag. The fix reaches `ahpio.com/ahpd` only after a release and a site deploy.
