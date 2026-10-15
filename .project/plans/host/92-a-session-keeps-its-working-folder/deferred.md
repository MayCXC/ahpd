---
title: A session keeps its working folder, and the backends find it there after a restart - deferred
date: 2026-10-15
---

These cases are outside the record and the lookup that this plan built.

| What | Why it waits | Where it goes |
| --- | --- | --- |
| A folder path longer than 200 characters is not found in its own folder | The SDK adds a hash to the project folder name, and agent-claude spells the name without it; the configured paths are the fallback | unplanned |
| The session list does not show a session outside the configured paths | The catalogue lists the configured paths only; such a session opens by its link | unplanned |
| `askModel` in `changesets.ts` gives the backend a `file://` URI as the folder | The record keeps a path from either form, but the backend still gets the URI; this was wrong before the plan | unplanned |
| A session the host never ran has no folder in its record | A listing gives no folder to a record without a provider, so such a session stays lost outside the paths | unplanned |
