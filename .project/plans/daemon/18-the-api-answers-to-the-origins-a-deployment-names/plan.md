---
title: The API answers to the origins a deployment names
domain: daemon
status: planned
priority: high
created: 2026-10-10
revalidated: 2026-10-10
requires:
  - plans/daemon/05-an-http-api/plan.md
refs:
  - "[code://packages/server/src/commands/run.ts#L75-L86](../../../../packages/server/src/commands/run.ts#L75-L86) - `apiOrigins`: loopback names, a specific bind, and the host of `resource`"
  - "[code://packages/server/src/commands/run.ts#L390](../../../../packages/server/src/commands/run.ts#L390) - the API listener's origins; the same call is at L422 and L798"
  - "[code://packages/server/src/http.ts#L77-L102](../../../../packages/server/src/http.ts#L77-L102) - `hostRefusal`, `foreign` and `originRefusal`, which stay as they are"
  - "[code://packages/server/src/commands/options.ts#L439-L443](../../../../packages/server/src/commands/options.ts#L439-L443) - `resource` in `serverFields`, the pattern for a flag that is also a key"
  - "[code://packages/server/src/commands/options.ts#L398-L404](../../../../packages/server/src/commands/options.ts#L398-L404) - `paths`, the pattern for a repeatable flag that is a list in the file"
  - "[code://packages/server/src/commands/options.ts#L926-L947](../../../../packages/server/src/commands/options.ts#L926-L947) - where the options are read and returned"
  - "[code://packages/server/src/config.ts#L138-L146](../../../../packages/server/src/config.ts#L138-L146) - `Config.resource`, beside which `origins` goes"
  - "[code://packages/server/test/server-http.test.ts#L422-L440](../../../../packages/server/test/server-http.test.ts#L422-L440) - the tests of the names the API answers to"
---

## Goal

A deployment names the extra origins its daemon answers to, in the key `origins` or with `--origin`.
Then a daemon bound to `0.0.0.0` serves `http://203.0.113.1:37537/plugins/ahpd-web/` to a browser, and the sign-in identifier does not change.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "apiOrigins\(" packages/server/src` - three calls in `run.ts`: the API listener, a second listener, and the plugin routes with `announcedNames`.
- `rg -n "hostRefusal" packages/server/src/http.ts` - one check for the API and one for a plugin route at L200.
- `rg -n "resource" docs/HOST.md docs/DAEMON.md packages/server/README.md` - the key table in HOST.md, the flag tables, and the guard paragraph in DAEMON.md L706-L712.

### Runtime path

```
browser -> GET http://203.0.113.1:37537/plugins/ahpd-web/ (Host: 203.0.113.1:37537)
  -> route handler -> hostRefusal(request, authorities) -> 403 "This route does not answer to 203.0.113.1:37537"
```

### Gaps

- A wildcard bind adds no name, and only `resource` adds a public one.

## Decisions locked in

| Decision | Source | Task |
| --- | --- | --- |
| [A deployment names the extra origins the daemon answers to in `origins`, apart from `resource`](../../../decisions/a-deployment-names-extra-origins-apart-from-resource.md) | Softov, 2026-10-10 | 01, 02 |

| What | Source | Task |
| --- | --- | --- |
| An entry that is not an `http:` or `https:` URL with only a scheme, a host and a port is refused at start, and the message names the entry | (defaulted: a path or a query in an origin is a mistake, and a silent drop leaves the page refused with no reason) | 01 |
| The flag and the key are merged the way `paths` is: the flag replaces the file's list | (defaulted: the other list options already do this) | 01 |
| An entry adds exactly its `origin` and its `host`; no extra port or scheme is added | (defaulted: a browser sends exactly these two values) | 02 |

## Proposed architecture

- **Data flow** - `origins` in the file or `--origin` -> `Options.origins` -> `apiOrigins` -> the authorities and the origins every listener checks.
- **Event flow** - unchanged.
- **State flow** - unchanged; the key takes effect at the next start.
- **Layer responsibilities** - server `options.ts` and `config.ts`: read and check the key · server `run.ts`: add each entry in `apiOrigins` · docs: the key and the guard.
- **Source-of-truth files** - [`code://packages/server/src/commands/run.ts`](../../../../packages/server/src/commands/run.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The daemon reads `origins` and `--origin`](task-01-the-daemon-reads-origins.md) | todo | - |
| [02 - The API and the plugin routes answer to each origin](task-02-the-api-answers-to-each-origin.md) | todo | 01 |
| [03 - The docs say what `origins` admits](task-03-docs.md) | todo | 02 |

## Risks and tradeoffs

- Each entry weakens the DNS-rebinding guard for that one name - the deployment chooses it, and an IP address cannot be rebound.
- A WebSocket upgrade is not changed - it is checked by the connection token, not by `Host`.

## Resume state

- **Done so far:** nothing.
- **Next action:** task 01.
- **Open questions:** none.
- **Watch out for:** `apiOrigins` has tests in several files that pass `undefined` for `resource`; keep its existing arguments working, or update every call.

## Final verification checklist

- [ ] `apiOrigins` with `origins: ['http://203.0.113.1:37537']` holds the authority `203.0.113.1:37537` and the origin `http://203.0.113.1:37537`.
- [ ] A plugin route answers a request with `Host: 203.0.113.1:37537` when that origin is configured, and refuses it when it is not.
- [ ] `--origin ftp://x` and `--origin http://x/path` are refused at start.
- [ ] `ahpd config` prints `origins` and the file that set it.
- [ ] `plans/index.md` updated.
