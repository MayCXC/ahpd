---
title: A machine off this host reaches its models through this host's proxy
domain: container
status: draft
priority: high
created: 2026-10-02
revalidated: 2026-10-04
requires:
  - plans/container/05-an-agent-in-a-machine-p9-an-ssh-machine-runs-a-nested-host/plan.md
  - plans/proxy/01-the-proxy-knows-its-providers-and-models/plan.md
  - plans/claude/16-a-preset-that-fails-skips-only-itself/plan.md
changes: []
creates: []
decisions:
refs:
  - "[code://packages/server/src/proxy/providers.ts#L25-L99](../../../../packages/server/src/proxy/providers.ts#L25-L99) - `ProxyProvider`: an endpoint, its dialects, and its key named by an environment variable; the built-in three"
  - "[code://packages/server/src/commands/proxy.ts](../../../../packages/server/src/commands/proxy.ts) - `ahpd proxy list`, which reads the table and never a key"
  - "[code://packages/sdk/src/types/computers.ts#L38-L48](../../../../packages/sdk/src/types/computers.ts#L38-L48) - `NestedStart`, which carries no environment today"
  - "[code://packages/sdk/src/types/machine.ts#L60-L64](../../../../packages/sdk/src/types/machine.ts#L60-L64) - `EnvNeed`, the variable an agent says its machine needs"
  - "[code://packages/sdk/src/nested.ts#L115-L129](../../../../packages/sdk/src/nested.ts#L115-L129) - `startInside`, where the inner host's environment is set"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L508-L518](../../../../packages/sdk/src/host/sessionmethods.ts#L508-L518) - the session's checks, then `placedIn`, where a machine is made or picked"
  - "[code://.project/plans/container/05-an-agent-in-a-machine/deferred.md](../05-an-agent-in-a-machine/deferred.md) - the host proxy this plan takes from the parent's deferred list"
---

## Goal

A session in a machine off this host may reach its model through this host's proxy.
It uses a token made for that session and dropped with it.
The proxy is one way for a remote machine to reach its models, not the only way.
A remote ahpd with its own key or its own Claude subscription runs as it does today.

This plan does not build the proxy's listener.
The listener is [proxy/02](../../proxy/02-the-proxy-serves-a-persons-model-calls/plan.md), which is built.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "listen|serve" packages/server/src/proxy` - no listener; proxy 01 is the provider table and `ahpd proxy list` only.
- `rg "env" packages/sdk/src/types/computers.ts` - `SpawnOptions.env` reaches a `how` command; `NestedStart` has no environment.
- `rg "key" packages/server/src/proxy/providers.ts` - a key is `{ env: '<NAME>' }`, read from this daemon's environment.

### Runtime path

```
session placed on a machine off this host -> [new] token minted for the session
  -> nested start env: <provider key variable>=<token>, <base URL variable>=<proxy URL>
  -> agent in the box calls the proxy URL with the token
  -> the proxy listener -> [new] token -> session, owner, scope -> provider with the real key
session disposed -> token dropped
```

### Gaps

- Nothing mints a credential for one session.
- Nothing stops a provider key from reaching a machine on another box through an `EnvNeed`, a profile's `needs` or the plugin's `needs` option.
- The SDK cannot build an ssh `-R` forward, and `NestedAsked` and `nestedHost` carry no env.
- A refusal by variable name would refuse the session's own minted token, which goes under a provider key's name.

## Decisions locked in

| Decision | Task |
| --- | --- |
| [A nested host is used only for a backend that runs nested and for a machine on another host](../05-an-agent-in-a-machine/plan.md) | 02 |
| [A secret is named in the host's, a team's or a person's scope](../../../../docs/DAEMON.md) | 03 |
| [Secrets live in a vault port, and the host's own vault is a plain file until it is encrypted](../../../../docs/DAEMON.md) | 03 |
| A nested host gets its machine's profile, and per session only the proxy token and URL | 02 |

| What | Source | Task |
| --- | --- | --- |
| The proxy is one way for a machine off this host to reach its models, not the only way; a remote ahpd with its own key or Claude subscription still runs | Softov, 2026-10-14, asked to build task 03: "as the only way a remote ahpd it by proxy calls. so its wrong" | 01, 02 |
| The listener is proxy/02's and is not planned here | proxy 01's Resume state, "Next action: the proxy listener plan" | 01, 02 |
| The token is minted in the nested start, keyed by session URI, and dropped in `removeSession`, so a create, a resume, a chat restart and an automation each get one | (defaulted: the nested start is the one road every nested session takes) | 01 |
| The proxy URL is the port's answer, `ComputerPort.proxyUrl?(id)`; `ssh.ts` opens the `-R` with `-o ExitOnForwardFailure=yes` | (defaulted: only the runtime knows how its machine is reached, and a forward that failed must fail the start) | 02 |
| `nestedHost` takes `env` by name (p1), and `NestedAsked` gains `env` | (defaulted: the token is a credential and stays out of argv) | 02 |
| For now an ssh machine and a VM reached by ssh get a reverse forward (`-R`) on the session's own ssh connection, so nothing listens on a public address; a joined node and a remote Docker use the URL this host is reached at; one member, the port's `proxyUrl(id)`, answers it | Softov, 2026-10-03, asked "how does a machine off this host reach the proxy's listener?": "as proposed" | 02 |
| The ssh runtime's option `proxyForward` picks how its `-R` forward reaches the proxy: `port` (the default), a random remote port retried on `ExitOnForwardFailure`, or `socket`, a remote unix socket that the inner host relays to a loopback URL | Softov, 2026-10-13, asked "the `-R` forward needs a port on the remote box: which?": "configurable"; then "which part do you want to set?": "The method, port by default" | 02 |
| For now an `EnvNeed` gains `proxy: '<provider id>'` and `role: 'key' \| 'url'`, so Claude declares `ANTHROPIC_API_KEY` as the key and `ANTHROPIC_BASE_URL` as the URL of `anthropic`, and an ACP preset says the same for its own variables | Softov, 2026-10-03, asked "which variable carries the base URL for each agent?": "as proposed" | 02 |
| For now the token is kept in memory beside the session, not as a principal in the users directory; a daemon restart mints a new one when the session resumes | Softov, 2026-10-03, asked "is the token a principal in the users directory, or a table in memory?": "as proposed" | 01 |

## Proposed architecture

- **Reach** - `ComputerPort.proxyUrl(id)`: `http://127.0.0.1:<forwarded port>` through `-R` on the session's ssh for an ssh machine or a VM reached by ssh; the URL this host is reached at for a joined node or a remote Docker.
- **Data flow** - the nested start mints a token for a session on a machine whose port says `remote(id)`, keyed by the session URI, keeps it beside the session with its owner and scope, hands it to the inner host (how waits on the open question), and `removeSession` drops it.
- **Verification** - the proxy listener asks the host whose a token is; a session token resolves to the session, its owner and its scope, so usage and policy charge the right person.
- **Layer responsibilities** - `@ahpd/sdk`: the token table, `NestedStart.env`, the refusal · `@ahpd/computer`: passing `env` through `nested` for each remote runtime · `@ahpd/server`: the proxy URL a remote machine is given, and the hook the proxy listener calls.
- **Source-of-truth files** - `CREATE: packages/sdk/src/session-tokens.ts`.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A session placed off this host has a token of its own](task-01-a-session-has-a-token.md) | todo | p9 task 03 |
| [02 - The inner host gets the proxy and the token instead of a key](task-02-the-inner-host-gets-the-proxy-and-the-token.md) | todo | 01, p9 task 03 |
| [03 - A machine off this host is refused while a key would travel](task-03-a-key-never-travels.md) | dropped | - |
| [04 - Docs](task-04-docs.md) | todo | 02 |

