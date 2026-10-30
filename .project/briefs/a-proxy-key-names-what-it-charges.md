---
title: A proxy key names what it charges
created: 2026-10-29
refs:
  - git://5e2b7003 - the commit of ahpd the facts were checked at
  - "[code://packages/server/src/proxy/caller.ts#L86-L112](../../packages/server/src/proxy/caller.ts#L86-L112) - `callerOf`: who a proxy call is, and the scope it names"
  - "[code://packages/sdk/src/usage/scopes.ts#L154-L199](../../packages/sdk/src/usage/scopes.ts#L154-L199) - `scopeFor` and the refusal Softov saw"
  - "[code://packages/sdk/src/types/users.ts#L271-L299](../../packages/sdk/src/types/users.ts#L271-L299) - `TokenRecord` and `MintedToken`"
  - "[code://packages/sdk/src/access/users.ts#L1084-L1114](../../packages/sdk/src/access/users.ts#L1084-L1114) - `standing` and `can`, which read the token record again on each check"
  - "[code://packages/sdk/src/access/users.ts#L1512-L1569](../../packages/sdk/src/access/users.ts#L1512-L1569) - `mintToken`, which needs a user record and checks the grants at the mint"
  - "[code://packages/sdk/src/access/users.ts#L219-L224](../../packages/sdk/src/access/users.ts#L219-L224) - the `proxy` subject: `proxy:models` and `proxy:call`"
  - "[code://packages/sdk/src/access/tokens.ts#L110-L136](../../packages/sdk/src/access/tokens.ts#L110-L136) - `x-ahpd/tokens/mint` and its params"
  - "[code://packages/server/src/commands/token.ts#L150-L190](../../packages/server/src/commands/token.ts#L150-L190) - `ahpd token mint` and its flags"
  - "[code://packages/sdk/src/host/owners.ts#L200-L206](../../packages/sdk/src/host/owners.ts#L200-L206) - a session resolves its scope with the same `scopeFor`"
  - "[code://packages/sdk/src/types/usage.ts#L36-L63](../../packages/sdk/src/types/usage.ts#L36-L63) - `UsageBase`, the fields every usage record has"
  - "[code://packages/sdk/src/types/policies.ts#L31](../../packages/sdk/src/types/policies.ts#L31) - `PolicyScope`: all, a user, a team or a project"
  - "[code://packages/sdk/src/types/policies.ts#L71-L104](../../packages/sdk/src/types/policies.ts#L71-L104) - `PolicyLimit` and `Policy`"
  - "[code://packages/sdk/src/access/policies.ts#L30-L52](../../packages/sdk/src/access/policies.ts#L30-L52) - the measures, periods and limit pools a policy takes"
  - "[code://packages/sdk/src/access/decide.ts#L157-L169](../../packages/sdk/src/access/decide.ts#L157-L169) - `decide`, which skips every policy for a principal that holds `*:*`"
  - plans/host/35-a-person-belongs-to-teams-and-projects/plan.md - the plan that made memberships and the primary
  - plans/proxy/02-the-proxy-serves-a-persons-model-calls/plan.md - the plan that made the proxy caller and `X-AHP-Scope`
  - https://docs.litellm.ai/docs/proxy/virtual_keys - LiteLLM virtual keys, read on 2026-10-29
  - https://docs.litellm.ai/docs/proxy/request_tags - LiteLLM request tags, read on 2026-10-29
---

# A proxy key names what it charges

Softov points pi at the ahpd model proxy.
pi takes a base URL and an API key, and nothing more: no extra header and no query.
So pi cannot send `X-AHP-Scope`, and a call is charged to the default scope of the person.
The default works only when the person has a primary, or exactly one membership that is not `team:*`.
With `backend:*`, or with two projects of one team, every call from pi is refused.
He wants the key to carry what a call needs, so a client that sends only the key works.
This brief has five parts.
They are a scope on a key, a key for a team, limits on a key, meta on a key, and meta in a header.

## What others do

