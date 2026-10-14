---
title: A bot's first turn is a template - deferred
date: 2026-10-14
---

These wait on a later call by Softov or on the protocol.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| The `{{pending}}` word, filled from `PENDING.md` in the bot's workspace | Softov, 2026-10-14, to "Keep `{{pending}}`, filled from a file the bot keeps in its workspace?" - "Drop {{pending}} for now". If it returns, a bot in a computer reads the file through `ComputerPort.readFile(id, path)`, given to plugins only. Softov preferred that to `computer://` serving files, and to running `cat` through `how`. | unplanned |
| A changeset chat origin kind of its own | `ChatOriginKind` in `@microsoft/agent-host-protocol` 1.0.0 is closed. Softov, 2026-10-14, chose "Keep origin, hook skips it", so ahpd needs no new kind now. | a proposal upstream to agent-host-protocol, later |
