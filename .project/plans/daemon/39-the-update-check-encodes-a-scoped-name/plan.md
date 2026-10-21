---
title: The update check encodes a scoped name
domain: daemon
status: planned
priority: high
created: 2026-10-21
revalidated: 2026-10-21
refs:
  - "[code://packages/server/src/update.ts#L123](../../../../packages/server/src/update.ts#L123) - `refreshUpdate`, the background check, which sends `@ahpd/server` unencoded"
  - "[code://packages/server/src/selfupdate.ts#L125-L131](../../../../packages/server/src/selfupdate.ts#L125-L131) - `latestOnNpm`, which `ahpd update` with no version asks"
  - "[code://packages/server/src/install.ts#L257](../../../../packages/server/src/install.ts#L257) - the packument request, which already encodes the scope"
  - "[code://packages/server/src/install.ts#L593](../../../../packages/server/src/install.ts#L593) - the manifest request, which already encodes the scope"
  - "[code://packages/server/test/update.test.ts#L142-L146](../../../../packages/server/test/update.test.ts#L142-L146) - the case that asserts the unencoded path"
  - "[code://packages/server/test/server-update.test.ts#L62](../../../../packages/server/test/server-update.test.ts#L62) - the local registry, which answers only the unencoded path"
---

## Goal

The update check and `ahpd update` with no version get `latest` from a registry that needs the scope's slash encoded, such as verdaccio.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "askRegistry\(" packages` - four requests. The two `dist-tags` requests send `@ahpd/server`, and the two in `install.ts` send `@ahpd%2fserver`.
- The ahp-desk report, 2026-10-21: verdaccio 6.1.6 answers 404 to `/-/package/@ahpd/server/dist-tags` and 200 to `/-/package/@ahpd%2fserver/dist-tags`. npm sends the encoded form.

### Runtime path

```
ahpd update (no --version) -> latestOnNpm -> askRegistry('-/package/@ahpd/server/dist-tags') -> 404 -> "did not say which version"
daemon start -> refreshUpdate -> the same path -> 404 -> no update.json
```

### Gaps

- Behind verdaccio, `ahpd update` with no version stops, and `x-ahpd/update` with no version gets no `latest`.
- The background check writes no `update.json`, so the daemon never says that an update is available.
- The tests assert the unencoded path, so they do not find the defect.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Encode the scope's slash in the `dist-tags` path, and test the request path for a scoped name | The ahp-desk report, 2026-10-21 | 01 |

## Proposed architecture

- **Data flow** - one helper in `update.ts` gives the name of a package as a registry path. The four requests use it.
- **Source-of-truth files** - [`code://packages/server/src/update.ts`](../../../../packages/server/src/update.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The registry requests encode a scoped name](task-01-the-registry-requests-encode-a-scoped-name.md) | todo | - |

## Risks and tradeoffs

- npmjs.org accepts both forms, so the change has no effect there.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-registry-requests-encode-a-scoped-name.md](task-01-the-registry-requests-encode-a-scoped-name.md).
- **Open questions:** none.
- **Watch out for:** none.
