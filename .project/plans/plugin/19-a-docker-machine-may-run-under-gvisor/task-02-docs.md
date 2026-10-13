---
title: The computer docs describe ociRuntime
status: done
depends: [task-01-a-profile-names-the-oci-runtime.md]
layer: "docs"
refs:
  - "[code://docs/COMPUTER.md#L206-L263](../../../../docs/COMPUTER.md#L206-L263) - the Profiles section"
  - "[code://docs/COMPUTER.md#L315](../../../../docs/COMPUTER.md#L315) - the Security section"
---

## Objective

`docs/COMPUTER.md` says a profile may name `ociRuntime`, that `runsc` is gVisor, and that a client cannot change it.

## Files

- `UPDATE: docs/COMPUTER.md:206-263` - the field, with a one-line example.
- `UPDATE: docs/COMPUTER.md:315` - one line in Security on what gVisor adds.

## Steps

1. Add the field and the example.
2. Say Docker must have the runtime installed, that a missing one is Docker's refusal, and that a dev container machine refuses the option.

## Validation

- Read against the code by hand.

## Resume

Done 2026-10-12 in git://9e870773, after review.

What the two edits say:

- [Profiles](#profiles) gains a paragraph on `ociRuntime`, after the `folder` paragraph, with a one-line example: `{ "profiles": { "untrusted": { "ociRuntime": "runsc" } } }`.
- The paragraph says `runsc` is gVisor and what it adds, and that Docker must have the runtime installed.
- It says a host without that runtime refuses the create with Docker's own message, because the value is passed as given.
- It says absent means no `--runtime` argument at all, and that the field is the profile's alone.
- It says a manifest that names the field is refused, and so is a machine made from a `devcontainer.json` whose profile names it.
- [Security](#security) gains one paragraph, before *What a machine is not*, on what gVisor adds and on the default runtime sharing this host's kernel.

Validation, read against the code by hand:

- `packages/computer/src/runtime.ts:3289` pushes `--runtime=<value>` only when the field is set, which is the "absent means none" sentence.
- `packages/computer/src/manifest.ts:923-928` refuses a body that names the field, and lines 937-939 refuse a dev container machine from a profile that names it.
- The value is passed as given, so a runtime the host does not have is Docker's own refusal, as decision `gvisor-is-a-docker-profile-option-not-a-runtime` says.

Gates at this state: `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass, and the suite passes 4728 of 4730 cases. Two cases timed out under load, in `agent-acp-ports.test.ts` and `computer-plugin.test.ts`; both pass when their own files run alone, 42 cases.

Files this task changed, so the work can be committed on its own:

- `docs/COMPUTER.md`
- `.project/plans/plugin/19-a-docker-machine-may-run-under-gvisor/plan.md`
- `.project/plans/plugin/19-a-docker-machine-may-run-under-gvisor/task-02-docs.md`
- `.project/plans/index.md`
