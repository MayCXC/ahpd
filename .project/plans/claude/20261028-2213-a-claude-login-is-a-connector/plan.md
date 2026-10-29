---
title: A Claude login is a connector, and a failed one hands the turn on
domain: claude
status: built
priority: medium
created: 2026-10-28
revalidated: 2026-10-28
requires:
  - plans/claude/20261028-1237-a-claude-agent-runs-on-several-logins/plan.md
changes:
  - specs/agent-backends.md
refs:
  - "[code://docs/server/PROXY.md#L125-L137](../../../../docs/server/PROXY.md#L125-L137) - how the model proxy routes a name: the first entry, in the file's order, with a connector the caller may use"
  - "[code://docs/server/PROXY.md#L157](../../../../docs/server/PROXY.md#L157) - `retry-after` goes back to the caller, and a client's SDK backs off by it"
  - "[code://docs/server/PROXY.md#L159-L163](../../../../docs/server/PROXY.md#L159-L163) - when a provider fails: no connection, a 429 or a 5xx goes to the next entry until a byte has reached the caller"
  - "[code://docs/server/PROXY.md#L178](../../../../docs/server/PROXY.md#L178) - with no open connector for any entry, the proxy answers 503 and names each provider it looked for"
  - "[code://packages/server/src/proxy/listener.ts#L719-L784](../../../../packages/server/src/proxy/listener.ts#L719-L784) - the proxy's loop over its candidates: its log line, each outcome noted, a key's 401 or 403 told and not tried elsewhere"
  - "[code://docs/sdk/AUTHENTICATION.md#L75](../../../../docs/sdk/AUTHENTICATION.md#L75) - a token a client pushes is spent on the sessions that connection asks for"
  - "[code://docs/sdk/AUTHENTICATION.md#L237](../../../../docs/sdk/AUTHENTICATION.md#L237) - AHP's answer to a refused credential: sign in again"
  - "[code://packages/sdk/src/types/connectors.ts#L237-L354](../../../../packages/sdk/src/types/connectors.ts#L237-L354) - `SignIn` and `Adapter`: the schema, `open` and its stop, `check`, and the sign-in a host runs"
  - "[code://packages/sdk/src/connectors/channel.ts#L1-L50](../../../../packages/sdk/src/connectors/channel.ts#L1-L50) - `x-ahpd-connectors`: a put reopens a connector and waits for its check, and `check` runs it again"
  - "[code://packages/server/src/proxy/adapters.ts#L141-L163](../../../../packages/server/src/proxy/adapters.ts#L141-L163) - `probe`, the check a GET with the key answers, which every host adapter uses"
  - "[code://packages/server/src/proxy/adapters.ts#L349-L385](../../../../packages/server/src/proxy/adapters.ts#L349-L385) - the `openrouter` sign-in: fixed URLs, a JSON exchange, and a refusal that is its status alone"
  - "[code://packages/server/src/proxy/adapters.ts#L408-L412](../../../../packages/server/src/proxy/adapters.ts#L408-L412) - the `anthropic` check: a GET of `/v1/models` with the key"
  - "[code://packages/sdk/src/automations/automations.ts#L84-L99](../../../../packages/sdk/src/automations/automations.ts#L84-L99) - `sameOwnerOrHost`, whose connector a record of an owner may name"
  - "[code://packages/sdk/src/automations/automations.ts#L330-L400](../../../../packages/sdk/src/automations/automations.ts#L330-L400) - `checkReferences`: a field marked `x-ahpd-connector` is checked at a save and not at a restore"
  - "[code://packages/sdk/src/agents/channel.ts#L586-L693](../../../../packages/sdk/src/agents/channel.ts#L586-L693) - `putOne`, where a record's config is checked before it is written"
  - "[code://packages/server/src/commands/run.ts#L1619-L1631](../../../../packages/server/src/commands/run.ts#L1619-L1631) - a start opens the agents before the connectors"
  - "[code://packages/bot/src/plugin.ts#L420-L445](../../../../packages/bot/src/plugin.ts#L420-L445) - a plugin's own connection to its host, opened by the first thing that needs it"
  - "[code://docs/plugins/PLUGINS.md#L860-L885](../../../../docs/plugins/PLUGINS.md#L860-L885) - a plugin is a client of its own host, with the grants its configuration gives it"
  - "[code://packages/sdk/src/channels/owners.ts#L95-L107](../../../../packages/sdk/src/channels/owners.ts#L95-L107) - `ownerAllows`: a plugin may check a host connector, and no person's"
  - "[code://packages/agent-claude/src/logins.ts#L18-L157](../../../../packages/agent-claude/src/logins.ts#L18-L157) - the merged logins: a name and an inline token, the rendezvous order, and the cooldowns"
  - "[code://packages/agent-claude/src/session/logins.ts#L57-L273](../../../../packages/agent-claude/src/session/logins.ts#L57-L273) - the merged rotation: the kept login, the refusals that move a turn, the cut, the start-over and the wait"
  - "[code://packages/agent-claude/src/options.ts#L222-L249](../../../../packages/agent-claude/src/options.ts#L222-L249) - the merged `logins` field: a name and a token the vault keeps"
  - "[code://packages/agent-claude/src/session/query.ts#L150-L198](../../../../packages/agent-claude/src/session/query.ts#L150-L198) - the CLI's environment: the login's token, and a pushed credential over it"
  - "[code://packages/agent-claude/src/session/query.ts#L967-L983](../../../../packages/agent-claude/src/session/query.ts#L967-L983) - `refreshPreset`, a new CLI resumed into the same conversation when a turn starts"
  - "[code://packages/agent-claude/src/claude.ts#L753-L755](../../../../packages/agent-claude/src/claude.ts#L753-L755) - a pushed token, as the variable the CLI reads"
  - npm://@anthropic-ai/claude-agent-sdk@0.3.301 - `SDKAssistantMessageError` (sdk.d.ts L3751), `SDKAPIRetryMessage` (L3638-L3660), `SDKRateLimitEvent` (L5756-L5781)
  - npm://@anthropic-ai/claude-agent-sdk-linux-arm64@0.3.301 - the CLI 2.1.301 the SDK runs, read for its sign-in, its failures and its retries (*Searches performed*)
  - https://code.claude.com/docs/en/authentication - `claude setup-token` makes a one-year token used as `CLAUDE_CODE_OAUTH_TOKEN`, and the order the CLI picks a credential in
  - https://docs.claude.com/en/api/errors - the API's status for each error: 401 `authentication_error`, 402 `billing_error`, 403 `permission_error`
