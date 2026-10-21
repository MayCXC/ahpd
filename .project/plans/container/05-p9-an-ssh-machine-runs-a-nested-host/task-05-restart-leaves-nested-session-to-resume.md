---
title: A restart of this host leaves a nested session for the next one to resume
status: done
depends: [task-03-a-session-on-an-ssh-machine-runs-nested.md]
layer: "sdk"
refs:
  - "[code://packages/sdk/src/host.ts#L844-L846](../../../../packages/sdk/src/host.ts#L844-L846) - `Host.close`, which closes every chat"
  - "[code://packages/sdk/src/host/lifecycle.ts#L269-L272](../../../../packages/sdk/src/host/lifecycle.ts#L269-L272) - a working-directory change closes each chat and starts it again"
  - "[code://packages/sdk/src/host/lifecycle.ts#L422-L443](../../../../packages/sdk/src/host/lifecycle.ts#L422-L443) - `restartChat`, close then resume"
  - "[code://packages/sdk/src/host/chatactions.ts#L1000-L1014](../../../../packages/sdk/src/host/chatactions.ts#L1000-L1014) - a truncate closes the session and starts one behind it"
  - "[code://packages/sdk/src/host/lifecycle.ts#L95-L104](../../../../packages/sdk/src/host/lifecycle.ts#L95-L104) - `removeSession`, the one session removal"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L701-L706](../../../../packages/sdk/src/host/sessionmethods.ts#L701-L706) - a chat removed by a client"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L720-L723](../../../../packages/sdk/src/host/sessionmethods.ts#L720-L723) - `disposeSession`, which removes the session on the inner host"
  - "[code://packages/sdk/src/sessions/nested.ts#L511-L524](../../../../packages/sdk/src/sessions/nested.ts#L511-L524) - the nested `close`, which asks the inner host to dispose"
  - "[code://.project/plans/daemon/13-ahpd-restart/plan.md](../../daemon/13-ahpd-restart/plan.md) - `ahpd restart` quiesces, ends agents and resumes sessions from the store"
---

## Objective

When this host stops or restarts, or closes a chat only to start it again, a nested session ends its transport without disposing the inner session, so the inner transcript is still there when the session is resumed by id.
Only `removeSession` and a client removing a chat dispose the inner session.

## Files

- `UPDATE: packages/sdk/src/types/session.ts:545` - `close(reason?: 'dispose' | 'stopping')`, default `dispose`.
- `UPDATE: packages/sdk/src/host.ts:844-846` - `Host.close` closes with `stopping`.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:269-272, 422-443` - the working-directory restart and `restartChat` close with `stopping`, since each resumes the session right after.
- `UPDATE: packages/sdk/src/host/chatactions.ts:1000-1014` - the truncate restart closes with `stopping`, since it resumes the session right after.
- `UPDATE: packages/sdk/src/host/lifecycle.ts:95-104` - `removeSession` closes with `dispose`, named.
- `UPDATE: packages/sdk/src/host/sessionmethods.ts:701-706` - a chat removal closes with `dispose`, named, so the two are the only disposing paths.
- `UPDATE: packages/sdk/src/sessions/nested.ts:511-524` - `stopping` skips `disposeSession`, shuts the client down and ends the process.
- `UPDATE: packages/sdk/test/nested-process.test.ts` - made by container/04 task 11.

## Steps

1. Read what `removeSession` deletes on the inner host (the worktree, the stored record) and confirm the inner transcript survives a `stopping` close and is gone after a `dispose`.
2. Keep container/04 task 15's wait for `disposeSession` on the `dispose` path only.
3. An ssh process that loses its connection ends the remote `ahpd --stdio`; its store on the box is what container/04 task 11 resumes from, so nothing more is sent on the way down.

## Validation

- `nested-process.test.ts`: a real inner host serves a turn, the outer host closes, a second outer host resumes the session by id against the same inner store, and the earlier turn is in the snapshot.
- A disposed session is not resumable, as today.
- `nested-proxy.test.ts`: `restartChat`, a working-directory change and a truncate on a nested session send no `disposeSession` to the inner host; `removeSession` and a chat removal send one.

## Resume

- **Done** 2026-10-12 in git://23452449, after review.
- `Session.close` takes a `reason`, which is `dispose` by default, and its doc says what each one is.
- `dispose` is a session this host deletes, and a nested backend disposes the one inside before it stops.
- `stopping` ends the transport alone, so a resume by id still finds the transcript.
- Only the two removals name `dispose`: `removeSession`, at `lifecycle.ts:148`, and a chat a client removes, at `sessionmethods.ts:1147`.
- `Host.close` stops every chat, so a daemon going down leaves its sessions to the next one.
- `restartChat`, the working-directory change and the truncate restart stop the chat they start again.
- The old parameter was `removing`, true by default, so a restart passed `close(false)`.
- Four call sites passed that `false`, and all four now pass `close('stopping')`.
- Two of the four are not in this task's Files list: a sleep and a chat moved to another session.
- The sleep is at `sleep.ts:145` and the chat move at `sessionmethods.ts:158`.
- Both are closes followed by a resume, which the plan's own row for this task decides.
- A sleeping session is woken by its own id, and a moved chat starts again in the session it moved to.
- So neither is a fork, and `dispose` where a resume follows would put the transcript out of reach.
- In `nested.ts`, only the first `close` decides, because it is the one that starts the sequence.
- The `stopping` path waits for the start when the host inside is not up yet.
- It then skips `disposeSession`, shuts the client down and stops the process.
- A `dispose` still waits on the create in flight, which keeps container/04 task 15's wait for a removal.
- Step 3 needed no code: an ssh process that loses its connection ends the remote `ahpd --stdio`.
- What a resume reads is the store on the box, so nothing more is sent on the way down.
- `nested-proxy.test.ts` gained three cases.
- A folder change and a truncate on a nested session send no `disposeSession` to the inner host.
- A chat a client removes sends one, and the session's own chat is not touched.
- The two sites that closed with `false` for a restart now name `stopping`.
- The truncate case holds the machine's turn in the snapshot first.
- A truncate that arrives before the session is up is refused for another reason, which says nothing about a rewind.
- The chat-removal case waits for both chats' sessions inside to be made.
- A chat removed before its host inside is up has nothing there to dispose.
- `scriptedPort` gained a `turns` option, which is the one finished turn the inner host holds.
- `madeKeptAndStopped` and its `keep` helper are gone.
- With `Host.close` stopping, the ordinary road already leaves the session in the store, so `keep` only wrote a second line.
- `nested-process.test.ts` gained one case, over a port whose machine is a real `ahpd`.
- The first host serves a turn and closes; the second resumes and reads `['first words', 'second words']`.
- Its `outer` helper gained `store`, `create`, `computers` and `agentPlugins`.
- A case can then start a host the port nests, rather than a proxy that starts its own.
- `session-sleep.test.ts` records the reason each `close` was handed and holds `['stopping']` for the sleep.
- `session-wake.test.ts` and `session-wakeup-tool.test.ts` pass the reason through in their doubles.
- Validation bullet 2 is held by the existing dispose cases.
- One removes a session while its inner session is being made, and holds that the made one is disposed.
- Another holds that a nested session which is not running is deleted inside its machine.
- `pnpm -s typecheck`, `pnpm -s boundary`, `pnpm -s schema` and the gate suite pass, the last at 240 files and 4305 tests.
- What is left: nothing of this task's Validation.
- The Files line ranges moved: `types/session.ts:545` is now 708 and `host.ts:844-846` is 1127-1134.
- `lifecycle.ts:269-272` is 580, `lifecycle.ts:422-443` is 824 and `lifecycle.ts:95-104` is 148.
- `chatactions.ts:1000-1014` is 1360 and `sessionmethods.ts:701-706` is 1147.
- `nested.ts:511-524` is 1086-1161, the whole `close`.
- Most of those moved with tasks 02 and 03, not with this one.
- `packages/sdk/test/fixtures/wire.jsonl` is dirty from the gate suite, at the endpoint line and 32 `ahpd.` `_meta` lines.
- A restore is denied in this permission mode, so Softov restores it.
