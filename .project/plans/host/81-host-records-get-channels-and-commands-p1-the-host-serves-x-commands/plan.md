---
title: The host serves x- commands, and a plugin registers one
domain: host
status: active
priority: high
created: 2026-10-11
revalidated: 2026-10-11
requires:
  - plans/plugin/44-a-plugin-serves-a-channel/plan.md
decisions:
  - decisions/a-plugin-serves-an-x-command.md
  - decisions/an-x-command-is-named-by-domain-and-verb.md
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L176-L262](../../../../packages/sdk/src/types/plugin.ts#L176-L262) - `PluginChannel` and `ServedChannel`, the shapes a method mirrors"
  - "[code://packages/sdk/src/plugins.ts#L957-L982](../../../../packages/sdk/src/plugins.ts#L957-L982) - `registerChannel`, the registration a method mirrors"
  - "[code://packages/sdk/src/validate.ts#L271](../../../../packages/sdk/src/validate.ts#L271) - `checkChannel`, the check a method mirrors"
  - "[code://packages/sdk/src/host.ts#L1341-L1347](../../../../packages/sdk/src/host.ts#L1341-L1347) - a method with no handler is `-32601`"
  - "[code://packages/sdk/src/host/admission.ts](../../../../packages/sdk/src/host/admission.ts) - where a subscribe asks a channel's `authorize`"
  - "[code://packages/sdk/src/host/handshake.ts#L282](../../../../packages/sdk/src/host/handshake.ts#L282) - `_meta['ahpd.channels']`, the advertisement a method mirrors"
  - "[code://packages/sdk/src/host/root.ts#L415](../../../../packages/sdk/src/host/root.ts#L415) - the second place channels are advertised"
---

## Goal

The host answers a command that starts with `x-` when the daemon or a plugin serves it.
A plugin serves one with `registerMethod`, and the daemon with `HostOptions.methods`.
A client finds each served command in `_meta['ahpd.methods']`.

## Reconnaissance

### Searches performed

- `rg -n "registerMethod" packages` - only a comment that says it is not here yet.
- `rg -n "channels" packages/sdk/src/plugins.ts` - the fold seeds the plugin channels from `base.channels`.
- `rg -n "ahpd.channels" packages/sdk/src/host` - two advertisements, in the handshake and in the root state.

### Runtime path

```
client request x-ahpd/usage/totals -> host handle -> no protocol handler -> served method -> grant or authorize -> handle(params, reader, client)
```

### Gaps

- No type, registration, dispatch or advertisement for an extension command.

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| 1 | [A plugin serves an x- command with registerMethod](../../../decisions/a-plugin-serves-an-x-command.md) | Softov, 2026-10-11 |
| 2 | [An x- command is named x-ahpd/<domain>/<verb>](../../../decisions/an-x-command-is-named-by-domain-and-verb.md) | Softov, 2026-10-11 |

| What | Source | Task |
| --- | --- | --- |
| A served method is `{ grant, authorize?, handle, describe? }` | (defaulted: mirrors `PluginChannel`) | 01 |
| An entry in `_meta['ahpd.methods']` is `{ method, title, description?, grant }` | (defaulted: mirrors an `ahpd.channels` entry) | 02 |
| A command before `initialize` is `-32601`, as every other command is | [code://packages/sdk/src/host.ts#L1348-L1356](../../../../packages/sdk/src/host.ts#L1348-L1356) | 02 |
| A method named like an Object built-in answers -32601 | Softov, 2026-10-11, to "Fix it now?": "Fix in host 81" | 02 |

## Proposed architecture

- **Data flow** - the request params go to `handle` unchanged, and its answer is the result.
- **Event flow** - none; a method that changes state publishes on its own channel.
- **State flow** - `HostOptions.methods` holds every served method by name, from the daemon and from each plugin.
- **Layer responsibilities** - `packages/sdk`: the types, the check, the fold, the dispatch, the gate and the advertisement.
- **Source-of-truth files** - [`code://packages/sdk/src/types/plugin.ts`](../../../../packages/sdk/src/types/plugin.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A plugin registers a method](task-01-a-plugin-registers-a-method.md) | implemented | - |
| [02 - The host answers a served method](task-02-the-host-answers-a-served-method.md) | implemented | 01 |
| [03 - The docs describe a command of your own](task-03-the-docs-describe-a-command.md) | implemented | 02 |

## Risks and tradeoffs

- A served name could shadow a protocol command - the check refuses a name without `x-`, and the protocol gives out no `x-` name.

## Resume state

- **Done so far:** tasks 01, 02 and 03 implemented 2026-10-11, awaiting review.
- **Next action:** review the build; then p2 and p3 can start.
- **Open questions:** none.
- **Watch out for:** a test checks that `GATE` classifies every handler key.
  A served method has its own grant and is not a key there.

## Final verification checklist

- [x] A test plugin serves `x-test/echo`, and a client calls it with and without the grant.
- [x] `pnpm exec vitest run packages/sdk` passes.
- [x] `plans/index.md` updated.
