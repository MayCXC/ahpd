---
title: Claude's Bash commands use it
status: done
depends: [task-02-the-daemon-reads-shellenv.md]
layer: "packages/agent-claude"
refs:
  - "[code://packages/agent-claude/src/session/config.ts#L142-L165](../../../../packages/agent-claude/src/session/config.ts#L142-L165) - the init script and `sourceFirst`"
  - "[code://packages/agent-claude/src/claude.ts#L616](../../../../packages/agent-claude/src/claude.ts#L616) - where `Start` fields go to the session options"
---

## Objective

Each Bash command that Claude runs starts with the operator's `shellEnv`: an `export` for each string and an `unset` for each `null`.
The session's `shellInitScripts` come after, so a client's script can change what the operator set.

## Files

- `UPDATE: packages/agent-claude/src/claude.ts:616` - pass `shellEnv` from `Start` to the session options.
- `UPDATE: packages/agent-claude/src/session/context.ts:38` - `shellEnv` in the session options.
- `UPDATE: packages/agent-claude/src/session/config.ts:142-165` - `quoted`, `shellEnvLines` and the lines before the init script in `sourceFirst`.
- `UPDATE: packages/agent-claude/test/agent-claude-options.test.ts` - the cases below.

## Steps

1. Pass `shellEnv` from `Start` to the session options.
2. Write the lines once, when the session starts: `export NAME=<value>` for a string and `unset NAME` for `null`.
3. Quote each value for a POSIX shell, as `terminals.ts` quotes a word.
4. Leave out a name that is not a shell name.
5. Run `sourceFirst` when there are lines or an init script, and not only when there is an init script.
6. Put the lines first, then the init script, then the command.

## Validation

- A session with `shellEnv` sends a Bash command that starts with the `export` line.
- A `null` gives an `unset` line.
- The line quotes a value with a quote in it.
- A session with no `shellEnv` and no init script sends the command as it is.
- `pnpm exec vitest run packages/agent-claude` passes.

## Resume

Implemented on 2026-10-11. `pnpm -s typecheck` and `pnpm -s boundary` are clean, and `pnpm exec vitest run packages/agent-claude` passes: 27 files, 271 tests.

Files this task changed:

- `UPDATE: packages/agent-claude/src/claude.ts` - the three lines after `clientToolTimeoutMs`, and nothing else in the file.
- `UPDATE: packages/agent-claude/src/session/context.ts` - `ShellEnv` in the `@ahpd/sdk` type import, and `shellEnv` on `ClaudeSessionOptions` after `clientToolTimeoutMs`, and nothing else in the file.
- `UPDATE: packages/agent-claude/src/session/config.ts` - `quoted` and `shellEnvLines` beside `sourcing`, the `environment` lines built once in `createConfig`, and the rewritten `sourceFirst`.
- `UPDATE: packages/agent-claude/test/agent-claude-options.test.ts` - `bashHook`, `commandedWith` and the five cases: the four under Validation, and one for the order against a session's own init script, which is step 6.

Notes for review:

- `quoted` is a local copy of the rule `packages/sdk/src/machines/terminals.ts` quotes a word by, rather than an export from the sdk, so this task's diff stays inside `packages/agent-claude` and each task commits on its own.
- `isShellName` is imported from `@ahpd/sdk`, which is what task 01 added it for.
- `sourceFirst` no longer returns early on `!sourced`: it now fires on every Bash call and returns `{}` when there is neither a line nor a script to put in front, so a session with no `shellEnv` sends its command unchanged.
- The comment on `hooks.PreToolUse` in `packages/agent-claude/src/session/query.ts` still says the hook runs "while a client has a script in force", which is now half of it. `query.ts` belongs to the parallel claude/22 build, so it is left for that build or a later one rather than touched here.
- The suite rewrites `packages/sdk/test/fixtures/wire.jsonl` (the endpoint line and the `ahpd.` `_meta` lines). A `git checkout` of it is denied in this session, so Softov runs `git checkout -- packages/sdk/test/fixtures/wire.jsonl` before committing.