- OpenAI project API keys belong to one project. Each call with the key is billed to that project, and the call does not name it.
- Anthropic API keys belong to one workspace, and usage goes to that workspace.
- LiteLLM `/key/generate` takes `team_id`, `user_id`, `key_alias`, `duration`, `models`, `allowed_routes`, `key_type`, `tags`, `metadata`, `max_budget`, `budget_duration`, `rpm_limit`, `tpm_limit` and `max_parallel_requests`.
- LiteLLM `key_type` is a preset of `allowed_routes`: `llm_api`, `management`, `read_only` or `default`.
- LiteLLM spend goes to the key and to the team of the key. The docs show no way for a call to change the team of its key.
- LiteLLM has both `tags`, a list of strings, and `metadata`, free JSON. A call sends tags in `x-litellm-tags`, and tags in a call body go inside `metadata.tags`.

## What ahpd has today

### Scope

- A proxy caller sends its credential as `Authorization: Bearer` or `x-api-key` ([`code://packages/server/src/proxy/caller.ts`](../../packages/server/src/proxy/caller.ts#L64-L72)).
- A person's call names its scope in `X-AHP-Scope` or `?scope=`, and `scopeFor` resolves it ([`code://packages/server/src/proxy/caller.ts`](../../packages/server/src/proxy/caller.ts#L108-L111)).
- With no scope named, `scopeFor` uses the primary. With no primary, it uses the one concrete membership, and refuses when there are none or several ([`code://packages/sdk/src/usage/scopes.ts`](../../packages/sdk/src/usage/scopes.ts#L180-L187)).
- A `team:*` membership is not concrete, so `backend:*` alone with no primary is refused with `soft may name backend:ahpapp, backend:ahpc` ([`code://packages/sdk/src/usage/scopes.ts`](../../packages/sdk/src/usage/scopes.ts#L154-L160)).
- A person with no membership on a host that names teams is refused with `soft belongs to no team and project, so there is nothing to charge`.
- `ahpd user` sets `--primary <team[:project]>` on a person ([`code://packages/server/src/commands/user.ts`](../../packages/server/src/commands/user.ts#L153)). The primary is one per person, so two keys of one person cannot charge two projects.
- A session resolves its scope with the same `scopeFor` ([`code://packages/sdk/src/host/owners.ts`](../../packages/sdk/src/host/owners.ts#L200-L206)).
- A session's own token is resolved by `whose` before a person, and keeps the scope of its session. This change does not touch it.

### Keys

- A minted token holds `id`, `user`, `label`, `grants`, `created`, `expires` and the hash ([`code://packages/sdk/src/types/users.ts`](../../packages/sdk/src/types/users.ts#L271-L292)).
- `x-ahpd/tokens/mint` takes `user`, `label`, `grants` and `expires` ([`code://packages/sdk/src/access/tokens.ts`](../../packages/sdk/src/access/tokens.ts#L110-L136)). `ahpd token mint` takes the same as flags.
- `mintToken` refuses a user with no record, and a grant the person does not hold ([`code://packages/sdk/src/access/users.ts`](../../packages/sdk/src/access/users.ts#L1512-L1542)). A token always belongs to one person.
- `can` and `standing` read the token record and the users file again at each check ([`code://packages/sdk/src/access/users.ts`](../../packages/sdk/src/access/users.ts#L1084-L1114)).
- The `proxy` subject has `proxy:models`, in the read group, and `proxy:call`, in the write group ([`code://packages/sdk/src/access/users.ts`](../../packages/sdk/src/access/users.ts#L219-L224)). A token limited to these two can call the proxy and nothing else. No `key_type` is needed for that.
- The `Owner` of a usage record is one of `user:`, `team:`, `project:`, `root:` or `plugin:` ([`code://packages/sdk/src/types/usage.ts`](../../packages/sdk/src/types/usage.ts#L20)).

### Limits

- A policy row has a `scope` of `all`, `user:<id>`, `team:<team>` or `project:<team>:<project>` ([`code://packages/sdk/src/types/policies.ts`](../../packages/sdk/src/types/policies.ts#L31)).
- A row holds `limits`, each an `amount`, a `measure`, a `period` and a `pool` ([`code://packages/sdk/src/types/policies.ts`](../../packages/sdk/src/types/policies.ts#L71-L80)).
- A `model` row counts `usd`, `tokens` or `calls`, over a `day`, `week`, `month` or `total` ([`code://packages/sdk/src/access/policies.ts`](../../packages/sdk/src/access/policies.ts#L30-L52)). There is no period shorter than a day, so no rate per minute.
- `decide` skips every policy for a principal that holds `*:*` ([`code://packages/sdk/src/access/decide.ts`](../../packages/sdk/src/access/decide.ts#L165)). A key of an admin is not held to any limit.
- A usage record names its owner, team, project, session, chat, turn, agent and computer ([`code://packages/sdk/src/types/usage.ts`](../../packages/sdk/src/types/usage.ts#L36-L63)). It does not name the token that made the call, so no limit can count one key.

### Meta

- A usage record has no free field for labels.
- The proxy reads no header for labels.
- No `X-AHP-*` header goes upstream ([`code://packages/server/src/proxy/listener.ts`](../../packages/server/src/proxy/listener.ts#L154)).

## Who writes

| Writer | Files | Effect of the change |
|---|---|---|
| ahpd `main`, at 5e2b7003 | None of the touched files are changed in the tree | None. |
| Local branches of ahpd | No branch changes `caller.ts`, `scopes.ts`, `tokens.ts`, `users.ts`, `types/users.ts` or `commands/token.ts` against `main` | None. |

## The change

### 1. A scope on a key

- A token record holds an optional `scope`, written `team` or `team:project`.
- `x-ahpd/tokens/mint` takes `scope`, and `ahpd token mint` takes `--scope`.
- The mint refuses a scope that `scopeFor` refuses for the person now. A `team:*` is not a scope, so the mint refuses it too.
- A key with a scope always charges that scope. A call that names a different scope is refused with 403. A call that names the same scope is allowed.
- The scope of a key goes through `scopeFor` at each call, so a membership taken away refuses the call.
- A key with no scope works as today: a named scope, then the primary, then the one concrete membership.
- The scope of a key applies wherever the key signs in. A session opened over `/api` with the key is charged to that scope too.

### 2. A key for a team

- A token record names its owner as a person or as a team.
- A team key has no person behind it. It is charged as `team:<team>`, and its scope is that team or one of its projects.
- A team key is for the model proxy only. It holds `proxy:call` and `proxy:models`, and nothing else.
- The root connection mints a team key, and so does a person who may mint keys for another person, which is `user:write`.
- The same callers list and revoke team keys.
- A team key is held to the `all` rows, the rows of its team and project, and its own `token:<id>` rows.

### 3. Limits on a key

- A usage record names the token that made the call.
- A policy row takes the scope `token:<id>`, so a key gets the same limits a person, a team or a project gets.
- A limit on a key binds even when the person behind the key holds `*:*`.
- A policy period takes `minute`, so a `model` row can limit `calls` per minute (rpm) and `tokens` per minute (tpm).
- A minute is a fixed window, as a day is. A call is refused when the window has used its limit.
- The tokens of a call are known only when it ends, so a call that starts under the tpm limit may end over it.

### 4. Meta on a key

- A token record holds an optional `meta`: a map of string keys to string values.
- `x-ahpd/tokens/mint` takes `meta`, and `ahpd token mint` takes `--meta key=value`, once per entry.
- A label without a value is written with a key, such as `env=prod`. There is no second form for a bare tag.
- A key is at most 64 characters of letters, digits, `_`, `.` and `-`. A value is at most 256 characters, with no comma and no line break.
- A key or a call holds at most 32 entries.
- A usage record holds the meta of its call.

### 5. Meta in a header

- A call sends meta in `X-AHP-Meta`, as `key=value` pairs separated by commas.
- The meta of the key is the default. A header adds keys, and cannot change a key that the key already sets.
- `X-AHP-Meta` does not go upstream, because no `X-AHP-*` header does.
- `docs/server/PROXY.md` says that a key can carry its scope and meta, with the pi case as the example.

### After this plan

- The ahpw and ahpc mint forms get fields for scope, owner, limits and meta.
- The ahpw Keys form shows grants as a flat list of what the roles write, such as `session:*` and `*:*`. `proxy:call` and `proxy:models` show only inside `*:*`, so a key for the proxy alone cannot be made there. The form lists the operations of each subject that the person's grants cover.
- Each client gets its own brief for these.

## Open points

- The bounds on meta are defaults: 64 characters a key, 256 a value, 32 entries. Softov did not set them.
- The rpm and tpm window is a fixed minute. A sliding window is the other choice.
