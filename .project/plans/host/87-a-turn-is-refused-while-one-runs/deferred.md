---
title: A turn is refused while one runs - deferred
date: 2026-10-16
---

These backends keep a running turn already, so the plan changed no code in them and added no test.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| A test in agent-acp, agent-cofold and agent-pi: `begin` while busy leaves the running turn in place | The task found no change to make, and its Validation asked only for the agent-claude test | unplanned |
