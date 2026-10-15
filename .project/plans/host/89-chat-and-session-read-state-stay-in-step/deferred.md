---
title: Chat and session read state stay in step - deferred
date: 2026-10-15
---

These cases were seen in the build and are outside the plan.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| A catalogue session that nobody opened has no recorded chats, so a session read marks no chat | The store has no chats for it until it runs | unplanned |
| A chat that `moveChat` moves keeps its flags under the session it left | The move does not carry chat flags | unplanned |
| The `askAgent` side chat runs a turn, so it marks the session unread | The side chat is counted like a person's chat | unplanned |
| A `!` command turn that sends no ending keeps its id in `commandTurns` | Every backend sends an ending today | unplanned |
