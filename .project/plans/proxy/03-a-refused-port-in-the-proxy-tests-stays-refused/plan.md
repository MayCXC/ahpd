---
title: A refused port in the proxy tests stays refused
domain: proxy
status: built
priority: high
created: 2026-10-20
revalidated: 2026-10-20
refs:
  - "[code://packages/server/test/proxy-forward.test.ts#L204-L214](../../../../packages/server/test/proxy-forward.test.ts#L204-L214) - a 502 case that closes a fake to get a refused port"
  - "[code://packages/server/test/proxy-forward.test.ts#L347-L360](../../../../packages/server/test/proxy-forward.test.ts#L347-L360) - the case that failed on main at 32c1911b"
  - "[code://packages/server/test/proxy-forward.test.ts#L381-L393](../../../../packages/server/test/proxy-forward.test.ts#L381-L393) - a fallback case that closes a fake the same way"
  - "[code://packages/server/test/proxy-forward.test.ts#L20-L36](../../../../packages/server/test/proxy-forward.test.ts#L20-L36) - `fake` and `proxy`, which each listen on a free port"
---

## Goal

Three proxy tests close a fake provider and use its port as a provider that cannot be reached.
After the close, the system can give the same port to the next server that listens.
On main at 32c1911b, the proxy itself got that port.
The call to the "refused" provider then reached the proxy, which answered `Nothing is served at /v1/v1/messages`, and the test failed.
After this plan, a refused port is closed only after the proxy and every other fake listen.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg "await gone.close" packages/server/test` - three cases in `proxy-forward.test.ts`, at lines 206, 350 and 385.

### Runtime path

```
fake listens -> fake closes -> proxy listens on a free port, which can be the same -> the call to p1 reaches the proxy
```

### Gaps

- In each of the three cases, a server can listen on the closed port before the call.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Record the flake and fix it | Softov, 2026-10-20, to "What should I do with it?": "Record and fix it" | 01 |
| Close the fake after the proxy and the other fakes listen | (defaulted: a port that a live server holds cannot go to another server in the same process) | 01 |

## Proposed architecture

- **Data flow** - no change in the product. Only the order of the test setup changes.
- **Source-of-truth files** - [`code://packages/server/test/proxy-forward.test.ts`](../../../../packages/server/test/proxy-forward.test.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The fake closes after the proxy listens](task-01-the-fake-closes-after-the-proxy-listens.md) | done | - |

## Risks and tradeoffs

- A server in another test worker can still take the port between the close and the call. The window is now one close and one request, not a server start.

## Resume state

- **Done so far:** [task-01](task-01-the-fake-closes-after-the-proxy-listens.md) is implemented. In each of the three cases, `gone` closes after `proxy` listens. `proxy-forward.test.ts` passed 20 of 20 runs, and `pnpm -s typecheck` passed.
- **Next action:** none. The plan is built.
- **Open questions:** none.
- **Watch out for:** `fakes.splice` removes the closed fake from the list that `afterEach` closes, so keep that line after the close.
