---
title: Review the owner's command check
plans:
  - plans/host/100-p2-a-session-gets-its-owners-command-check/plan.md
---

# Review the owner's command check

I reviewed host/100 p2 on main at `e7b172de` on 2026-10-20. The code does what the plan says, with one security problem.

## Results

1. **Pass.** `getAutoApproval` in `spawn.ts` reads the connection that started the session, and only when that connection's person owns the session. A turn from another window does not widen the rules.
2. **Pass.** A start that no connection asked for, such as an automation, has no rules, so every command asks.
3. **Pass.** `terminalAutoApproveEnabled: false` makes every command ask, and only `approved` returns `not-needed`.
4. **Pass.** The three keys are in `PER_CONNECTION`, so a member pushes them with no grant. `root-config.test.ts` checks that they are kept per connection.
5. **Pass.** `terminalAutoApproveDefaults` takes `vscode` or `none`, defaults to `vscode`, and refuses any other value at start. `config-check.test.ts` covers the three cases.
6. **Pass.** A malformed rule value is skipped: only `true`, `false` and an object with a boolean `approve` count.
7. **Fail.** A member can push a rule key that is a slow regular expression, and the daemon stops while it matches. Task 03 of the plan carries the fix.
8. **Note.** Task 02 named `config.ts:247-258` and `run.ts:732-741`. The key is parsed in `commands/options.ts:572` and passed at `run.ts:845`. The plan refs are out of date, not the code.

## Results by hand

Softov ran the checks with a Claude session from VS Code on 2026-10-20.

- Check 1 failed. `pnpm ls --depth 0` asked under the `vscode` defaults. The session has no owner, so the check never applies. See [the problem](../problems/a-claude-session-from-vs-code-has-no-owner.md).
- Check 2 passed. `rm` on a scratch file asked.
- Check 3 asked, as written. It shows nothing while check 1 fails, because every command asks.
- Check 4 was not run.

My first steps named `ls`. Claude Code approves `ls` and other read-only commands itself, before ahpd is asked, so `ls` cannot show the check. Auto mode also skips ahpd. The steps below use a command that only the defaults approve.

## Check by hand

PR #41 fixes the owner problem, and it is on main at `43cb5c40`. Do these after you restart the daemon on that commit or later. Use a new Claude session in Ask Before Edits mode.

1. Connect VS Code to the daemon with no terminal rules pushed. Ask the agent to run `pnpm ls --depth 0`. It runs with no question.
2. Ask the agent to run `rm` on a scratch file. It asks.
3. Set `terminalAutoApproveDefaults` to `none` and restart the daemon. Ask for `pnpm ls --depth 0` again. It asks.
4. Open a second window as another person on the same session, and push `{"rm": true}` there. Ask for `rm` from that window. It still asks.

## Reply

- Write "pass" or what you saw for each check by hand.
