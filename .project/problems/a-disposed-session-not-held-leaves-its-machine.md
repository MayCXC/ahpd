---
title: A session disposed while this process does not hold it leaves its disposable machine
status: open
date: 2026-10-30
severity: major
blocks: []
refs:
  - "[code://packages/sdk/src/host/lifecycle.ts#L664-L671](../../packages/sdk/src/host/lifecycle.ts#L664-L671) - the branch for a session that is not held forgets the row and never lets its machine go"
  - "[code://packages/sdk/src/host/machines.ts#L359-L361](../../packages/sdk/src/host/machines.ts#L359-L361) - `leaveForgotten` tells the port a forgotten session left its machine"
  - "[code://packages/sdk/src/host/catalogue.ts#L1016](../../packages/sdk/src/host/catalogue.ts#L1016) - the prune of forgotten rows calls `leaveForgotten`, and dispose does not"
  - "[code://packages/computer/src/plugin.ts](../../packages/computer/src/plugin.ts) - `leave` arms the removal of a disposable machine when its session set empties"
  - git://f3495654 - container/05 p8 merged; the leak was found in its task 05 on dev02, and it is older than p8
---

## Symptom

A session runs in a disposable machine.
The host restarts, and nobody resumes the session, so this process does not hold it.
A client then disposes the session.
The row goes, but the machine stays and is never removed.
An adopted machine starts with the session's `ahpd.session` label in its set, so the set never empties.

## Cause

`removeSession` tears down a held session, and the teardown lets its machine go.
For a session that is not held, the `held === undefined` branch forgets the chats, the kept row and the owner.
It never calls `ctx.leaveForgotten(uri, kept.config(...))`, so the port never hears `leave` for that session.
The prune of forgotten rows in `catalogue.ts` does call `leaveForgotten`, and reads the config before the row goes.

## Impact

Each such dispose leaves one container, with its volumes, on the machine's Docker.
On a profile with `server`, the container stays on another box until somebody removes it by hand.
The plugin's `max` counts every labeled machine, so leaked machines also use up its limit.

## Workaround

Remove the machine by hand with `docker rm -f` on its Docker, and its volumes with `docker volume rm`.

## Fix

- In the `held === undefined` branch, read `kept.config(idOf(uri))` before `kept.forget`, and call `ctx.leaveForgotten` with it after the row goes. Add a test that disposes a session not held and expects `leave`.
- Or make `kept.forget` itself report the config it drops, so every road that forgets a row lets its machine go in one place.
