---
title: Check an ssh machine on dev02
plans:
  - plans/container/05-p9-an-ssh-machine-runs-a-nested-host/plan.md
---

# Check an ssh machine on dev02

container/05 p9 is built and its tests pass against an ssh fixture. This run uses a real box: dev02 (`softov@dev02.example.com`, Debian 13). Task 07, the docs, waits on what this run finds.

## Set up

1. On dev02, install Node 22 or later.
2. On dev02, run `npm i -g @ahpd/server` at the version this host runs. `ahpd --version` on this host prints it.
3. On dev02, run `ahpd plugin install` for `@ahpd/agent-cofold`, `@ahpd/agent-claude` and `@ahpd/agent-acp`.
4. On dev02, set the model key by hand. Never send it from this host.
5. On this host, check that `ssh softov@dev02.example.com` logs in with no password.
6. On this host, set `ssh.machines.dev02` in the `@ahpd/computer` options to `{ "destination": "softov@dev02.example.com", "workdir": "/home/softov/work" }`.
7. On this host, run `ahpd restart`.

## The machine is listed and runs a session

1. Check that `computer://ssh.dev02` is in the machine list.
2. Start a cofold session on it, and send one turn.
3. Check that the turn gets an answer.
4. On dev02, check that `ps -ef | grep ahpd` shows `ahpd --stdio`.

## A Claude session and an ACP session run nested

1. Start a Claude session on `computer://ssh.dev02`, and send one turn.
2. Start an ACP session on it, and send one turn.
3. Check that both get an answer, and that `ps` on dev02 shows each one under `ahpd --stdio`.

## No secret on this host's command lines

1. While a session runs on dev02, run `ps -efww` on this host.
2. Check that no line holds a token or the model key.

## A restart keeps the conversation

1. On this host, run `ahpd restart`.
2. Open each session again, and send one more turn.
3. Check that each one answers with the earlier turns in mind.

## Up time is charged to the host

1. Stop the sessions, and wait for one poll.
2. Run `ahpd usage root:<host>`, with this host's name.
3. Check that it shows a stretch of up time for `ssh.dev02`.

## An ssh machine is never made

1. Ask for a new machine with `{ "runtime": "ssh" }`, for example from the new machine form.
2. Check that it is refused with a sentence, and that nothing new is listed.

## Reply

Write "pass" for each section, or what you saw. Name anything you had to set by hand. A pass ticks the matching line in the plan.
