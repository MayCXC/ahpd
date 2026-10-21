---
title: Another parser replaces the splitter
domain: host
status: built
priority: medium
created: 2026-10-16
revalidated: 2026-10-16
requires:
  - plans/host/100-terminal-commands-approved-by-rule/plan.md
  - plans/host/100-p1-a-command-is-split-and-matched/plan.md
changes: []
creates: []
decisions: []
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L351-L366](../../../../packages/sdk/src/types/plugin.ts#L351-L366) - `PortKey`"
  - "[code://packages/sdk/src/types/plugin.ts#L376](../../../../packages/sdk/src/types/plugin.ts#L376) - `PortOf`"
  - "[code://packages/sdk/src/types/plugin.ts#L762-L770](../../../../packages/sdk/src/types/plugin.ts#L762-L770) - `registerPolicies` and `registerVault`, the pattern to mirror"
  - "[code://packages/sdk/src/plugins/plugins.ts#L835-L842](../../../../packages/sdk/src/plugins/plugins.ts#L835-L842) - `setPort`"
  - "[code://packages/sdk/src/plugins/plugins.ts#L1141-L1142](../../../../packages/sdk/src/plugins/plugins.ts#L1141-L1142) - `registerPolicies` and `registerVault` call `setPort`"
  - "[code://packages/sdk/src/plugins/validate.ts#L176-L177](../../../../packages/sdk/src/plugins/validate.ts#L176-L177) - the port to method map"
  - "[code://packages/sdk/src/types/host.ts#L73](../../../../packages/sdk/src/types/host.ts#L73) - `HostOptions`, where each port lives"
  - "[code://packages/server/src/plugins.ts#L566](../../../../packages/server/src/plugins.ts#L566) - the daemon imports a plugin module"
  - "[code://packages/server/src/config.ts#L318-L323](../../../../packages/server/src/config.ts#L318-L323) - `plugins`, the one key whose value is code today"
---

## Goal

The sdk's splitter fills the `commandParser` port by default.
A plugin's `apply()` can register another parser with `registerCommandParser`.
A config key can name a `.ts` or `.js` module whose default export is `split`, with no plugin around it.
No tree-sitter dependency comes into ahpd; a tree-sitter parser can be a plugin later.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `git grep -n "setPort\|PortKey" packages/sdk/src` - fifteen ports, each registered once, with `replace`.
- `git grep -n "await import" packages/server/src/plugins.ts` - the daemon imports a plugin by file URL.

### Runtime path

```
plugin apply() -> registerCommandParser(split) / config key -> import(module).default -> HostOptions.commandParser -> getAutoApproval -> evaluate(split)
```

### Gaps

- `Not found: a config key that names a module other than a plugin - searched "import(" in packages/server/src/config.ts`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A plugin's `apply()` registers a `commandParser`, as plugins register other ports | Softov, 2026-10-16, chose "Both" for "How another parser replaces the splitter" | 02 |
| A config key names a `.ts` or `.js` module whose default export is `split` | Softov, 2026-10-16, chose "Both" for "How another parser replaces the splitter" | 03 |
| No tree-sitter dependency in ahpd; a tree-sitter parser is a later plugin, outside this plan | Softov, 2026-10-16, chose "Both" for "How another parser replaces the splitter" | - |
| The parser is a port: `commandParser` in `PortKey` and `HostOptions`, set by `registerCommandParser(split, when?)` through `setPort` | (defaulted: the pattern of `registerVault`) | 01, 02 |
| The config key is `commandParser`, a path relative to the config file | (defaulted: named after the port) | 03 |
| A parser that throws counts as `undefined`, so the call asks | (defaulted: fail closed) | 01 |
| The hook module and a plugin both set the port; two that set it refuse the start unless one says `replace` | (defaulted: as `setPort` treats two contributions) | 03 |

## Proposed architecture

- **Data flow** - the port holds one `split`. The sdk's splitter is the default value. A plugin or the hook module replaces it.
- **Layer responsibilities** - The sdk holds the port, the method and the fallback. The server loads the hook module.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The parser is a port](task-01-the-parser-is-a-port.md) | done | - |
| [02 - A plugin registers a command parser](task-02-a-plugin-registers-a-command-parser.md) | done | 01 |
| [03 - A config key loads a parser module](task-03-a-config-key-loads-a-parser-module.md) | done | 02 |

## Risks and tradeoffs

- A hook module is code that runs in the daemon. Only the operator's config names it, as with `plugins`.

## Resume state

- **Done so far:** planned 2026-10-16 from the answers in the parent plan. Task 01 implemented 2026-10-19: `commandParser` is a port in `HostOptions` and `PortKey`, `getAutoApproval` reads through it, and a throw or a wrong-shaped answer asks. Task 02 implemented 2026-10-19: `registerCommandParser(split, when?)` sets the port through `setPort`, `validate.ts` checks it as a function, and a plugin's parser reaches the check. Task 03 implemented 2026-10-19: `commandParser` in the configuration file names a module by a path relative to that file. The daemon imports it by file URL and hands it to the host. It refuses the start when the default export is not a function, or when a plugin also sets the port without `'replace'`. Softov reviewed the plan 2026-10-19 and approved the close, and [implemented.md](implemented.md) says what was built.
- **Next action:** none.
- **Open questions:** none.
- **Watch out for:** the port is the seam for both loaders; p1's approver must not import the splitter directly.

## Final verification checklist

- [x] A plugin's parser and a hook module each replace the splitter.
- [x] `pnpm -s build`, `pnpm -s typecheck` and `pnpm boundary` pass.
- [x] `plans/index.md` updated.
