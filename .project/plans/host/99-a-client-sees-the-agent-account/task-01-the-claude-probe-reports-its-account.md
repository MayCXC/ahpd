---
title: The Claude probe reports its account
status: done
depends: []
layer: "sdk, agent-claude"
refs:
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/meta/vscode/codexAccount.ts#L37-L50 - `ICodexAccountInfo`
  - "[code://packages/agent-claude/src/probe.ts#L49-L107](../../../../packages/agent-claude/src/probe.ts#L49-L107) - the probe"
  - "[code://packages/sdk/src/types/probe.ts#L4-L44](../../../../packages/sdk/src/types/probe.ts#L4-L44) - `Offered`"
  - "npm://@anthropic-ai/claude-agent-sdk@^0.3.301 - `AccountInfo`"
---

## Objective

The Claude probe returns the account from `initializationResult()` as `Offered.account`.
An API key or no sign-in gives a state without an email.

## Files

- `UPDATE: packages/sdk/src/types/probe.ts:4-44` - `Offered` gets an optional `account` with the fields of VS Code's `ICodexAccountInfo`.
- `UPDATE: packages/agent-claude/src/probe.ts:49-107` - the probe maps `init.account` to `Offered.account`.
- `UPDATE: packages/agent-claude/test` - a test of the map for a subscription, an API key and no sign-in.

## Steps

1. Read `AccountInfo` in the installed SDK, and record its fields in Resume.
2. Add the `account` type to `Offered`, with the fields of `ICodexAccountInfo`.
3. Map `email` to `email` and `subscriptionType` to `planType`, with `status: 'signedIn'`.
4. Map an API key or a cloud provider to `unavailable`, and no sign-in to `signedOut`.
5. Set `observedAt` to the time of the probe.
6. Write the tests.
7. Set this task and the plan row to `implemented`.

## Validation

- The agent-claude test: a subscription account gives its email and plan.
- The agent-claude test: an `apiKeySource` account gives `unavailable` and no email.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and the vitest gate pass.

## Resume

Done. The installed `@anthropic-ai/claude-agent-sdk` 0.3.301 answers `initializationResult().account` as `AccountInfo`, whose fields are:

- `email?: string`
- `organization?: string`
- `subscriptionType?: string`
- `tokenSource?: string`
- `apiKeySource?: string` - `'ANTHROPIC_API_KEY' | 'apiKeyHelper' | '/login managed key' | 'none' | 'user' | 'project' | 'org' | 'temporary' | 'oauth'`, where `'none'` is documented as "no API key in use - e.g. claude.ai OAuth login, a bearer token, or a third-party cloud provider", and the last three are legacy members a current CLI never emits.
- `apiProvider?: 'firstParty' | 'bedrock' | 'vertex' | 'foundry' | 'anthropicAws' | 'anthropicGoogleCloud' | 'mantle' | 'gateway'` - documented as "Anthropic OAuth login only applies when "firstParty"; for 3P providers the other fields are absent and auth is external".

`organization` and `tokenSource` are read and not published: `ICodexAccountInfo` has no field for either, and the plan's answer is that the Claude account takes VS Code's fields.

`Account` is the new type on `Offered`, with `status`, `email`, `planType` and `observedAt`. `accountOf` in the probe reads the answer: a key other than `'none'`, or a provider other than `'firstParty'`, is `unavailable` with no fields; an email is `signedIn` with `planType` from `subscriptionType`; an account object holding no email is `signedOut`; and a CLI that answered no account object at all leaves `Offered.account` out, which is not the same as reporting no sign-in.

Files this task changed, so the work can be committed on its own:

- `packages/sdk/src/types/probe.ts`
- `packages/sdk/src/types/index.ts`
- `packages/agent-claude/src/probe.ts`
- `packages/agent-claude/test/agent-claude-account.test.ts` (new)
- `.project/plans/host/99-a-client-sees-the-agent-account/plan.md`
- `.project/plans/host/99-a-client-sees-the-agent-account/task-01-the-claude-probe-reports-its-account.md`

Gates at this state: `pnpm -s build`, `pnpm -s typecheck`, `pnpm -s boundary`, `node tools/schema.mjs` and `git diff --quiet tools/` pass, and `pnpm -s exec vitest run packages/agent-claude` passes 313 tests in 34 files.
