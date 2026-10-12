---
title: A store keeps the global and folder decisions
status: todo
depends: []
layer: "packages/sdk"
refs:
  - "[code://packages/sdk/src/types/host.ts#L215-L224](../../../../packages/sdk/src/types/host.ts#L215-L224) - the `automations` option, the pattern for a new store option"
  - "[code://packages/sdk/src/automations.ts#L374](../../../../packages/sdk/src/automations.ts#L374) - `memoryAutomations`, the pattern for the memory store"
  - file:///github/externals/vscode/src/vs/platform/agentHost/node/agentHostCustomizationEnablementService.ts - the key, the stored shape, the inherited rule and the cap
---

## Objective

The sdk declares an `EnablementStore` and ships `memoryEnablement()`.
The store keeps a global decision and a decision for each folder, keyed as VS Code's host keys them.

## Files

- `CREATE: packages/sdk/src/enablement.ts` - the key function, the store interface and `memoryEnablement()`.
- `UPDATE: packages/sdk/src/types/host.ts:215-224` - the `enablement?: EnablementStore` host option beside `automations`.
- `UPDATE: packages/sdk/src/index.ts` - export the new names.
- `CREATE: packages/sdk/test/enablement.test.ts` - the cases below.

## Steps

1. Write `enablementKeyOf(customization)` in `enablement.ts`.
2. Key a plugin by its source URI.
3. Key an MCP server of a plugin as `<plugin source>#mcp=<name>`, and any other MCP server as `mcpServers#<name>`.
4. Return no key for any other type, because VS Code's host keeps decisions for plugins and MCP servers only.
5. Declare `EnablementStore` with `global(key)`, `folder(dir, key)`, `setGlobal(key, on)` and `setFolder(dir, key, on)`.
6. Let `undefined` in a setter clear the decision.
7. Clear a decision that equals the value it inherits.
8. Let a folder inherit the global decision, and let the global decision inherit on.
9. Cap the store at 512 decisions, and drop the decision set longest ago first.
10. Write `memoryEnablement()` to hold the decisions in memory.
11. Add the `enablement` host option, with a comment that says what a missing store means.

## Validation

- `enablement.test.ts` checks the three key forms and no key for a skill.
- It checks that the store clears a folder decision equal to the global one.
- It checks that the 513th decision drops the oldest one.
- `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm exec vitest run packages/sdk` pass.

## Resume