---

## Goal

A Claude agent's logins are connectors of the adapter `claude-login`, and a person signs them in, replaces and removes them from any client.
A Claude record names its logins by connector id, in the order a turn tries them.
A turn runs on the first ready login, as the model proxy sends a call to its first entry.
A login that fails with no connection, a 429 or a 5xx hands the turn to the next one, until the turn has shown something.
A refused login ends the turn and names itself, and a login whose refusal names a retry time stays out until then.
Each failure of a login is checked, so its row shows it.

A login is one Claude account's token, kept by its connector in the host's vault.
A login is ready when its connector is open, the record's owner may use it, and it is not resting.
A rest is the time a login stays out after a failure that names when to retry.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- The CLI 2.1.301 that the SDK runs, read in its binary for its sign-in:
  - `builtInOauthConfig` holds the claude.ai authorize URL `https://claude.com/cai/oauth/authorize`, the token URL `https://platform.claude.com/v1/oauth/token`, the code page `https://platform.claude.com/oauth/code/callback` and the client id `9d1c250a-e61b-44d9-88ed-5944d1962f5e`;
  - `setup-token` signs in on claude.ai with only `CLAUDE_AI_INFERENCE_SCOPE`, `user:inference`, and asks for `expires_in` of `LONG_LIVED_OAUTH_TOKEN_TTL_SECONDS`, 31536000;
  - the authorize URL carries `code=true`, `client_id`, `response_type=code`, `redirect_uri`, `scope`, `code_challenge`, `code_challenge_method=S256` and `state`;
  - the exchange posts JSON with `grant_type`, `code`, `redirect_uri`, `client_id`, `code_verifier`, `state` and `expires_in`, and its token is the answer's `access_token`;
  - a pasted code is split at `#` into the code and the state, and a paste without both is refused.
