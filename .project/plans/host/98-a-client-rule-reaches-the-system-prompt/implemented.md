---
title: A client rule reaches the system prompt - implemented
date: 2026-10-19
refs:
  - git://d34adeb1
  - git://a54d02ac
  - "[code://packages/sdk/src/plugins/pluginparts.ts](../../../../packages/sdk/src/plugins/pluginparts.ts)"
  - "[code://packages/sdk/src/host/tooling.ts](../../../../packages/sdk/src/host/tooling.ts)"
  - "[code://packages/agent-acp/src/agent.ts](../../../../packages/agent-acp/src/agent.ts)"
  - "[code://docs/sdk/TOOLS.md](../../../../docs/sdk/TOOLS.md)"
---

A client can now give an agent standing instructions through a rule in its plugin.
A rule whose frontmatter says `alwaysApply: true` joins `Start.instructions` after the host tools' own wording.
A rule body over 4096 characters is dropped, and the log names the rule.
Claude, pi and cofold add the rules to the system prompt, and ACP puts them at the start of the first prompt.

## What was built

- [`code://packages/sdk/src/plugins/pluginparts.ts`](../../../../packages/sdk/src/plugins/pluginparts.ts) - a rule part carries `description`, `alwaysApply` and `globs` from its frontmatter, and `rulesOf` keeps the body beside the part.
- [`code://packages/sdk/src/host/tooling.ts`](../../../../packages/sdk/src/host/tooling.ts) - `instructions(uri)` adds the always-apply rules of the session's client plugins, with the limit `RULE_MOST`.
- [`code://packages/sdk/src/types/agent.ts`](../../../../packages/sdk/src/types/agent.ts) - the doc of `Start.instructions` names client rules.
- [`code://packages/agent-acp/src/agent.ts`](../../../../packages/agent-acp/src/agent.ts) - `create` logs once that the instructions go into the first prompt.
- [`code://docs/sdk/TOOLS.md`](../../../../docs/sdk/TOOLS.md) - which client rules apply, the limit, and what each backend does with them.

## Verified

- `packages/sdk/test/pluginparts.test.ts`: three cases, for a rule with frontmatter, a rule with none, and a frontmatter that never closes.
- `packages/sdk/test/client-plugins-session.test.ts`: four cases, for an always-apply rule, a rule without the field, a rule over the limit, and a rule whose client left.
- `pnpm -s docs:build` passed for task 03.
- Softov reviewed the plan on 2026-10-19 and approved the close.

## Departures from the plan

- Task 01 - a small frontmatter reader in `pluginparts.ts` reads the rule, because the file had no parser and `.project/rules/the-sdk-depends-only-on-the-protocol.md` keeps `@cofold/yaml` out of the sdk.
- Task 02 - the rules come from `pluginCopies(uri)`, not `pluginsFor`, because `pluginsFor` needs a chat URI.
- Task 02 - the ACP log line has no test, because no test in `packages/agent-acp/test` starts a session with instructions.
- Task 02 - `spawn.ts` reads `instructions(uri)` twice for one start, so a dropped rule is logged twice.
- The check by hand that a Claude session follows a client rule has no record.

## Left for later

- Nothing.
