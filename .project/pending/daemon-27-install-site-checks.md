---
title: Check the ahpd install scripts on the site
plans:
  - plans/daemon/27-ahpd-installs-with-one-line/plan.md
---

# Check the ahpd install scripts on the site

Task 03 of daemon/27 makes the ahpio-site build write `public/ahpd/install.sh` and `public/ahpd/install.ps1` from the newest `v*` tag of `softov/ahpd`. It also makes the docs lead with the one line. The site build could not run where task 03 was built. The newest tag, `v0.12.0` (2026-10-15), predates `scripts/install/`, and the shell of that session was confined to the ahpd worktree. The error path was checked there: with `v0.12.0`, the step exited 1 and named `https://raw.githubusercontent.com/softov/ahpd/v0.12.0/scripts/install/install.sh` and its 404.

## Set up

1. Make sure a `v*` tag exists that contains `scripts/install/install.sh` and `scripts/install/install.ps1`. `v0.12.0` does not.
2. Work in `/github/ahpio-site.worktrees/ahpd-27-install-scripts`, on branch `ahpd/27-install-scripts`. `npm ci` ran there on 2026-10-19 with the site's `package-lock.json`; run it again only in a fresh worktree.

## The build writes both scripts

1. Run `npm run build`.
2. Check that the build prints the tag it read, such as `ahpd install scripts: v0.13.0 from softov/ahpd`.
3. Check that `dist/ahpd/install.sh` is equal to `scripts/install/install.sh` at that tag, with `cmp`.
4. Check that `dist/ahpd/install.ps1` is equal to `scripts/install/install.ps1` at that tag, with `cmp`.

## The site commits no copy

1. Run `git status` in the site worktree.
2. Check that neither `public/ahpd/install.sh` nor `public/ahpd/install.ps1` is listed, because `.gitignore` covers both.

## After the deploy

1. Run `curl -fsSL https://ahpio.com/ahpd/install.sh | head -1`, and check that it prints `#!/usr/bin/env bash`.
2. Run `curl -fsSL https://ahpio.com/ahpd/install.ps1 | head -1`, and check that it prints the script's first line, `# Install ahpd on Windows with one line:`.
3. Check that both URLs answer 200.

## The pages show the one line

1. Open `https://ahpio.com/`, `https://ahpio.com/es/` and `https://ahpio.com/pt/`, and check that get-started step 1 shows `curl -fsSL https://ahpio.com/ahpd/install.sh | bash` and names the PowerShell line.
2. Open the docs at `docs/server/INSTALL.md` and `docs/server/GET-STARTED.md`, and check that the one line comes before the way by hand.

## Reply

Write "pass" for each section, or what you saw.
