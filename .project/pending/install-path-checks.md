---
title: Check that an installed ahpd is found outside bash
plans:
  - plans/daemon/20261031-0555-ahpd-is-found-outside-bash/plan.md
---

# Check that an installed ahpd is found outside bash

The plan `daemon/20261031-0555-ahpd-is-found-outside-bash` is implemented, and its tests pass. These checks need a Debian 13 desktop with GNOME and a user who cannot write `/usr/local`. Use a test user, so the checks do not change your own `~/.bashrc` and `~/.profile`.

## Steps

1. As the test user, run `bash scripts/install/install.sh --no-onboard` from the merged tree. Expect the install in `~/.npm-global`, and one marked PATH line in `~/.bashrc` and in `~/.profile`.
2. Log out and log in again. Open ahp-desk. Expect it to find `ahpd` and not to offer a second install.
3. Remove the marked lines from `~/.profile` only, and run the script again. Expect the update to write the line into `~/.profile` again.
4. Run `bash scripts/install/install.sh --uninstall`. Expect no `@ahpd/server` under `~/.npm-global/lib/node_modules`, and no marked line in either file.
5. Install a plugin from a daemon that runs under an nvm Node. Expect `ps` to show that Node with its own `npm-cli.js`, not `/usr/bin/npm`.