- The same binary, read for how a request fails:
  - the CLI retries a request itself on the same login, with backoff, after no connection, a 408, a 409, a 5xx or a 529;
  - it does not retry a 429 of a claude.ai login, and it retries a 401 after renewing an OAuth credential where it can;
  - each retry is a `system/api_retry` frame, whose `error_status` is null when no connection arrived;
  - a retry frame names a 401 or a 403 `authentication_failed`;
  - when it gives up, it sends an `assistant` frame with the model `<synthetic>` and an `error` from `SDKAssistantMessageError`;
  - a 429 is `rate_limit`, and a claude.ai login's words end with `resets <time>` when the reset is known;
  - a 5xx, a 529, no connection, a timeout and a lost socket are `server_error`, and `overloaded` names a 529 on `api_retry` only;
  - a 401 or a 403 is `authentication_failed`, or `oauth_org_not_allowed` when the organization may not sign in with OAuth;
  - a 403 that asks for verification is `verification_required`;
  - `account_on_hold` comes from a 400, 401 or 403 of the token endpoint, from a 401 whose refresh finds the hold, or from no answer;
  - a spent credit balance is `billing_error`, which the API's errors page gives as a 402;
  - a 404 is `model_not_found`, most 400s are `invalid_request`, and any other status is `unknown`;
  - `anthropic-ratelimit-unified-reset` is read in epoch seconds, and the API's `retry-after` counts down to it.
- A real CLI 2.1.301 ran with one scratch configuration folder per case, against the API:
  - an invalid `CLAUDE_CODE_OAUTH_TOKEN` alone ended with `authentication_failed`;
  - an invalid token beside a working sign-in in the same folder ended with `authentication_failed` too, so a refused token does not fall back.
- `curl` against the API with a Claude OAuth token and with an invalid one:
  - `POST /v1/messages/count_tokens` answered 200 to the token, with the OAuth beta header and without it;
  - it answered 401 to the invalid token, and to no token at all;
  - it answered 404 for a retired model with the token, and 401 for an unknown model with the invalid token.
- A real CLI on SDK 0.3.301 ran against a local stub that refused with the unified rate-limit headers:
  - it sent `rate_limit_event` with status `rejected` and `resetsAt` in seconds;
  - then it sent the `assistant` frame with `error: 'rate_limit'`, and a `result` with `is_error: true`.

### Runtime path

```
sign-in or put -> x-ahpd/connectors -> claude-login open keeps the token -> the record's logins name it
turn begins -> refreshPreset takes the first ready login -> CLAUDE_CODE_OAUTH_TOKEN -> CLI
  -> assistant error -> a named retry time rests the login -> the plugin logs it and asks the host to check it
  -> no connection, 429 or 5xx, nothing shown -> a new CLI on the next ready login, cut back or started over
  -> a refused credential -> the turn ends naming the login
  -> no login left -> the turn ends with the last error and the earliest retry time
```

### Gaps

