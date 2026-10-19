---
title: The site serves the scripts, and the docs lead with them
status: todo
depends: [task-01-install-sh-installs-ahpd.md, task-02-install-ps1-installs-ahpd.md]
layer: docs
refs:
  - "[code://docs/server/INSTALL.md](../../../../docs/server/INSTALL.md) - the install page, which starts at `npm i -g`"
  - "[code://docs/server/GET-STARTED.md](../../../../docs/server/GET-STARTED.md) - step 1 installs with npm"
  - https://github.com/softov/ahpio-site - the site; Astro serves its `public/` folder from the root, and `npm run deploy` builds it
---

## Objective

`https://ahpio.com/install.sh` and `https://ahpio.com/install.ps1` serve the scripts of this repository, and the site holds no copy that is out of date.
INSTALL.md and GET-STARTED.md show the one line first and keep `npm i -g` as the way by hand.

## Files

- `CREATE: ../ahpio-site/scripts/install-scripts.mjs` - a step that writes `public/install.sh` and `public/install.ps1` from this repository before the build.
- `UPDATE: ../ahpio-site/package.json` - a `prebuild` script that runs it.
- `UPDATE: ../ahpio-site/.gitignore` - ignore the two copied files, so no copy is committed.
- `UPDATE: docs/server/INSTALL.md` - the one line for each system first, with the script URL, then `npm i -g` under "By hand".
- `UPDATE: docs/server/GET-STARTED.md` - step 1 shows the one line, and says that it runs step 2 on a terminal.

## Steps

1. Write `install-scripts.mjs` to read the two scripts from the newest `v*` tag of `softov/ahpd` on GitHub.
2. Stop the build with an error when the step cannot read a script.
3. Add the `prebuild` script and the two `.gitignore` lines in the site.
4. Put the one line for bash and for PowerShell at the top of INSTALL.md, in a code group.
5. Link the script URLs next to the one line, so a person can read the script first.
6. Name the flags and their environment twins in INSTALL.md.
7. Keep `npm i -g @ahpd/server --allow-scripts=node-pty` under a "By hand" heading.
8. Change step 1 of GET-STARTED.md to the one line.
9. Say in GET-STARTED.md that the script runs step 2 on a terminal.
10. Set this task and the plan's Tasks table to `implemented`.

## Validation

- `npm run build` in the site writes `dist/install.sh` and `dist/install.ps1`, equal to the files in this repository.
- `npm run build` stops with an error when the step cannot read a script.
- `git status` in the site shows no `public/install.*` file to commit.
- `pnpm -s docs:build` passes, and the prose lint prints nothing new for the two pages.
- By hand, after a deploy: `curl -fsSL https://ahpio.com/install.sh | head -1` prints the shebang.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** the site is its own repository with its own commits and its own deploy, and Softov deploys it. Its pages are in three languages, so a line added to a page needs all three.
