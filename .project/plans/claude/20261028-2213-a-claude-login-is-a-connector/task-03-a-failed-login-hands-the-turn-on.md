---
title: A failed login hands the turn on
status: done
depends: [task-02-a-records-logins-are-connector-ids.md]
layer: "agent-claude"
refs:
  - "[code://docs/server/PROXY.md#L125-L137](../../../../docs/server/PROXY.md#L125-L137) - the proxy's first entry in the file's order, with a connector the caller may use"
  - "[code://docs/server/PROXY.md#L157](../../../../docs/server/PROXY.md#L157) - `retry-after`, by which a client backs off"
  - "[code://docs/server/PROXY.md#L159-L163](../../../../docs/server/PROXY.md#L159-L163) - the failures the proxy hands to its next entry, until a byte has reached the caller"
  - "[code://packages/server/src/proxy/listener.ts#L719-L784](../../../../packages/server/src/proxy/listener.ts#L719-L784) - the proxy's loop: a key's refusal told, the next entry on no connection, a 429 or a 5xx"
  - "[code://packages/agent-claude/src/session/logins.ts#L57-L273](../../../../packages/agent-claude/src/session/logins.ts#L57-L273) - the merged rotation this task changes"
  - "[code://packages/agent-claude/src/session/query.ts#L150-L198](../../../../packages/agent-claude/src/session/query.ts#L150-L198) - where the CLI's environment is built"
  - "[code://packages/agent-claude/src/session/query.ts#L967-L983](../../../../packages/agent-claude/src/session/query.ts#L967-L983) - `refreshPreset`, where a turn's login is taken"
---

## Objective

A turn runs on the first ready login in the record's order, and a CLI on a login gets no credential the CLI prefers.
A turn whose request fails with no connection, a 429 or a 5xx goes to the next ready login.
Once the turn has shown something, the failure ends it.
A refused credential ends the turn and names the login.
A failure that names a retry time keeps the login out until then, and nothing else is remembered.

## Files

- `UPDATE: packages/agent-claude/src/logins.ts` - the logins in the record's order, the kinds of a failure by status, and the rests.
- `UPDATE: packages/agent-claude/src/session/logins.ts` - the turn's login, why none is ready, the failure, the move, and the words a turn ends with.
- `UPDATE: packages/agent-claude/src/session/query.ts:150-198` - a CLI on a login without the credentials the CLI takes first.
- `UPDATE: packages/agent-claude/src/session/query.ts:967-983` - `refreshPreset` refuses a turn with no ready login.
- `UPDATE: packages/agent-claude/src/session/query.ts` - the failed frame's `result` moves the turn or ends it with the failure's words.
- `UPDATE: packages/agent-claude/src/session/turns.ts` - `cancel` has no wait to end.
- `UPDATE: packages/agent-claude/src/session.ts` - `close` has no wait to end.
- `UPDATE: packages/agent-claude/src/session/context.ts` - the session's options hold no cooldowns.
- `UPDATE: packages/agent-claude/src/claude.ts` - the agent keeps no cooldowns.
- `UPDATE: packages/agent-claude/test/agent-claude-logins.test.ts` - the cases below.

## Steps

1. Order the logins in the record's order, and drop the rendezvous score.
2. Make a login ready when its connector is open, the owner may use it, and it does not rest.
3. Start each turn on the first ready login, and refuse a turn whose named logins have none open.
4. Write `BEFORE_TOKEN` from the CLI's authentication precedence, and leave those variables out of a login's CLI.
5. Name no login when a pushed credential holds a variable of `BEFORE_TOKEN`.
6. Write `FAILOVER` and `REFUSED` from each kind's HTTP status, and cite the API's errors page.
7. Keep a rest in `OpenLogins` for the retry time a `rejected` event names, and clear it when a connector opens.
8. Move a turn on a kind of `FAILOVER` before any part, to the first ready login it has not tried.
9. End a turn on a kind of `REFUSED` with a sentence that names the login.
10. End a turn with no login left with the last failure's words and the earliest retry time.
11. Refuse a turn that starts with every open login resting, and name the earliest retry time.
12. Drop the cooldowns, the default rest, the caps and the wait.

## Validation

- `packages/agent-claude/test/agent-claude-logins.test.ts` holds these cases:
  - A conversation's CLI starts on the record's first login, and the next one when the first is not open.
  - A record that names logins, none of them open, gets its turn refused, and the refusal names each one.
  - A CLI on a login gets no key and no cloud switch from the record's `env` or the daemon's.
  - A pushed key runs the session on the key, and on no login.
  - A 429 before any part moves the turn to the next login, cut back to the turn before it.
    The prompt goes out again under a new uuid, the chat never shows the failure, and the turn completes.
  - A 5xx moves the turn the same way, and so does a connection that never arrived.
  - A 429 that names its reset keeps the login out until then, for the next turn and for other conversations.
  - A put that opens a resting login again brings it back at once.
  - A failure after the turn showed a part ends the turn with it, and nothing runs again.
  - The start-over, a delete that fails, and a turn with no cut point behave as merged.
  - When every login fails, the turn ends with the last failure and the earliest retry time.
  - The host refuses a turn that starts with every open login resting, and names the earliest retry time.
  - An `authentication_failed` ends the turn naming the login, and tries no other login.
  - Each other 401 or 403 of the login ends the turn the same way.
  - Every other error ends the turn as it does today, `billing_error` and `account_on_hold` among them.
- Run `pnpm vitest run packages/agent-claude/test/agent-claude-logins.test.ts`, and expect every case to pass.
- Run the new cases on the code before this task, and expect them to fail.

## Resume

Done 2026-10-28.
Sixteen of the file's 26 cases fail on task 02's code.
Nine of the other ten hold on task 02's code too.
They are the start-over, the cut, a failure after a part, a put and an owner's login.
So are a record with no logins, the token over the record's `env` and the plugin's engine.
The tenth, the next login when the first is not open, passes there because the merged order of that chat puts `work` first.
A failure rests a login only for the token the CLI ran on.
A put that replaced the token mid-turn keeps the new one in use.
A conversation that a start-over could not delete ends its turn.
Its next turn starts on the first login again, since the failure named no time.
The kinds sit in `FAILOVER` and `REFUSED` by the status the CLI gives each, read against the API's errors page.

