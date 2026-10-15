---
title: Merged sessions archive and delete themselves - deferred
date: 2026-10-15
---

These cases were seen in the build and are outside the plan.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| A pull request that opens during the archive check is not seen | The check reads the row again and does not ask GitHub again | unplanned |
| A session with new activity and no running turn can be deleted | The check before the delete does not read `modifiedAt` again | unplanned |
| A session that the host archived and whose tree stays on disk is never deleted | The plan keeps a tree that is dirty or not pushed | unplanned |
| The start banner does not print `pullRequestLookup` | `url` is the default | unplanned |
