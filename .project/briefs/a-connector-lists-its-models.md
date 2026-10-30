---
title: A connector lists its models to a client
created: 2026-10-28
refs:
  - git://37fe19a1 - the commit of ahpd the facts were checked at
  - "[code://packages/server/src/proxy/catalog.ts#L1-L18](../../packages/server/src/proxy/catalog.ts#L1-L18) - the catalog: one list per open provider connector, read at first sight and each hour"
  - "[code://packages/server/src/proxy/catalog.ts#L109-L158](../../packages/server/src/proxy/catalog.ts#L109-L158) - `refresh`, `listed` and `modelOf`"
  - "[code://packages/server/src/proxy/listener.ts#L951-L1015](../../packages/server/src/proxy/listener.ts#L951-L1015) - `GET /v1/models`, the only reader of the catalog that answers outside the host"
  - "[code://packages/server/src/commands/run.ts#L849-L850](../../packages/server/src/commands/run.ts#L849-L850) - where the catalog is made and first refreshed"
  - "[code://packages/server/src/commands/run.ts#L572](../../packages/server/src/commands/run.ts#L572) - the catalog handed to the proxy"
  - "[code://packages/sdk/src/connectors/channel.ts#L1-L49](../../packages/sdk/src/connectors/channel.ts#L1-L49) - the connectors channel, its commands and its rows"
  - "[code://packages/sdk/src/connectors/channel.ts#L190-L238](../../packages/sdk/src/connectors/channel.ts#L190-L238) - `methods`, `run` and `providers()` of the channel"
  - "[code://packages/sdk/src/types/connectors.ts#L103-L112](../../packages/sdk/src/types/connectors.ts#L103-L112) - `ProviderModel`, what one listed model holds"
  - plans/proxy/05-a-providers-own-models-are-callable/plan.md - the plan that made the catalog
  - plans/plugin/71-a-connector-signs-in-with-its-provider/plan.md - the sign-in that makes the connector this list is for
  - file:///github/ahpw/.project/briefs/a-connector-page-says-what-it-serves.md - the ahpw half, which draws this list
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/workbench/contrib/chat/browser/chatManagement/chatModelsWidget.ts - VS Code's Language Models editor, checked at 171e90619c7
---

# A connector lists its models to a client

Softov signed in to OpenRouter from ahpw's connector form, and nothing in ahpw showed what the connector serves.
He knew it worked only because he called `GET /v1/models` on the proxy by hand.
He wants a client to show a provider connector's models, so a person sees the sign-in worked and what they can now call.
This brief is the host half: a command that answers one connector's models to a client.
The ahpw brief draws the answer.

## What others do

- VS Code has a Language Models editor, `chatModelsWidget.ts`.
- It is a table with one row per provider, and each provider's models under it, with a cost column.
- A search filter `@provider:<vendor>` shows one provider's models.
- The list comes from `ILanguageModelsService`, the same service the model picker reads.

## What ahpd has today

- The model proxy keeps a catalog: one list per open provider connector, keyed by owner and id ([`code://packages/server/src/proxy/catalog.ts`](../../packages/server/src/proxy/catalog.ts#L1-L18)).
- A list is read the first time the catalog sees the connector and again each hour. A failed read keeps the old list and says the problem once.
- A connector's `models()` was bound by the connectors channel, so the key stays in that channel ([`code://packages/sdk/src/connectors/channel.ts`](../../packages/sdk/src/connectors/channel.ts#L216-L228)).
- Each listed model is a `ProviderModel`: `id`, and when the provider sends them, `name`, `context_length` and `pricing` ([`code://packages/sdk/src/types/connectors.ts`](../../packages/sdk/src/types/connectors.ts#L103-L112)).
- `run.ts` makes the catalog and refreshes it once at start ([`code://packages/server/src/commands/run.ts`](../../packages/server/src/commands/run.ts#L849-L850)). The hourly timer and `GET /v1/models` refresh it after that.
- A connector made after start is read only at the next `GET /v1/models` or the next hour.
- `GET /v1/models` is the only reader that answers outside the host ([`code://packages/server/src/proxy/listener.ts`](../../packages/server/src/proxy/listener.ts#L951-L1015)). It answers names as `<prefix>/<id>`, filtered by route and policy for the caller, mixed with the names of the models file.
- The connectors channel serves `put`, `remove`, `check`, `signin` and `signin-finish`. None of them answers models.
- A connector row carries `state` and `health`. It carries no models.
- No AHP or `x-ahpd` channel exposes the catalog. A grep of `packages/*/src` for a catalog reader outside the proxy found none.
- ahpw's model picker reads each agent's probe `Offered.models`, not the catalog.

## Who writes

| Writer | Files | Effect of the change |
|---|---|---|
| ahpd `main`, at 37fe19a1 | None of the touched files are changed in the tree | None. |
| `build/agents/fda88f4a` | No touched file differs from `main` | None. |
| `fork/maycxc-1237` | No touched file differs from `main` | None. |
| ahpw, Softov's `plugins/09-a-connector-signs-in-from-its-form` | `src/bridges/connectors.ts`, uncommitted | The ahpw brief adds a bridge call there. That brief names the order. |

## The change

- The connectors channel serves `x-ahpd/connectors/models`, which takes `{ id }`.
- The command answers `{ models, at }`: the connector's listed models, and when the list was read. Each model is a `ProviderModel` with `model` and `callable`, as *Answers* says.
- The reader check is the one `run` uses, asked at each call. A caller who cannot read the connector gets the same error as for `run`.
- A connector whose adapter has no `models` answers an error that says so.
- A connector the catalog has not read yet is read before the answer. So the first open of the page after a sign-in shows the list.
- The answer holds no key, no config and no secret. The catalog holds none today, and the answer keeps it that way.
- The catalog is the one source. The command reads it and does not fetch the provider a second time.
- The connectors channel stays in `@ahpd/sdk`, and the catalog stays in the server. The server hands the channel a reader of the catalog, as it hands the proxy one.
- The channel docs and `docs/` name the new command beside the other five.

## Answers

Softov answered the open points on 2026-10-28.

- Each model carries `model`, the `<prefix>/<id>` name a caller sends. The page shows it with a Copy button.
- The answer lists every model the connector serves, each with a `callable` flag. It does not hide the models a policy refuses.
- The model picker does not offer connector models. That change stays out of this brief.
- The plan is `plans/plugin/20261028-2151-a-connector-lists-its-models/plan.md`, in the worktree `/github/ahpd.worktrees/connector-models`.
