---
title: A Claude agent runs on several logins
domain: claude
status: active
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
changes:
  - specs/agent-backends.md
refs:
  - "[code://packages/agent-claude/src/options.ts#L250-L262](../../../../packages/agent-claude/src/options.ts#L250-L262) - `MODEL_SOURCE`, a list entry whose `key` the vault keeps; a login's token is held the same way"
  - "[code://packages/agent-claude/src/options.ts#L133-L141](../../../../packages/agent-claude/src/options.ts#L133-L141) - `enableTasks`, a declared option that is read where the CLI's environment is built"
  - "[code://packages/agent-claude/src/models.ts#L113-L116](../../../../packages/agent-claude/src/models.ts#L113-L116) - `tokenOf`, a key's text from a record, or from a daemon variable"
  - "[code://packages/agent-claude/src/session/query.ts#L150-L176](../../../../packages/agent-claude/src/session/query.ts#L150-L176) - the CLI's environment in a machine and for the task tools, with the pushed credential over the record's `env`"
  - "[code://packages/agent-claude/src/session/query.ts#L409](../../../../packages/agent-claude/src/session/query.ts#L409) - the pushed credential laid over the record's `env` on this host"
  - "[code://packages/agent-claude/src/claude.ts#L717-L727](../../../../packages/agent-claude/src/claude.ts#L717-L727) - a pushed token, as the variable the CLI reads"
  - "[code://packages/agent-claude/src/session/query.ts#L907-L923](../../../../packages/agent-claude/src/session/query.ts#L907-L923) - `refreshPreset`, a new CLI resumed into the same conversation when a turn starts"
  - "[code://packages/agent-claude/src/session/query.ts#L507](../../../../packages/agent-claude/src/session/query.ts#L507) - a rewind: `resumeSessionAt` with the conversation's id kept"
  - "[code://packages/agent-claude/src/session/query.ts#L545](../../../../packages/agent-claude/src/session/query.ts#L545) - `ends`, the last chain entry of each turn, where a rewind cuts"
  - "[code://packages/agent-claude/src/session/query.ts#L772-L858](../../../../packages/agent-claude/src/session/query.ts#L772-L858) - a `result` ends the turn, and one with `is_error` fails it"
  - "[code://packages/agent-claude/src/session/turns.ts#L88-L92](../../../../packages/agent-claude/src/session/turns.ts#L88-L92) - `writtenAs`, a prompt sent again under a new uuid that the host is told"
  - "[code://packages/agent-claude/src/session/turns.ts#L633-L659](../../../../packages/agent-claude/src/session/turns.ts#L633-L659) - `resume`, the protocol's failed turn run again"
  - "[code://packages/agent-claude/src/session/turns.ts#L661-L721](../../../../packages/agent-claude/src/session/turns.ts#L661-L721) - `cancel`, which ends the running turn"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - `SDKAssistantMessage.error` (sdk.d.ts L3669, L3751), `SDKRateLimitEvent` and `SDKRateLimitInfo` (L5756-L5781), `resumeSessionAt` (L2125-L2132)
  - https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/profiles-routing.spec.md - the reference's account routing, read whole
  - https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/routing.ts#L127-L150 - the rendezvous score of a conversation and an account
  - https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/routing.ts#L199-L210 - with every account spent, the preferred one is tried
  - https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/routing.ts#L265-L307 - `ProfileExhaustion`, the cooldowns with an injectable clock
  - https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/routing.ts#L382-L389 - the cap on a reset, for each window
  - https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/errors.ts#L658-L681 - the refusals that move to another account, and the quota one
  - https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/server.ts#L1517 - the 10-minute default cooldown
  - https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/server.ts#L1549-L1558 - the cooldown of a quota refusal
  - https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/server.ts#L1756-L1764 - a refused account is marked, quota or not
  - https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/server.ts#L1845-L1860 - an attempt that showed something is never run again on another account
  - https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/server.ts#L2114-L2122 - a spent pool waits for its earliest reset
  - https://github.com/rynfar/meridian/blob/95b3af5a2441731285c6c0dbfb29fc0b72411bf8/src/proxy/rateLimitStore.ts#L55-L72 - the SDK's `resetsAt` is in seconds
  - https://code.claude.com/docs/en/authentication - `claude setup-token` makes a one-year token for a Pro, Max, Team or Enterprise plan, used as `CLAUDE_CODE_OAUTH_TOKEN`; the order the CLI picks a credential in