## Risks and tradeoffs

- The token sits in the box's process list and environment for the session's life - it opens only that session's model calls, through this host, and is dropped with the session.
- A box that keeps a copy can call models until the session ends - the proxy listener's limits and policy/01's rows apply to the token's owner as to any other call.
- An agent that calls its provider without honouring a base URL variable cannot use the proxy; it uses its own credentials on that machine.

## Resume state

- **Done so far:** drafted 2026-10-02, planned 2026-10-03, back to draft 2026-10-14. Task 03 is dropped: it made the proxy the only way a remote machine reaches its models.
- **Next action:** none until the computer plans are next. Then answer the open question and amend tasks 01, 02 and 04.
- **Open questions:** how a machine or a profile chooses the proxy instead of its own credentials.
- **Watch out for:** p8, p10 and p11 still assume the proxy is the only way. Amend them with this plan. The ssh `-R` forward and `proxyForward` answers still hold for a machine that uses the proxy. Do not plan or build the listener here; it is proxy/02's.

## Final verification checklist

- [ ] A session on an ssh machine answers a turn with no provider key anywhere on the box, and its usage is charged to the session's owner.
- [ ] Disposing the session makes the token refused by the proxy.
- [ ] A remote ahpd with its own key or Claude subscription still runs a session.
- [ ] `pnpm test`, `pnpm typecheck` green.
- [ ] `docs/COMPUTER.md`, `plans/index.md` updated.
