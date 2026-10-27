---
title: A shell's marks stay out of its output - deferred
date: 2026-10-27
---

This waits because it changes how the store keeps its content, which this plan does not touch.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| A late subscriber gets `command` parts when the shell marks commands, as a client that watched from the start builds them from the actions. Today `state()` sends the output as one `unclassified` part. | The store keeps one string of output, and parts need a store of its own; the protocol reducer already builds them for a live client. | unplanned, in `host` |
