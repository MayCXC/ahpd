---
title: The docs say how plugins and connectors are seen
status: todo
depends: [task-03-shipped-plugins-declare-contracts.md, task-04-a-client-lists-the-plugins.md, task-08-a-webhook-endpoint-is-a-connector.md]
layer: "docs"
refs:
  - "[code://docs/plugins/PLUGINS.md](../../../../docs/plugins/PLUGINS.md) - the registration kinds and the `ahpd` field"
  - "[code://docs/plugins/WEBHOOKS.md](../../../../docs/plugins/WEBHOOKS.md) - how an endpoint is made today"
  - "[code://CHANGELOG.md](../../../../CHANGELOG.md) - the release notes"
---

## Objective

The docs say how a plugin declares its manifest, how a client sees plugins and connectors, and how a webhook endpoint is made now.

## Files

- `UPDATE: docs/plugins/PLUGINS.md` - the manifest fields, the contracts, `registerConnector` and the two channels.
- `UPDATE: docs/plugins/WEBHOOKS.md` - make an endpoint as a `webhook` connector.
- `UPDATE: CHANGELOG.md` - the break: old `webhooks/<id>.md` files are no longer read.
- `UPDATE: .project/plans/plugin/00-plugin.md` - check the glossary entries against what was built.
- `UPDATE: .project/plans/index.md` - the plan row.

## Steps

1. Add a manifest section to `PLUGINS.md`, with one package.json example and one module example.
2. List the contract keys, and say what a refused registration prints.
3. Add `registerConnector` to the list of registration kinds, with one kind example.
4. Describe `x-ahpd-plugins` and `x-ahpd-connectors`, with their methods and grants.
5. Rewrite how to make an endpoint in `WEBHOOKS.md`, with a `put` example.
6. Add the break to `CHANGELOG.md` first, with the steps to make each endpoint again.
7. Set this task and the plan row to `done`.

## Validation

- `pnpm -s docs:build` passes, if the repository has the script.
- Every example in the docs matches a test case of tasks 01 to 08.

## Resume

- **Done so far:** nothing.
- **Next action:** step 1.
- **Open questions:** none.
- **Watch out for:** the docs say what a feature does; the reasons are in the plan's answers.