- No adapter holds a Claude login; a record holds each token inline.
- The agents channel checks no field that names a connector.
- A conversation takes its logins in a rendezvous order, keeps its login, and moves on a spent quota or billing alone.
- A refusal rests a login by a guess when it names no reset, and a turn with every login resting waits.
- No row shows a login that failed.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A Claude login is a connector of the adapter `claude-login`, which agent-claude registers. Its schema is `{ token }`, and `token` is `writeOnly`, so the vault keeps it. A person replaces a login with a put of its id and removes it with a remove. | Aaron, 2026-10-28: "connectors definitely seems like the right step", and "sgtm go" to this design; [code://packages/sdk/src/types/connectors.ts#L277-L354](../../../../packages/sdk/src/types/connectors.ts#L277-L354) | 01 |
| The adapter's `signIn` fills `token` with Claude Code's own `setup-token` sign-in: claude.ai's authorize URL, Claude Code's client id, the code page as the redirect, `user:inference`, and a one-year `expires_in`. | The CLI 2.1.301, as *Searches performed* says | 01 |
| A pasted code is the code page's `<code>#<state>`, and both halves are needed. The exchange sends the state the paste carries, because `SignIn.exchange` is handed the code and the verifier alone. | The CLI 2.1.301's manual code entry; [code://packages/sdk/src/types/connectors.ts#L250-L266](../../../../packages/sdk/src/types/connectors.ts#L250-L266) | 01 |
| An exchange posts JSON with no redirect and an 8-second limit, a refusal is its HTTP status alone, and the token is the answer's `access_token`. | The `openrouter` sign-in, [code://packages/server/src/proxy/adapters.ts#L349-L385](../../../../packages/server/src/proxy/adapters.ts#L349-L385) | 01 |
| A login's check counts one prompt's tokens with the token as a bearer and the CLI's OAuth beta header: a model request that costs nothing. `probe` moves to the sdk and takes a JSON body, so the host's adapters and this one share it. | The design Aaron approved, 2026-10-28: "a free call such as count_tokens if it accepts the token, measured"; the measurement in *Searches performed*; the `anthropic` check, [code://packages/server/src/proxy/adapters.ts#L408-L412](../../../../packages/server/src/proxy/adapters.ts#L408-L412) | 01 |
| A login's `open` keeps its token and owner for the engine, and its stop forgets them, so a put or a remove reaches the next turn. | [code://packages/sdk/src/types/connectors.ts#L322-L329](../../../../packages/sdk/src/types/connectors.ts#L322-L329) | 01 |
| A Claude record's `logins` is a list of connector ids, each marked `x-ahpd-connector` with the adapter `claude-login`, in place of a name and an inline token. | Aaron, 2026-10-28, approving the design: "The Claude record's `logins` names connector ids" | 02 |
| The agents channel refuses a put whose field marked `x-ahpd-connector` names an id the host serves no connector of that adapter for, or one whose owner is neither the record's owner nor the host. A record restored at a start is not checked, because the agents open before the connectors. | The automations' check, [code://packages/sdk/src/automations/automations.ts#L330-L400](../../../../packages/sdk/src/automations/automations.ts#L330-L400); [code://packages/server/src/commands/run.ts#L1619-L1631](../../../../packages/server/src/commands/run.ts#L1619-L1631) | 02 |
| A named login is used only while its connector is open and belongs to the record's owner or to the host, and its token is the one that connector holds. | `sameOwnerOrHost`, [code://packages/sdk/src/automations/automations.ts#L84-L99](../../../../packages/sdk/src/automations/automations.ts#L84-L99), asked again at each use as a fire asks it | 02 |
| The record's logins are the entries, in the record's order. A turn runs on the first ready one, as the model proxy sends a name to the first entry, in the file's order, with a connector the caller may use. | Aaron, 2026-10-28, approving the rotation rule: "everything following the patterns is the important part"; [code://docs/server/PROXY.md#L125-L137](../../../../docs/server/PROXY.md#L125-L137) | 03 |
| The agent's own credential serves only a record that names no login. A turn whose record names logins, none of them open, is refused when it starts, and the refusal names each login it looked for. | The proxy's 503, [code://docs/server/PROXY.md#L178](../../../../docs/server/PROXY.md#L178) | 03 |
| The CLI on a login gets no credential the CLI takes before the token, from the record's `env` or from the daemon's, as the proxy sends an entry's key and no other. A key a client pushed runs that session on the key, and the session uses no login. | The Claude Code authentication page, *Authentication precedence*; [code://docs/sdk/AUTHENTICATION.md#L75](../../../../docs/sdk/AUTHENTICATION.md#L75): a pushed token is "spent only on the sessions that connection asks for" | 03 |
| A failure is an `assistant` frame of the lead conversation with an `error`, which the CLI sends when it gives up on a request. The CLI's own retries on the same login come first. | SDK 0.3.301 `SDKAssistantMessageError`; the CLI 2.1.301, as *Searches performed* says | 03 |
| A request that fails with no connection, a 429 or a 5xx goes to the next ready login that the turn has not tried. The CLI names these `rate_limit`, `server_error` and `overloaded`. | [code://docs/server/PROXY.md#L159-L163](../../../../docs/server/PROXY.md#L159-L163); [code://packages/server/src/proxy/listener.ts#L766-L770](../../../../packages/server/src/proxy/listener.ts#L766-L770); the CLI 2.1.301, as *Searches performed* says | 03 |
| A failure goes to the next login only before the turn has shown anything. After that, the turn ends with the failure, and nothing is run again. | "Once a byte has reached you, it is never retried", [code://docs/server/PROXY.md#L161](../../../../docs/server/PROXY.md#L161) | 03 |
| A refused credential, a 401 or a 403, ends the turn, names the login, and is not tried on another login. Each kind is placed by its status: `authentication_failed` is any 401 or 403, `oauth_org_not_allowed` a 401 or 403 about OAuth in the organization, and `verification_required` a 403. | The proxy's key refusal, "this host's own configuration", [code://packages/server/src/proxy/listener.ts#L744-L765](../../../../packages/server/src/proxy/listener.ts#L744-L765); [code://docs/sdk/AUTHENTICATION.md#L237](../../../../docs/sdk/AUTHENTICATION.md#L237); the CLI 2.1.301 and its retry frames, as *Searches performed* says | 03 |
| Any other error ends the turn as it does today. That holds `billing_error`, a 402, and `account_on_hold`, which is no single status. | The proxy passes a provider's own answer through, [code://packages/server/src/proxy/listener.ts#L771-L783](../../../../packages/server/src/proxy/listener.ts#L771-L783); https://docs.claude.com/en/api/errors: 402 is `billing_error` | 03 |
| A failure that names a retry time keeps that login out until then, for every session of the load. Nothing else is remembered. For a Claude login, the time is the `resetsAt` of a `rejected` `rate_limit_event`. A put reopens a login with no rest. | `retry-after`, by which "a client's SDK backs off", [code://docs/server/PROXY.md#L157](../../../../docs/server/PROXY.md#L157); the CLI 2.1.301, as *Searches performed* says; `(defaulted: a put's retry time was named for the token the connector held before)` | 03 |
| A turn with no login left ends with the last failure and the earliest retry time of a login it names. A turn that starts with every open login resting ends at once with the earliest. | The proxy answers its caller with the last entry's answer, its `retry-after` kept, [code://packages/server/src/proxy/listener.ts#L766-L783](../../../../packages/server/src/proxy/listener.ts#L766-L783) | 03 |
| The move, its cut back to the turn before, and the start-over of a conversation failed on its first turn stay as merged. | [code://packages/agent-claude/src/session/logins.ts#L107-L224](../../../../packages/agent-claude/src/session/logins.ts#L107-L224) | 03 |
| Each failure of a login goes to the plugin's log with the CLI's words, and asks the host to check that connector, so its row shows its health. | The proxy's log line and its noted outcome, [code://packages/server/src/proxy/listener.ts#L719-L726](../../../../packages/server/src/proxy/listener.ts#L719-L726); Aaron, 2026-10-28: "if it can show you the logins and one errors out that can be what displays the indication and reduction to sign in again"; [code://docs/plugins/PLUGINS.md#L860-L885](../../../../docs/plugins/PLUGINS.md#L860-L885) | 04 |

## Proposed architecture

- **Data flow** - a sign-in or a put -> the connector's `open` -> the plugin's logins, by id -> the record's `logins` -> the turn's login -> `CLAUDE_CODE_OAUTH_TOKEN`.
- **Event flow** - the failure's frames -> a rest when the time is named -> the next login, or the end of the turn. A failure -> the plugin's log and `x-ahpd/connectors/check` -> the row's `health.check`.
- **State flow** - the plugin keeps each open login's token, owner and rest. A session keeps its login, and its running turn keeps the logins it tried.
- **Layer responsibilities** - The sdk shares `probe`, and checks a record's field that names a connector. The server hands that check its connectors. The agent-claude package holds the adapter, the logins, and a session's use of them.
- **Source-of-truth files** - [`code://packages/agent-claude/src/logins.ts`](../../../../packages/agent-claude/src/logins.ts), [`code://packages/agent-claude/src/session/logins.ts`](../../../../packages/agent-claude/src/session/logins.ts), [`code://packages/sdk/src/agents/channel.ts`](../../../../packages/sdk/src/agents/channel.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - a-claude-login-is-a-connector](task-01-a-claude-login-is-a-connector.md) | done | - |
| [02 - a-records-logins-are-connector-ids](task-02-a-records-logins-are-connector-ids.md) | done | 01 |
| [03 - a-failed-login-hands-the-turn-on](task-03-a-failed-login-hands-the-turn-on.md) | done | 02 |
| [04 - a-failed-login-is-checked](task-04-a-failed-login-is-checked.md) | done | 03 |

## Risks and tradeoffs

- A record that holds inline logins fails the schema - the inline field shipped in no release.
- A first login that fails with no retry time is tried at every turn - each such turn moves after one failed attempt.
- A refused login is tried at every turn until it is signed in again - its row shows the refusal, and the turn names it.
- The CLI retries a 5xx and a lost connection on the same login before it reports them - the move comes after the CLI's own backoff.
- A move to another login loses the prompt cache, which belongs to the account - a turn moves only when its login fails.
- On a host with a users directory, the plugin's check needs grants - the README names them.
- A restart forgets every rest - the next refusal names the time again.

## Resume state

- **Done so far:** tasks 01 to 04, 2026-10-28; [implemented.md](implemented.md) says what exists.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the CLI writes a failed prompt, so a turn that runs again without a cut shows the model its prompt twice.

## Final verification checklist

- [x] Each new case fails before its task and passes after it.
- [x] `pnpm boundary`, `pnpm typecheck`, `pnpm build` and `pnpm schema` pass.
- [x] The agent-claude, sdk and server suites pass at one worker.
- [x] The README says how to give an agent its logins, the spec has the scenario, and the changelog has the entry.
- [x] PLUGINS.md says what a field marked `x-ahpd-connector` does in an engine's schema.
