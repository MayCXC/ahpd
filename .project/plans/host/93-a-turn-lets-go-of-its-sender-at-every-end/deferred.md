---
title: A turn lets go of its sender at every end - deferred
date: 2026-10-15
---

These cases were seen in the build and are outside the plan.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| A chat that closes with `stopping` keeps the entries of its turn and its queued messages | The plan names the dispose only, and a restarted chat can run its queued messages again | unplanned |
| `ctx.commandTurns` keeps the entry of a removed queued `!` command and of a disposed chat | The plan names `senders` and `sentBy` only | unplanned |
| A `chat/pendingMessageRemoved` that a backend emits deletes no entry | Only the removal that a client dispatches passes through the host | unplanned |
