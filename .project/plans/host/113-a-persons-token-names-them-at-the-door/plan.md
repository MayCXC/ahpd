---
title: A person's own token names them at the door
domain: host
status: built
priority: high
created: 2026-10-21
revalidated: 2026-10-21
requires: []
changes:
  - specs/sign-in.md
creates: []
decisions:
  - decisions/a-persons-token-names-them-unless-the-issuer-is-required.md
refs:
  - "[code://packages/server/src/commands/run.ts#L553-L565](../../../../packages/server/src/commands/run.ts#L553-L565) - the daemon's door options: `identify` hands over the principal only when `who.trusted` is true"
  - "[code://packages/sdk/src/listen.ts#L111-L133](../../../../packages/sdk/src/listen.ts#L111-L133) - `doorOf`, which already admits with a principal whenever `identify` answers one"
  - "[code://packages/sdk/src/access/users.ts#L1078-L1110](../../../../packages/sdk/src/access/users.ts#L1078-L1110) - `verify`: a record's token, then a minted token, then the issuers; the branch says which kind matched"
  - "[code://packages/sdk/src/access/users.ts#L939-L992](../../../../packages/sdk/src/access/users.ts#L939-L992) - `principalOf`, which stamps `trusted` from `trustToken`"
  - "[code://packages/sdk/src/access/users.ts#L427-L436](../../../../packages/sdk/src/access/users.ts#L427-L436) - `FileUserOptions.trustToken`, the host default, read at L471"
  - "[code://packages/sdk/src/access/users.ts#L717-L736](../../../../packages/sdk/src/access/users.ts#L717-L736) - how a record's optional keys are read, with `once` for a value this host does not know: the pattern for `requireIssuer`"
  - "[code://packages/sdk/src/access/users.ts#L1225-L1234](../../../../packages/sdk/src/access/users.ts#L1225-L1234) - `list`, whose rows carry `trusted` for `ahpd user list` and the users channel"
  - "[code://packages/sdk/src/types/users.ts#L80-L89](../../../../packages/sdk/src/types/users.ts#L80-L89) - `Principal.trusted` and its comment"
  - "[code://packages/sdk/src/types/users.ts#L197-L198](../../../../packages/sdk/src/types/users.ts#L197-L198) - `UserRecord.trustToken`"
  - "[code://packages/sdk/src/types/listen.ts#L196-L204](../../../../packages/sdk/src/types/listen.ts#L196-L204) - `Arrival`, whose comment names `trustToken`"
  - "[code://packages/sdk/src/host/handshake.ts#L584-L606](../../../../packages/sdk/src/host/handshake.ts#L584-L606) - `authenticate` for the sign-in resource: `users.verify`, then the principal is set"
  - "[code://packages/sdk/src/host/handshake.ts#L341-L346](../../../../packages/sdk/src/host/handshake.ts#L341-L346) - `ahpd.principal` on `initialize`, absent for a connection that is nobody"
  - "[code://packages/server/src/commands/options.ts#L518-L521](../../../../packages/server/src/commands/options.ts#L518-L521) - the `trustToken` field, its flag `--trust-token`, and its default at L1168"
  - "[code://packages/server/src/commands/user.ts#L138](../../../../packages/server/src/commands/user.ts#L138) - `ahpd user list` prints `trusted` or `sign-in` from the row"
  - "[code://packages/server/test/config-check.test.ts#L533](../../../../packages/server/test/config-check.test.ts#L533) - a file with an unknown key starts and says so in its log"
  - "[code://packages/sdk/test/users-gate-commands.test.ts#L292-L310](../../../../packages/sdk/test/users-gate-commands.test.ts#L292-L310) - the handshake and root snapshot carry `ahpd.principal`: the test shape to reuse"
---

## Goal

A person who connects with a token the users file knows is that person from the first frame.
The web UI connects with `?tkn=` and never sends `authenticate`, so today it is nobody and the handshake has no `ahpd.principal`.
A deployment that requires its company sign-in sets `requireIssuer`, and then only the issuer's token signs a person in.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "trustToken|trust-token" packages docs` - the sdk directory, the listen types, the daemon's options, config, help text and README, and five docs.
- `rg "\.trusted\b" packages/*/src` - read by the daemon's `identify` and by `ahpd user list`; every other `trusted` is folder trust, not this.
- `rg "trusted" /github/ahpw/src` - the web UI reads `trusted` from the users channel rows and shows "Trusted" or "Not trusted".
- `rg "the-door-is-a-door" packages docs` - ten code comments and doc lines cite the old decision.
- Live daemon on 2026-10-21: both records name an issuer and have a token, and neither sets `trustToken`.

### Runtime path

