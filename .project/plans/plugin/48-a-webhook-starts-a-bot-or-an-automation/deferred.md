---
title: A webhook talks to a bot or fires an automation - deferred
date: 2026-10-15
---

These items are small, and no caller needs them yet.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| The plugin stays subscribed to each chat that it sends a turn in | The host keeps no limit on subscriptions, and the handler ignores the other actions of a chat | unplanned |
| An unknown endpoint answers 404 and a known one with a bad token answers 401, so a caller can learn which endpoint ids exist | An endpoint id is not a secret, and the bearer still guards each endpoint | unplanned |
| A sync call that times out keeps its end waiter until the turn ends | The waiter goes when the turn ends | unplanned |
| An endpoint is a hand-edited record file | The plan names no command that makes one | unplanned |
