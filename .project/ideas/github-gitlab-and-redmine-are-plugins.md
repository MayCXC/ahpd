---
title: GitHub, GitLab and Redmine are one plugin each
created: 2026-10-29
refs:
  - "[code://packages/sdk/src/types/connectors.ts](../../packages/sdk/src/types/connectors.ts) - adapters and connectors, with an owner and secrets in the vault"
  - "[code://packages/sdk/src/types/plugin.ts#L1083](../../packages/sdk/src/types/plugin.ts#L1083) - registerResourceProvider, for the issue scheme"
  - "[code://packages/sdk/src/types/plugin.ts#L1193](../../packages/sdk/src/types/plugin.ts#L1193) - registerGithub, the pull request port named for one forge"
  - "[code://packages/webhook/src/plugin.ts#L218-L223](../../packages/webhook/src/plugin.ts#L218-L223) - a plugin that registers an adapter and fires a trigger"
---

Softov, 2026-10-29: "one idea for plugins github, gitlab, redmine each one plugin."

`@ahpd/github`, `@ahpd/gitlab` and `@ahpd/redmine` are three plugins.
The host keeps what they share: the issue tracker interface, the `issue:` scheme, the issue tools and the choice of tracker by remote URL.
Each plugin implements only the interface against its own API.

Each plugin gives these parts:

| Part | What it is |
| --- | --- |
| Connector | One instance and its token, such as `git.brbyte.com`. A person, a team or the host owns it, and the token stays in the vault. |
| Resource provider | Issues a client lists and opens. GitHub and GitLab add pull or merge requests, commits and pipelines. |
| Tools | Search, read, comment, create and update, each with its effects declared, so a policy asks before a write. |
| Forge port | GitHub and GitLab only. The `github` port becomes a forge port that routes by the remote's URL. |
| Trigger | A `receive` capability on the connector takes the tracker's webhook and fires a trigger, such as an issue assigned to the bot. |

Redmine has no repository or pull request, so it gives no forge port.
A person installs only the trackers they use.

Related: [issues follow the repository](issues-follow-the-repository.md), [repositories are resources](repositories-are-resources.md), [initiators start sessions](initiators-start-sessions.md).
