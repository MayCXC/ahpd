---
title: A bot that names a profile gets a machine of its own, and a bot that names a machine shares it
status: accepted
date: 2026-10-13
refs:
  - "[code://packages/bot/src/record.ts#L76-L77](../../packages/bot/src/record.ts#L76-L77) - `computer`, the machine a bot runs in"
  - "[code://packages/bot/src/start.ts#L27-L38](../../packages/bot/src/start.ts#L27-L38) - `sessionFor`, which passes `config.computer`"
  - "[code://packages/computer/src/plugin.ts#L1800-L1815](../../packages/computer/src/plugin.ts#L1800-L1815) - a disposable machine removed `disposableDelay` after its last session"
---

## Context

A bot names its machine in `computer`.
A `disposable:<profile>` machine is removed after `disposableDelay`, and the inner transcript goes with it.
A bot keeps one session for its whole life, so a machine that goes away loses the bot's conversation.
Several bots may share one machine, as decision `a-bot-owns-one-folder` says.
A running container cannot gain a new mount, so a machine that bots share must hold every bot's folder from the start.

## Decision

A bot whose `computer` is `disposable:<profile>` gets a machine of its own.
That machine lives as long as the bot, not for `disposableDelay`, and goes when the bot is deleted.
A bot whose `computer` is a `computer://<id>` shares that machine with other bots.
A shared machine mounts the bots' root, `~/.bots` by default, once when it is made, and each bot works in its own folder there.
Source: Softov, 2026-10-13, asked "How do bots and machines pair up, and how long does a machine live?", answered "Profile: own; machine: shared".

## Consequences

A bot keeps its transcript across days, because its machine stays.
Many bots can run in one machine, and the person pays for one machine.
A `computer://<id>` that does not mount the bots' root is refused for a bot, with a sentence.
Deleting a bot now removes a machine, which a person must be told in the delete answer.

## Options

- **One machine per profile, shared by every bot of that profile**: rejected; the first bot would decide the machine of the others.
- **A disposable machine per session**: rejected; the inner transcript is lost when the machine goes.
