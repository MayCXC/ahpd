---
title: A working directory action is answered as the protocol says - implemented
date: 2026-10-31
refs:
  - "[code://packages/sdk/src/host/chatactions.ts#L573-L676](../../../../packages/sdk/src/host/chatactions.ts#L573-L676) - the session's three working directory actions"
  - "[code://packages/sdk/src/host/chatactions.ts#L1054-L1110](../../../../packages/sdk/src/host/chatactions.ts#L1054-L1110) - the chat's two"
  - "[code://packages/sdk/src/host/lifecycle.ts#L896-L908](../../../../packages/sdk/src/host/lifecycle.ts#L896-L908) - a moved first folder said from the one clients hold to the one it went to"
---

Each working directory action does what the protocol's reducer does with it, and every one is answered.
A replacement puts the folder `replacement` names where the entry `directory` names was, and a move of the first folder is said the same way.
An action that changes nothing is answered to its sender alone, and one that names no folder is refused.

## What was built

- [`code://packages/sdk/src/host/chatactions.ts#L573-L676`](../../../../packages/sdk/src/host/chatactions.ts#L573-L676) - the session's folders as one list, put through the action as the reducer would: a set appends a folder the set lacks, a removal takes out one it holds, a replacement swaps the entry for the replacement, a replacement held later moving into the entry's place and one held earlier keeping its place. No change is `echoTo`; no folder is refused; a removal of the first folder is refused. A new first folder is handed to the restart as a move, with the rest of the folders.
- [`code://packages/sdk/src/host/chatactions.ts#L1054-L1110`](../../../../packages/sdk/src/host/chatactions.ts#L1054-L1110) - the chat's set of a folder it holds and removal of one it does not are answered with `echoTo`, and an action naming no folder is refused.
- [`code://packages/sdk/src/host/lifecycle.ts#L735`](../../../../packages/sdk/src/host/lifecycle.ts#L735) - the first folder clients hold, as the session's backend reports it, read before the restart stops the backend.
- [`code://packages/sdk/src/host/lifecycle.ts#L896-L908`](../../../../packages/sdk/src/host/lifecycle.ts#L896-L908) - a moved first folder is said as `{ directory, replacement }` from that folder to the one the session went to, and a first folder where the backend reported none as a set.
- [`code://docs/sdk/AHP.md#L239-L241`](../../../../docs/sdk/AHP.md#L239-L241), the two chat rows, and [`code://docs/sdk/AHP.md#L757-L760`](../../../../docs/sdk/AHP.md#L757-L760) under "An action that changes nothing is not a change".
- Six cases in `host-files.test.ts`: the session's three no-ops answered to the sender and to nobody else, a replacement of the first folder, of a later one, and of the first by a folder the set holds, a refusal of an action naming no folder, and the chat's two no-ops.
- The move cases in `host-files.test.ts` and `host-tools.test.ts` read the announcement's `directory` and `replacement`.
- `ahp-test-cases.test.ts`: the protocol's six replacement cases now run and agree on every key they start agreeing on, and leave the refused lists.

## Verified

- On `27bfa9b4` the nine cases fail for the reasons they name: the three session no-ops and the chat's two are dropped in silence, the replacements are read as a move to `directory`, an action naming no folder is let through, and a move is said with `directory` alone.
- After the change, `host-files`, `host-tools`, `host-trust`, `host-chats`, `ahp-test-cases`, `nested-proxy`, `presence` and `echo-origin` pass with 922 tests.
- The round's full run: `test:unit` 15 failed and `test:processes` 92 failed, each read a timeout of a loaded machine or a process killed at one; the twelve failed unit files pass one at a time (163 tests), and so does the whole process suite (695, 30 skipped).
- `pnpm run typecheck` and `pnpm run boundary` pass.

## Departures from the plan

- none.

## Left for later

- A chat's own folders are left as they are when its session's set narrows, the audit's A-D7, which a decided row of host/47-p1 sets.