---

## Goal

One Claude agent record holds several Claude logins, each a token from `claude setup-token`.
Each conversation runs on one login and keeps it while the login works.
When the API refuses a login for its quota or its billing, that login cools down until its reset.
The turn then moves to the next login.
When every login cools down, the turn waits for the first one to come back.
This is meridian's account routing, carried into the backend that starts the CLI.

A login is one Claude account's token.
A cooldown is the time a refused login is not offered.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "rate_limit|api_retry|billing_error" packages/agent-claude/src` - nothing reads the SDK's refusal frames.
- A real CLI on SDK 0.3.301 ran against a local stub that answers 429 with the unified rate-limit headers.
- The CLI signed in with a made-up token, and sent one request with no retry.
- Its frames came in this order:
  - `rate_limit_event`, with status `rejected`, `resetsAt` in seconds and `rateLimitType` `five_hour`;
  - an `assistant` frame with `error: 'rate_limit'` and the model `<synthetic>`;
  - a `result` with `is_error: true`.
- Its transcript holds the refused prompt, under the uuid it carried, and the synthetic reply after it.
- Resumed with no cut and sent the prompt again, the CLI sends the model one user message that holds the prompt twice.
- Resumed with `resumeSessionAt` at the previous turn's last entry, it sends the prompt once.
- A conversation refused on its first turn cannot start again under its id: the CLI ends with `Session ID <id> is already in use`.

### Runtime path

```
turn begins -> refreshPreset finds the conversation's login -> query env CLAUDE_CODE_OAUTH_TOKEN -> CLI
  -> rate_limit_event rejected, assistant error -> the login cools down
  -> nothing shown and a cut point known -> a new CLI on the next login, resumed at the cut, the prompt sent again
  -> every login cooling down or tried -> the turn waits for the earliest end of a cooldown
