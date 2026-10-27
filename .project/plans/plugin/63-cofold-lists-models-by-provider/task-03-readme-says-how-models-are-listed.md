---
title: The README says how models are listed
status: doing
depends: [task-02-cofold-prefix-only-unowned-endpoint.md]
layer: "docs"
refs:
  - "[code://packages/agent-cofold/README.md#L45](../../../../packages/agent-cofold/README.md#L45) - where the cofold file is read from"
---

## Objective

The README says that each model is listed as `<provider id>/<model id>`, for every provider in the cofold file.

## Files

- `UPDATE: packages/agent-cofold/README.md` - one paragraph after line 45 on how models are listed and named.

## Steps

1. Add one paragraph after line 45 of the README.
2. Say that agent-cofold asks every provider in the cofold file for its models, each with its own key.
3. Say that each id is `<provider id>/<model id>`, such as `open_router/moonshotai/kimi-k3.1-pro`.
4. Say that the `provider` option is the prefix only for an explicit `baseUrl` or the local endpoint.
5. Write one sentence per line, with no em dash.

## Validation

- `pnpm -s build` passes, which builds the docs page that includes the README.

## Resume

- **Done so far:** nothing yet.
- **Next action:** step 1.
- **Files:** none yet.
- **Open questions:** none.
- **Departures:** none.
- **Watch out for:** the README has one paragraph per line, so keep that.
