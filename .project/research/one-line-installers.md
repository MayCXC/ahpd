---
title: How one-line installers work
date: 2026-10-15
refs:
  - https://claude.ai/install.sh - Claude Code, redirects to downloads.claude.ai/claude-code-releases/bootstrap.sh (260 lines)
  - https://claude.ai/install.ps1 - Claude Code on PowerShell (110 lines)
  - https://openclaw.ai/install.sh - OpenClaw (4572 lines)
  - https://openclaw.ai/install.ps1 - OpenClaw on PowerShell (2488 lines)
  - https://docs.openclaw.ai/install/installer.md - OpenClaw's installer internals, every flag and variable
  - https://bun.sh/install - Bun
  - https://deno.land/x/install@v0.3.3/install.sh - Deno
---

Read on 2026-10-15 for [daemon/27](../plans/daemon/27-ahpd-installs-with-one-line/plan.md). No script was run.

## Two shapes

| | Claude Code | OpenClaw |
| --- | --- | --- |
| What it installs | A native binary | An npm package, `npm install -g` |
| Runtime | None | Node 24.16+ or 26.1+, or Bun with `--runtime bun` |
| Script size | 260 lines | 4572 lines |
| Checksum | SHA256 from a manifest on the same host | npm integrity; SHA256 for gum and Bun; none for portable Node and MinGit on Windows |
| PATH | The binary's `claude install` does it | The script edits rc files, or the user PATH on Windows |
| Onboarding | None | `openclaw onboard` on a TTY, skipped with `--no-onboard` |
| sudo | Refused unless `CLAUDE_INSTALL_ALLOW_SUDO=1` | Only for system packages |
| Uninstall | None | A docs page, not the script |

## Claude Code

1. It reads one optional argument: `stable`, `latest` or a version.
2. It refuses `sudo` from a user shell.
3. It finds the platform with `uname`, with Rosetta and musl cases.
4. It downloads `/latest`, then `<version>/manifest.json`, then the binary.
5. It checks the SHA256 that the manifest names.
6. It runs `<binary> install <target>`, which owns PATH and upgrade, and deletes the download.

## OpenClaw

1. It finds the OS, a checkout, and an earlier install (`type -P openclaw`).
2. It finds a Node that is new enough on PATH, in nvm, or in Homebrew. Else it installs Node with brew, NodeSource, winget, or into `~/.openclaw/tools/node`.
3. It sets the npm prefix to `~/.npm-global` when the global prefix is not writable, so npm needs no sudo.
4. It runs `npm install -g --no-fund --no-audit --allow-scripts=openclaw <spec> </dev/null`. It adds `--allow-scripts` only on npm 11.16 or later.
5. It adds the bin folder to PATH in the rc file of `$SHELL`, through a temporary file and `mv`, with no duplicate line.
6. On an upgrade it runs `doctor --fix --non-interactive` and restarts a running gateway.
7. On a TTY it runs `openclaw onboard` with stdin from `/dev/tty`. Without a TTY it prints the command.

Every flag has an environment twin, because `irm <url> | iex` cannot pass parameters. A flag passes as `curl … | bash -s -- --no-onboard`, or `& ([scriptblock]::Create((irm <url>))) -NoOnboard` on PowerShell. Under `iex` the PowerShell script uses `throw`, not `exit`, so the person's window stays open. `OPENCLAW_INSTALL_SH_NO_RUN=1` lets a test source the script without a run.

## Bun and Deno

Both install a binary into `~/.bun/bin` or `~/.deno/bin`, with no checksum. Bun appends a PATH line to the first rc file that it can write, with no duplicate check. Deno delegates the PATH change to a Deno program and asks first, unless `-y` is given or `CI` is set.
