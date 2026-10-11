---
title: A reserved name is refused for a scheme and a harness
domain: plugin
status: planned
priority: high
created: 2026-10-10
revalidated: 2026-10-10
refs:
  - "[code://packages/sdk/src/plugins.ts#L105-L115](../../../../packages/sdk/src/plugins.ts#L105-L115) - `reservedScheme`, which refuses only `file` and `ahp-` today"
  - "[code://packages/sdk/src/plugins.ts#L918-L929](../../../../packages/sdk/src/plugins.ts#L918-L929) - `registerResourceProvider`, where a scheme is checked"
  - "[code://packages/sdk/src/plugins.ts#L352](../../../../packages/sdk/src/plugins.ts#L352) - the agent provider clash, the only check on a harness name today"
  - "[code://packages/sdk/src/validate.ts#L86-L97](../../../../packages/sdk/src/validate.ts#L86-L97) - `checkAgent`, which checks only that `provider` is a string"
  - "[code://packages/sdk/src/host/channels.ts](../../../../packages/sdk/src/host/channels.ts) - `schemeOf` and `spaceOf`, the routing a session URI goes through"
  - "[code://packages/sdk/src/users.ts#L42-L60](../../../../packages/sdk/src/users.ts#L42-L60) - `SUBJECTS`, the grant subjects a scheme name becomes"
  - "[code://packages/sdk/src/host/admission.ts#L177-L187](../../../../packages/sdk/src/host/admission.ts#L177-L187) - a URI's scheme becomes the grant `<scheme>:<op>`"
---

## Goal

A plugin cannot take a name that other parts of the host route on.
A harness name is the scheme of its session URIs, as `claude:/<id>`, and a resource scheme is a grant subject.
A harness or a scheme with a reserved name is refused where it is registered, and the plugin's contribution is dropped.

## Reconnaissance

### Searches performed

- `rg -n "reservedScheme" packages/sdk/src` - one check, on `registerResourceProvider` only.
- `rg -n "startsWith\('ahp-" packages/sdk/src/host` - routing keys on `ahp-session`, `ahp-chat`, `ahp-terminal`, `ahp-automation` and every `ahp-` scheme.
- `rg -n "SUBJECTS" packages/sdk/src` - the built-in grant subjects, such as `session`, `file` and `user`.

### Runtime path

```
plugin apply -> registerAgent / registerResourceProvider -> reserved name check -> contribution dropped, one problem line
client subscribe <provider>:/<id> -> schemeOf -> spaceOf / channelKind -> session channel
```

### Gaps

- A harness named `ahp-root`, `file` or `bot` registers today, and its session URIs route as another channel or scheme.
- A scheme named `session` registers today, and its grants read as the built-in `session` subject.
- A harness name and a resource scheme can be the same name.
- `Not found: a reserved check on an agent provider - searched "provider" in packages/sdk/src/validate.ts and plugins.ts.`

## Decisions locked in

| # | Decision | Rationale / source |
| --- | --- | --- |
| - | none | - |

| What | Source | Task |
| --- | --- | --- |
| A reserved name is refused, and the plugin's contribution is dropped with one problem line | Softov, 2026-10-10: "deny - drop any with 'ahp-root' 'ahp-chat' 'ahpd-bot' 'automations' ahp-session or others reserved names" | 01 |
| The prefixes `ahp-`, `ahpd-` and `x-` are reserved; `x-` is the protocol's extension space, which only the host gives out | Softov, 2026-10-10, same answer; the `x-` prefix from [how-a-host-advertises-a-resource-scheme.md](../../../research/how-a-host-advertises-a-resource-scheme.md) | 01 |
| The names `file`, `automations`, every grant subject in `SUBJECTS`, and `http`, `https`, `ws`, `wss`, `data`, `mailto` are reserved | (defaulted: each is a name the host or a client already reads as something else) | 01 |
| A harness name may not be a registered resource scheme, and a scheme may not be a registered harness name | (defaulted: a session URI and a resource URI would share a scheme) | 02 |
| A name is compared in lowercase, because `schemeOf` lowercases | [code://packages/sdk/src/host/channels.ts](../../../../packages/sdk/src/host/channels.ts) | 01 |
| The daemon's own agents are checked with the same rule, and a reserved one is refused at start | (defaulted: a harness from the daemon breaks routing the same way) | 02 |

## Proposed architecture

- **Data flow** - one function, `reservedName(name)`, answers why a name is reserved, or nothing.
- **Event flow** - no change.
- **State flow** - no change.
- **Layer responsibilities** - `packages/sdk`: the reserved list, the checks at registration and at the fold · `docs`: the list.
- **Source-of-truth files** - [`code://packages/sdk/src/plugins.ts`](../../../../packages/sdk/src/plugins.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - One reserved list refuses a scheme and a harness](task-01-one-reserved-list.md) | todo | - |
| [02 - A harness and a scheme cannot share a name](task-02-a-harness-and-a-scheme-cannot-share-a-name.md) | todo | 01 |
| [03 - The docs list the reserved names](task-03-the-docs-list-the-reserved-names.md) | todo | 02 |

## Risks and tradeoffs

- A plugin in use today with a name on the list stops loading.
- The first-party harnesses are `claude`, `pi`, `acp` and `cofold`, and none is on the list.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-one-reserved-list.md](task-01-one-reserved-list.md).
- **Open questions:** none.
- **Watch out for:** plan [44](../44-a-plugin-serves-a-channel/plan.md) gives `x-` schemes to a plugin channel. This check refuses `x-` to a harness and a resource scheme only.

## Final verification checklist

- [ ] `pnpm -s typecheck` and `pnpm -s boundary` pass.
- [ ] `pnpm exec vitest run packages/sdk packages/server` passes.
- [ ] `plans/index.md` updated.
