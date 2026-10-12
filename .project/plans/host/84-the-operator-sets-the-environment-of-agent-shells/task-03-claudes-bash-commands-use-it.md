---
title: Claude's Bash commands use it
status: todo
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
- `UPDATE: packages/agent-claude/src/session/config.ts:142-165` - put the lines before the init script in `sourceFirst`.
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
