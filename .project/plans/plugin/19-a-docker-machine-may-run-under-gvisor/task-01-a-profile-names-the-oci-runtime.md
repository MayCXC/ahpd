---
title: A profile names the OCI runtime its machines run under
status: done
depends: []
layer: "computer"
refs:
  - "[code://packages/computer/src/manifest.ts#L34-L106](../../../../packages/computer/src/manifest.ts#L34-L106) - `Profile`"
  - "[code://packages/computer/src/manifest.ts#L508-L745](../../../../packages/computer/src/manifest.ts#L508-L745) - `manifestOf`"
  - "[code://packages/computer/src/plugin.ts#L142-L175](../../../../packages/computer/src/plugin.ts#L142-L175) - `profilesOf`, which keeps only usable profile fields"
  - "[code://packages/computer/src/runtime.ts#L67-L178](../../../../packages/computer/src/runtime.ts#L67-L178) - `MachineSpec`"
  - "[code://packages/computer/src/runtime.ts#L778-L830](../../../../packages/computer/src/runtime.ts#L778-L830) - the `docker run` flags"
  - "[code://packages/computer/test/computer.test.ts](../../../../packages/computer/test/computer.test.ts) - the fake `docker` the flags are asserted against"
---

## Objective

A machine made from a profile with `ociRuntime` is started with `docker run --runtime=<value>`, and nothing else changes.

## Files

- `UPDATE: packages/computer/src/manifest.ts:34-106` - `Profile.ociRuntime`, documented.
- `UPDATE: packages/computer/src/plugin.ts:142-175` - `profilesOf` keeps a non-empty string `ociRuntime`.
- `UPDATE: packages/computer/src/manifest.ts:508-745` - `manifestOf` copies it from the profile, and refuses a body that names it.
- `UPDATE: packages/computer/src/runtime.ts:67-178` - `MachineSpec.ociRuntime`, documented.
- `UPDATE: packages/computer/src/runtime.ts:778-830` - `--runtime` pushed when it is set.
- `UPDATE: packages/computer/test/computer.test.ts` - the cases below.
- `UPDATE: packages/computer/test/computer-plugin.test.ts` - the `docker run` argv case, which the fake in `computer.test.ts` cannot assert.
- `UPDATE: packages/computer/test/computer-options-schema.test.ts` - the `EVERY_FIELD` entry the profile schema rule needs for a new field.

## Steps

1. Add the field to `Profile` and `MachineSpec` with a comment saying what it is: the OCI runtime Docker starts the container under, `runsc` for gVisor.
2. Read it in `profilesOf` like the other string fields.
3. In `manifestOf`, take it from the profile only; a body with `ociRuntime` is refused `-32602` with a sentence saying it is the operator's.
4. In `manifestOf`, a machine made from a `devcontainer.json` (`devcontainerOf` answers a folder) with a profile that names `ociRuntime` is refused `-32602` with a sentence saying the option is for a machine `docker run` makes.
5. In the docker runtime, push one argument, `--runtime=<value>`, before the image.
6. Leave the dev container runtime itself untouched.

## Validation

- `packages/computer/test/computer.test.ts`: a profile with `ociRuntime: 'runsc'` makes a `docker run` carrying `--runtime=runsc`; a profile without it carries no `--runtime`; a body with `ociRuntime` is refused; a `devcontainer` machine from a profile with `ociRuntime` is refused.
- `pnpm test`, `pnpm typecheck` green.

## Resume

Done 2026-10-12 in git://12480902, after review; task 02 was built in the same session.

The field:

- `Profile.ociRuntime?: string` is declared at `packages/computer/src/manifest.ts:55`, with a comment saying what it is.
- `MachineSpec.ociRuntime?: string` at `packages/computer/src/runtime.ts:319` carries it to the runtime.
- `profilesOf` keeps it when it is a non-empty string, at `packages/computer/src/plugin.ts:231`.
- The profile schema declares it at `packages/computer/src/plugin.ts:113`, as the profile schema rule asks.
- `manifestOf` takes it from the profile alone at `packages/computer/src/manifest.ts:923-939`, and copies it at line 1169.
- A body that names `ociRuntime` is refused `-32602`, in the words the mounts refusal uses.
- A dev container machine from a profile that names one is refused `-32602` too; the Dev Container CLI makes that machine, not `docker run`.
- The runtime pushes the one argument `--runtime=<value>` before the image, at `packages/computer/src/runtime.ts:3289`.
- The dev container route in `runtime.ts` is untouched, so nothing reads a runtime there (Step 6).

Validation, case by case:

- "a profile with `ociRuntime: 'runsc'` makes a `docker run` carrying `--runtime=runsc`" - the spec-level half is in `packages/computer/test/computer.test.ts`, which asserts `specs[0].ociRuntime` is `'runsc'`.
- The literal flag is in `packages/computer/test/computer-plugin.test.ts`, in `starts a machine under the OCI runtime its profile names`, over the fixture that records a real spawn's argv.
- "a profile without it carries no `--runtime`" - `computer.test.ts` asserts the second spec has no `ociRuntime`. The plugin case asserts that no argv entry starts with `--runtime`.
- "a body with `ociRuntime` is refused" - `computer.test.ts`, `-32602` and the sentence that names the profiles.
- "a `devcontainer` machine from a profile with `ociRuntime` is refused" - `computer.test.ts`, `-32602` and the sentence that names the Dev Container CLI.

Two things the task file did not list, both needed:

- The `docker run` argv case had to go to `computer-plugin.test.ts`. The fake runtime in `computer.test.ts` is a plain object with no docker argv, so it cannot see the flag. `computer.test.ts` asserts the field the flag is made from, and the fixture harness asserts the flag.
- `ociRuntime` had to be declared in the profile schema, and added to `EVERY_FIELD` in `computer-options-schema.test.ts`. The profile schema rule makes every field `profilesOf` reads a property, and that test enforces it.

Files this task changed, so the work can be committed on its own:

- `packages/computer/src/manifest.ts`
- `packages/computer/src/plugin.ts` (`profilesOf` and the profile schema property only, beside container 05 p9)
- `packages/computer/src/runtime.ts`
- `packages/computer/test/computer.test.ts`
- `packages/computer/test/computer-plugin.test.ts`
- `packages/computer/test/computer-options-schema.test.ts`
- `.project/plans/plugin/19-a-docker-machine-may-run-under-gvisor/plan.md`
- `.project/plans/plugin/19-a-docker-machine-may-run-under-gvisor/task-01-a-profile-names-the-oci-runtime.md`
- `.project/plans/index.md`

Gates at this state: `pnpm -s typecheck`, `pnpm -s boundary` and `pnpm -s schema` pass. The full suite passes 4730 cases in 268 files, and the two changed test files pass 41 cases.

One file outside this task is left modified: the suite rewrites `packages/sdk/test/fixtures/wire.jsonl` (33 lines). The restore was denied here, so it needs `git checkout -- packages/sdk/test/fixtures/wire.jsonl` before a commit.
