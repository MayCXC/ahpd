---
title: The docs say who sees the account
status: done
depends: [task-02-the-host-publishes-each-agent-account.md, task-03-the-acp-backend-hears-the-codex-account.md]
layer: docs
refs:
  - "[code://docs/sdk/AGENT.md#L82-L100](../../../../docs/sdk/AGENT.md#L82-L100) - `probe()` and the other members of `Agent`"
  - "[code://docs/sdk/HOST.md#L44](../../../../docs/sdk/HOST.md#L44) - the `AgentInfo` table"
  - "[code://docs/sdk/AUTHENTICATION.md#L230-L235](../../../../docs/sdk/AUTHENTICATION.md#L230-L235) - what is readable before a sign-in"
---

## Objective

The docs say what the account holds, where a client reads it, and which grant it needs.

## Files

- `UPDATE: docs/sdk/AGENT.md:82-100` - a probe may return `account`.
- `UPDATE: docs/sdk/HOST.md:44` - where the account is published.
- `UPDATE: docs/sdk/AUTHENTICATION.md:230-235` - the account is not readable without the grant.
- `UPDATE: docs/server/REMOTE.md:80-92` - the `account:read` row.

## Steps

1. Add `account` to the table of `Agent` members in `AGENT.md`.
2. Name the place of the account in `HOST.md`.
3. Say in `AUTHENTICATION.md` who may read the account.
4. Add the `account:read` row to `REMOTE.md`.
5. Say that the host learns the Codex account when a Codex session starts.
6. Set this task and the plan row to `implemented`.

## Validation

- The docs match the behaviour of tasks 02 and 03.
- `pnpm -s docs:build` passes.

## Resume

Done, with step 4 carried out somewhere else - see below. The three docs the
task names, and what each now says:

- `docs/sdk/AGENT.md` - the `probe()` row of the `Agent` table names the account
  beside the models and the commands, and a paragraph under the `probe()`
  paragraph says what it is, that the host publishes it for the connections
  holding `account:read`, that leaving it out is a real answer rather than a
  gap, and that a backend which learns its sign-in later says so with
  `Start.onAccount`, which takes the place of what the probe answered.
- `docs/sdk/HOST.md` - the Root config section says one value lives in
  `config.values` and in no schema at all, names `vscode.codexAccount` and
  `ahpd.<provider>Account`, says the host writes it when a probe answers with an
  account or a running session reports one, that a client writing to the key is
  refused like any other key nobody declared, and that a connection without
  `account:read` is shown no account value in its state or in any change after
  it. The Grants table gained the row, which is step 4 in the place it fits.
- `docs/sdk/AUTHENTICATION.md` - a new `## Agent accounts` section, which is the
  heading `docs/sdk/USERS.md`'s row has linked to since task 02, saying what the
  account holds, where it is published, that the Claude probe answers at boot
  and an ACP server when a session opens - so a Codex account is known once a
  Codex session has run and not before - and which grant reads it. `What is
  readable before signing in` now counts the accounts as the third overlay, and
  names the decision.

**Deliberate deviation, step 4:** the task says to add the `account:read` row to
`docs/server/REMOTE.md:80-92`. That table is `Command | Needs`, one row per
`ahpd` verb, and the account is not a verb: it is a value of the root config,
and no command prints it - `ahpd config` prints the keys of the configuration
file, and the account is not one of those. A row naming no command would be a
row in the wrong table, so the row went to `HOST.md`'s Grants table, which is
`What | Grant | Where it is asked` and already carries the other root-state
read, `config:read` for the daemon's settings. `REMOTE.md` was not left silent
either: a sentence under that table says the account is not a command, names
`account:read`, and points at the row, so a reader who goes looking where the
task said finds the answer rather than nothing.

One more file than the task's list: `HOST.md` said "Ten subjects are the host's
own" and listed the ten. Task 02 added an eleventh subject and did not touch
this file, so the count and the list are corrected here.

Files this task changed, so the work can be committed on its own:

- `docs/sdk/AGENT.md`, `docs/sdk/HOST.md`, `docs/sdk/AUTHENTICATION.md`
- `docs/server/REMOTE.md` - the sentence under the command table
- `.project/plans/host/99-a-client-sees-the-agent-account/plan.md` and this file

Gates at this state: `pnpm -s docs:build` renders every page, and `pnpm -s
build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs`, `git
diff --quiet tools/` and `pnpm -s exec vitest run packages/agent-acp` (252
tests) pass. No test reads these four files, so none of this work can break
one; `users.test.ts` reads the `USERS.md` table, which task 02 changed.