```
?tkn=<person's token> -> doorOf -> identify -> users.verify -> principal (trusted?)
  -> today: trusted false -> admitted, nobody -> no ahpd.principal
  -> after: principal unless requireIssuer and the token was local -> ahpd.principal on initialize
authenticate(token) -> users.verify -> after: refused when requireIssuer and the token was local
```

### Gaps

- `verify` does not say whether the token was local or the issuer's, so nothing can require the issuer.
- `authenticate` accepts any token `verify` accepts, so it can never ask for more than the door.
- No daemon test connects with a person's token and reads `ahpd.principal` from `initialize`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| [A person's own token names them at the door, unless the host requires the issuer](../../../decisions/a-persons-token-names-them-unless-the-issuer-is-required.md) | Softov, 2026-10-21, "since the token is sent on advantage. why I cannot authorize the use with that token?" | 01 |
| A local token is a record's own token or one the person minted | [code://packages/sdk/src/access/users.ts#L1094-L1110](../../../../packages/sdk/src/access/users.ts#L1094-L1110) | 01 |
| `requireIssuer` is a host key and a record key, the record wins, off by default | Softov, 2026-10-21, "A setting, off (Recommended)" | 01, 02 |
| With `requireIssuer` on, a local token opens the socket and names nobody, and `authenticate` refuses it | Softov, 2026-10-21, "The second token was just if 'required' by a company authorization" | 01 |
| The flag is `--require-issuer` | `(defaulted: the key spelled with dashes, as every other key)` | 02 |
| `trustToken` on the host, on a record and `--trust-token` are removed | Softov, 2026-10-21, "A setting, off (Recommended)" | 01, 02 |
| A configuration file that still sets `trustToken` starts, and the key is logged as unknown | [code://packages/server/test/config-check.test.ts#L533](../../../../packages/server/test/config-check.test.ts#L533) | 02 |
| A record that still sets `trustToken` is read without it, and `once` logs that the key is gone | `(defaulted: the record keys already warn this way)` | 01 |
| A record with `requireIssuer` on and no issuer is logged once, and its local token opens the socket only | `(defaulted: nobody can sign in, and the log says why)` | 01 |
| `authenticate` refuses a local token with `-32007`, "Sign in through your issuer", and the sign-in resource in the error data | `(defaulted: the code and data a token that names nobody gets)` | 01 |
| `trusted` stays on the principal and the list rows, and now means a local token signs the person in | `(defaulted: ahpw and ahpd user list keep reading it unchanged)` | 01 |
| The deployment's token is unchanged and stays root | Softov, 2026-09-23, "the deployment token exempt: yes" | - |
| ahpw is out of this plan | Softov, 2026-10-21, "I will see about ahpw" | - |

## Proposed architecture

- **Data flow** - `verify` knows which branch matched, and `principalOf` stamps `trusted` as "not a local token of a record that requires the issuer".
- **Layer responsibilities** - sdk `access/users.ts`: stamps `trusted` · sdk `host/handshake.ts`: refuses an untrusted principal · server: the key and the flag.
- **Source-of-truth files** - [`code://packages/sdk/src/access/users.ts`](../../../../packages/sdk/src/access/users.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A local token names its person unless the issuer is required](task-01-a-local-token-names-its-person.md) | done | - |
| [02 - The daemon has requireIssuer and no trustToken](task-02-the-daemon-has-require-issuer.md) | done | 01 |
| [03 - The docs and the spec say the token names the person](task-03-the-docs-say-the-token-names-the-person.md) | done | 02 |

## Risks and tradeoffs

- A leaked personal token is that person at the door - this was already true through `authenticate`, and a new token still fixes it.
- A host that set `trustToken: false` now names people at the door - the log names the unknown key, and `requireIssuer` asks for more.
- The web UI still shows "Trusted" and "Not trusted" - the value has a narrower meaning, and its words are Softov's to change in ahpw.

## Resume state

- **Done so far:** planned 2026-10-21, with the decision that replaces `the-door-is-a-door`; tasks 01, 02 and 03 implemented 2026-10-21. Typecheck, the sdk suite (171 files, 3312 cases) and the server suite (64 files, 1290 cases) pass.
- **Next action:** none. The plan is built.
- **Open questions:** none.
- **Watch out for:** `trusted` on a principal is not folder trust; every other `trusted` in `packages/*/src` is the session's folder and stays as it is.

## Final verification checklist

- [ ] A connection on `?tkn=` with a person's token gets `ahpd.principal` on `initialize`, with no key set.
- [ ] With `requireIssuer` on, the same token opens the socket with no principal, and `authenticate` with it answers `-32007`.
- [ ] With `requireIssuer` on, an issuer's token signs the person in.
- [ ] The deployment's token is still root.
- [ ] A configuration file with `trustToken` starts and logs the key as unknown.
- [ ] No `trustToken`, `--trust-token` or `the-door-is-a-door` is left in `packages/` or `docs/`.
- [ ] `plans/index.md` updated.
