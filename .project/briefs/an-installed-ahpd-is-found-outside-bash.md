---
title: An installed ahpd is found outside bash
created: 2026-10-31
refs:
  - git://4d286d45 - the commit of ahpd the facts were checked at
  - "[code://scripts/install/install.sh#L481-L496](../../scripts/install/install.sh#L481-L496) - `resolve_prefix`, which falls back to `~/.npm-global` when the global prefix is not writable"
  - "[code://scripts/install/install.sh#L584-L592](../../scripts/install/install.sh#L584-L592) - `rc_path`, one rc file picked from `SHELL`"
  - "[code://scripts/install/install.sh#L602-L621](../../scripts/install/install.sh#L602-L621) - `write_path`, which writes the PATH line into that one file"
  - "[code://scripts/install/install.sh#L623-L643](../../scripts/install/install.sh#L623-L643) - `remove_path`, which removes it from the file `SHELL` names at uninstall"
  - "[code://scripts/install/install.sh#L787-L847](../../scripts/install/install.sh#L787-L847) - `do_uninstall`, which runs `npm uninstall -g` with no `--prefix`"
  - "[code://packages/server/src/install.ts#L99-L115](../../packages/server/src/install.ts#L99-L115) - `launch`, which runs `npm` by name on Linux and macOS"
  - "[code://scripts/install/test/install-sh.test.ts#L566-L655](../../scripts/install/test/install-sh.test.ts#L566-L655) - the uninstall cases, which expect `npm uninstall -g @ahpd/server`"
  - file:///github/ahp-desk/src-tauri/src/local_ahpd.rs - `find`, at line 416: the set path, then the desk's own install, then `PATH`
  - file:///etc/skel/.bashrc - Debian 13: returns at once when the shell is not interactive
  - file:///etc/skel/.profile - Debian 13: adds `~/.local/bin` to `PATH` when it exists, and sources `~/.bashrc`
---

# An installed ahpd is found outside bash

Softov installed ahpd 0.13.0 with the install script on a Debian 13 machine where `/usr/local` is not writable, and the daemon ran.
ahp-desk then said "Not on this computer" and offered to install a second ahpd on the same port.
He wants an ahpd that the script installed to be found by every program in the session: desktop apps, `ssh host 'ahpd status'`, cron and systemd user units.
He also wants the daemon to run the npm of the Node it runs under on every platform, not the first `npm` on `PATH`.

## What others do

- Debian's and Ubuntu's `~/.profile` adds `~/.local/bin` to `PATH` at login when the folder exists, so a link there reaches every program of the session.
- An interactive bash reads `~/.bashrc`, and Debian's `~/.bashrc` returns at once in any other shell.
  A login shell reads `~/.profile`, which sources `~/.bashrc`, and that source meets the same return.

## What ahpd has today

- When the global npm prefix is not writable, the script installs into `~/.npm-global` with `--prefix` ([`code://scripts/install/install.sh`](../../scripts/install/install.sh#L481-L496)).
- The script writes one PATH line, into one file that `SHELL` picks.
  That file is `~/.bashrc` for bash, `~/.zshrc` for zsh, fish's `config.fish`, and `~/.profile` for any other shell ([`code://scripts/install/install.sh`](../../scripts/install/install.sh#L584-L621)).
- The script writes no line when the bin folder is already on the `PATH` it runs with.
- So for bash, only an interactive bash finds `ahpd`.
  ahp-desk looks for `ahpd` on `PATH` after its set path and its own install, and does not find it.
- `--uninstall` removes the line from the file that `SHELL` names at that time ([`code://scripts/install/install.sh`](../../scripts/install/install.sh#L623-L643)).
  A line written under another shell stays.
- `--uninstall` runs `npm uninstall -g @ahpd/server` with no `--prefix` ([`code://scripts/install/install.sh`](../../scripts/install/install.sh#L787-L847)).
  For an install under `~/.npm-global`, that asks npm's own prefix, which is not the one the package is in.
  The script writes no `prefix` into `~/.npmrc`, so nothing else points npm there.
  The uninstall tests expect this command as it is ([`code://scripts/install/test/install-sh.test.ts`](../../scripts/install/test/install-sh.test.ts#L566-L655)).
- On Linux and macOS, the daemon runs `npm` by name from `PATH` ([`code://packages/server/src/install.ts`](../../packages/server/src/install.ts#L99-L115)).
  Only on Windows does it look for `npm-cli.js` beside `process.execPath`, after `npm_execpath`.
- Every npm call of the daemon goes through `launch`: plugin installs and removals in `install.ts`, `plugins.ts:265`, `pluginschannel.ts:590`, and the self update in `selfupdate.ts`.
  So one change to `launch` covers all of them.

## Who writes

- No open branch, on origin or on the fork, changes `scripts/install/`, `install.ts` or `selfupdate.ts`.
- The ahpio-site build copies `install.sh` and `install.ps1` from the newest `v*` tag, so a change reaches people at the next release.

## The change

- The script also links `~/.npm-global/bin/ahpd` into `~/.local/bin/ahpd`, or writes the PATH line into `~/.profile` as well as the shell's rc file.
- `--uninstall` removes what the install added: the link, and the PATH line from each file it is in.
- `--uninstall` removes the package from the prefix it was installed into.
- `launch` runs `npm-cli.js` from beside `process.execPath` on every platform, which is `../lib/node_modules/npm/bin/npm-cli.js` on Unix.
  It runs `npm` from `PATH` only when that file is not there.

## Open points

- The link into `~/.local/bin`, or the line in `~/.profile`.
  The link needs a `~/.profile` that adds `~/.local/bin`, which Debian and Ubuntu have.
  When `~/.local/bin` did not exist at login, the link takes effect only at the next login.
- macOS: a desktop app started from the Dock reads no rc file. Not checked here.
- The script's `remove_path` and `do_uninstall` show the uninstall gap, but nothing ran it on a machine yet.