```

### Gaps

- No record field holds more than one login.
- Nothing reads `rate_limit_event` or the `error` of an assistant frame.
- A turn read back after a restart has no entry in `ends`.
  So a refusal on the turn after it has no cut point, until the backend records that entry at the transcript read.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A record holds `logins`, a list of `{ name, token }`, and `token` is write-only: the vault keeps it as it keeps a model source's `key`, and a host record may write `{ fromEnv }`. | Aaron, 2026-10-28: "for choice among logins i would just randomize the order and retry all the accounts with backoff or something. if you can find patterns that cover teh whole implementation using meridian as a reference then sgtm"; [code://packages/agent-claude/src/options.ts#L250-L262](../../../../packages/agent-claude/src/options.ts#L250-L262) | 01 |
| A login's token reaches the CLI as `CLAUDE_CODE_OAUTH_TOKEN`, over the record's `env`, and a pushed credential stays over the login. | [code://packages/agent-claude/src/claude.ts#L717-L727](../../../../packages/agent-claude/src/claude.ts#L717-L727); the Claude Code authentication page, which puts an API key before this token | 01 |
| A conversation orders the logins by meridian's rendezvous score of its chat's URI and each login's name, so the order differs between conversations and stays the same after a restart. | Aaron, 2026-10-28: "randomize the order"; meridian `routing.ts` L127-L150 | 01 |
| A conversation keeps its login while the login is not cooling down; otherwise it takes the first login in its order that is not, and with all of them cooling down it takes the first. | meridian's spec, "Priority keeps cache affinity"; meridian `routing.ts` L199-L210 | 01 |
| A change of login takes effect when a turn starts, through the restart `refreshPreset` makes for an edited record. | [code://packages/agent-claude/src/session/query.ts#L907-L923](../../../../packages/agent-claude/src/session/query.ts#L907-L923) | 01 |
| A refusal is an `assistant` frame of the lead conversation whose `error` is `rate_limit` or `billing_error`, and a `rate_limit_event` with status `rejected` names its reset. | meridian `errors.ts` L658-L681, and its `limitDetection.ts`, which reads the SDK's event as the structured form of the headers | 02 |
| A refused login cools down until the reset the event names for `five_hour` or `seven_day`, capped at 6 hours and 8 days, and for 10 minutes otherwise. | meridian `server.ts` L1517, L1549-L1558 and L1756-L1764; `routing.ts` L382-L389; `rateLimitStore.ts` L55-L72 | 02 |
| One record of cooldowns serves every session of an agent, in memory, and a later mark never shortens an earlier one. | meridian `routing.ts` L265-L307 | 02 |
| A turn that showed nothing before its refusal runs again on the next login it has not tried: a new CLI resumes at the last entry of the turn before it, and the prompt goes out again under a new uuid. | meridian `server.ts` L1845-L1860; [code://packages/agent-claude/src/session/query.ts#L507](../../../../packages/agent-claude/src/session/query.ts#L507); [code://packages/agent-claude/src/session/turns.ts#L88-L92](../../../../packages/agent-claude/src/session/turns.ts#L88-L92) | 02 |
| The cut point is the entry `ends` holds for the last turn before the refused one that ran on the CLI, which a `!` command's turn does not. | [code://packages/agent-claude/src/session/query.ts#L545](../../../../packages/agent-claude/src/session/query.ts#L545) | 02 |
| A turn that showed something before its refusal, or that has no cut point, fails as it does today, and the next turn starts on the next login. | meridian's spec, "No failover after content streams"; the measurement in *Searches performed* | 02 |
| A refusal on a conversation's first turn has no cut point: no entry comes before its prompt, and the CLI refuses the id again. | The measurement in *Searches performed* | 02 |
| When every login cools down or was tried, the turn waits until the earliest cooldown ends, says until when, and then tries again; a cancel ends the wait. | Aaron, 2026-10-28: "retry all the accounts with backoff"; meridian `server.ts` L2114-L2122 | 02 |
| `authentication_failed` and every other error fail the turn as they do today, and move nothing. | meridian `errors.ts` L658-L669 | 02 |

## Proposed architecture

- **Data flow** - a record's `logins` -> the session's login -> `CLAUDE_CODE_OAUTH_TOKEN` in the query's `env`.
- **Event flow** - `rate_limit_event`, then the `assistant` frame with `error`, then `result` -> the cooldown, then a new CLI or the wait.
- **State flow** - the agent keeps the cooldowns; a session keeps its login, and the running turn keeps the logins it tried and its wait.
- **Layer responsibilities** - agent-claude only. `src/logins.ts` holds the list, the order and the cooldowns; `src/session/logins.ts` holds what one session does with them.
- **Source-of-truth files** - [`code://packages/agent-claude/src/options.ts`](../../../../packages/agent-claude/src/options.ts), [`code://packages/agent-claude/src/session/query.ts`](../../../../packages/agent-claude/src/session/query.ts), [`code://packages/agent-claude/src/session/turns.ts`](../../../../packages/agent-claude/src/session/turns.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - a-conversation-runs-on-its-own-login](task-01-a-conversation-runs-on-its-own-login.md) | todo | - |
| [02 - a-refused-login-hands-the-turn-on](task-02-a-refused-login-hands-the-turn-on.md) | todo | 01 |

## Risks and tradeoffs

- A wait for a weekly reset can hold a turn for days - the activity says until when, and a cancel ends it.
- Two agents that hold one account's token cool it down separately, as meridian treats every profile as its own account.
- A move to another login loses the prompt cache, which belongs to the account - a conversation moves only when its login cools down.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-a-conversation-runs-on-its-own-login.md](task-01-a-conversation-runs-on-its-own-login.md).
- **Open questions:** none.
- **Watch out for:** the CLI writes a refused prompt, so a turn that runs again without a cut shows the model its prompt twice.

## Final verification checklist

- [ ] Each new case fails before its task and passes after it.
- [ ] `pnpm boundary`, `pnpm typecheck`, `pnpm build` and `pnpm schema` pass.
- [ ] The agent-claude and sdk suites pass at one worker.
- [ ] The README says how to give an agent its logins, and the spec has the scenario.
