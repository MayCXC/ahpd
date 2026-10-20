---
title: A form draws the variables of a shipped preset
status: todo
depends: [task-03-a-known-agent-lists-its-variables.md]
layer: "agent-acp, docs"
refs:
  - "[code://packages/agent-acp/src/plugin.ts#L36-L113](../../../../packages/agent-acp/src/plugin.ts#L36-L113) - `optionsSchema`, with one schema for every preset key"
  - "[code://packages/agent-acp/src/plugin.ts#L36](../../../../packages/agent-acp/src/plugin.ts#L36) - `envValue`, the shape of one `env` value"
---

## Objective

`optionsSchema` has an entry for each shipped preset under `presets.properties`.
The entry names the agent, carries its links, and lists its variables under `env.properties`, so a form shows them as fields.
A key that names no shipped preset keeps today's schema.

## Files

- `UPDATE: packages/agent-acp/src/plugin.ts:36-113` - build `presets.properties` from the shipped presets.
- `UPDATE: packages/agent-acp/test/agent-acp-presets.test.ts` - test the schema entries.
- `UPDATE: docs/plugins/PLUGINS.md:1232-1239` - say that a form shows the variables of a shipped preset.

## Steps

1. Build one schema per shipped preset from today's preset schema.
2. Set its `title` to the row's `name`.
3. Add the keyword `links` with the row's `site` and `company`.
4. Give its `env` one property per variable, with the variable's description.
5. Use `envValue` for a secret variable and `{ type: 'string' }` for any other.
6. Keep `additionalProperties: envValue` on `env`, so a person can still write any name.
7. Put the entries under `presets.properties`, and keep `presets.additionalProperties` for any other key.
8. Check that the daemon still accepts the extra keyword `links` when it checks the options.

## Validation

- The test reads `optionsSchema.properties.presets.properties.cline` and finds `CLINE_API_KEY` as `writeOnly`.
- The test finds `CLINE_MODEL` as a plain string.
- The test finds the `links` of `cline`.
- `pnpm test` passes.
- By hand: open the agent-acp form in a client and see the fields of the `codex` preset.

## Resume
