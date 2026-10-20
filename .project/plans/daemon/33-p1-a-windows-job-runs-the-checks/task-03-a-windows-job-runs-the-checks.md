---
title: A Windows job runs the checks
status: done
depends: [task-01-the-boundary-finds-its-root-on-windows.md, task-02-the-test-scripts-run-in-both-shells.md]
layer: CI
refs:
  - "[code://.github/workflows/ci.yml#L13-L51](../../../../.github/workflows/ci.yml#L13-L51) - the `check` job"
---

## Objective

A `check-windows` job on `windows-latest` runs boundary, typecheck, the unit tests and the build.
It reports and does not block a merge.

## Files

- `UPDATE: .github/workflows/ci.yml:13-51` - a `check-windows` job beside `check`.

## Steps

1. Copy the `check` job as `check-windows`, on `windows-latest`.
2. Set `core.longpaths` before the checkout.
3. Run each step under `shell: bash`.
4. Set `continue-on-error: true` on the job.
5. Leave out the pack step.
6. Ask Softov to push the branch, then read the first run's log.
7. Record whether `timeout` ran in Resume.
8. Record the failing tests by file in the parent plan's Resume.
9. Set this task and the plan row to `implemented`.

## Validation

- The job runs on a push, and the Linux jobs run as before.
- Its log names each failing test.

## Resume

Built through step 5, 2026-10-16. Steps 6 to 9 read the first run of the job, so they wait on a
push, and nothing here makes one.

`check-windows` runs the same five checks as `check`, on `windows-latest`, under bash, and a
failure in it does not fail the run.

File by file:

- `.github/workflows/ci.yml` - `check-windows` sits directly after `check` (step 1), so a
  reader comparing the two reads them one after the other. `runs-on: windows-latest` and the
  same `timeout-minutes: 15`. `continue-on-error: true` is on the job (step 4), so the run is
  green whatever the job reports.
- Its first step, before `actions/checkout@v7`, is `git config --global core.longpaths true`
  (step 2). The reason is the one `DEVELOPER.md:25` gives for the clone flag: some paths
  under `.project/plans` are 185 characters long, and with the checkout folder in front they
  pass the 260 a Windows path may have, and the checkout fails before any check runs.
- Every `run` step carries `shell: bash` (step 3): the config, the install, the boundary, the
  typecheck, the tests and the build. The `uses:` steps take no shell. Bash is Git Bash on
  this runner, and it is what makes this job the same commands as `check` rather than a
  second version of them - `test:unit` is a pnpm script, and pnpm would otherwise run it
  under `cmd.exe`, where the globs of task 02 would not reach vitest.
- The pack step is left out (step 5), and its comment says so where `check` has the pack:
  what a package would publish is one answer, and the Linux job's is it.

Judgement calls the plan does not decide:

- The tests step keeps `timeout 300 pnpm test:unit`, copied from `check`. The plan's Gaps
  asks whether Git Bash on `windows-latest` has `timeout`, and step 7 is what records the
  answer, so the bound stays as `check` has it rather than being dropped on a guess.
- Nothing new is set on the step beyond `shell`. The job is a copy of `check`, and a copy
  that also changes something is two edits read as one.
- `cache: pnpm` is kept from `check`. `actions/setup-node` caches on Windows too, and the
  install is the slowest step of a job that runs the same install as `check`.

Validation:

- The workflow parses. `check-windows` reads back as `windows-latest`, `timeout-minutes: 15`,
  `continue-on-error: true`, nine steps, and a `shell: bash` on each of the eight `run` steps.
- `pnpm -s build`, `pnpm -s typecheck`, `pnpm boundary` and `node tools/schema.mjs` each exit
  0, and `git diff --stat tools/` shows only task 02's `tools/test-tmpdir.ts`. This task
  changes no package, so no package's suite is run on its own.
- The Validation of the task itself - the job running on a push, and its log naming each
  failing test - is not read here. It needs a push, which this session does not make.

Left, and waiting on the push:

- Step 6. The workflow runs on a push to `main` and on a pull request, so the job runs when
  the branch is pushed and a pull request against `main` is opened, or when the branch
  reaches `main`. This session pushes nothing, as asked.
- Step 7, whether `timeout` ran, and step 8, the failing tests by file in the parent plan's
  Resume, both follow from that log and are not recorded.
- Step 9's record of the task is this Resume; the plan row and the plan's Resume state are
  set beside it, and both name the push as what is outstanding.
- `packages/sdk/test/fixtures/wire.jsonl` is dirty from task 02's run: 119 insertions and 106
  deletions, the suite's own rewrite. `git checkout --` is denied in this mode. Run
  `git checkout -- packages/sdk/test/fixtures/wire.jsonl` before committing.
- Nothing is committed, as asked.

Closed 2026-10-19.
The job ran on each pull request after `997dda8c` reached `main` on 2026-10-18.
Step 7: `timeout` runs under Git Bash on `windows-latest`.
p6 raised the bound to 600 s in `d607eb8f`.
Step 8: the failures went into p6, from the runs of PR 7, and not into the parent plan's Resume.
On PR #30 the job passed every step, in run 39344018005.
