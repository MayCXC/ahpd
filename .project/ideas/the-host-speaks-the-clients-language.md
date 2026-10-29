---
title: The host speaks the client's language
created: 2026-10-29
refs:
  - https://github.com/microsoft/agent-host-protocol/blob/main/types/common/commands.ts - initialize takes locale, a BCP 47 tag
---

A client says which language its person reads, and the host sends its own text in that language.
That text is titles, descriptions, form labels, command summaries and refusal messages, from the host and from each plugin.
AHP's `initialize` already carries `locale`, and ahpd reads none of it, so a Portuguese ahpw screen shows the host's English inside it.
A person's own text and text the model reads stay as they are.
Each plugin ships its own catalog, and the Activepieces pieces already ship theirs.
