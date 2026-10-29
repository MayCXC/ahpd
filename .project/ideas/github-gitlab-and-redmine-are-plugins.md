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
Each one calls the tracker's REST API, with no SDK.

## What each plugin gives

| Part | What it is |
| --- | --- |
| Connector | One instance and its token, such as `git.brbyte.com`. A person, a team or the host owns it, and the token stays in the vault. |
| Resource provider | Issues a client lists and opens. GitHub and GitLab add pull or merge requests, commits and pipelines. |
| Tools | Search, read, comment, create and update, each with its effects declared, so a policy asks before a write. |
| Forge port | GitHub and GitLab only. The `github` port becomes a forge port that routes by the remote's URL. |
| Trigger | An event on the tracker starts a session or a turn, as *Triggers* says. |

Redmine has no repository or pull request, so it gives no forge port.
A person installs only the trackers they use.

## Triggers

Each plugin is an issue initiator, as [initiators start sessions](initiators-start-sessions.md) describes.

- An issue assigned to the bot, or a new label, starts a session on its repository in a fresh worktree.
- The issue is the session's prompt.
- The session ends in a pull or merge request that links back, and the outcome is posted on the issue.
- A review comment that mentions the bot sends another turn to the same session, so the plugin keeps the map from issue to session.
- A failed pipeline starts a run that fixes it.

The plugin hears an event by webhook or by polling, as a setting.
A webhook goes through a `receive` capability on the connector, as [plugin 48](../plans/plugin/48-a-webhook-starts-a-bot-or-an-automation/plan.md) does, and needs a daemon the tracker can reach.
Polling needs no public URL, so it suits a daemon behind NAT.
Outside a LAN, a webhook needs a tunnel: [a Cloudflare tunnel publishes the daemon](a-cloudflare-tunnel-publishes-the-daemon.md).

## What it reuses

- The pull request artifact and baseline from [host 01](../plans/host/01-artifact-tools/plan.md) and [host 03](../plans/host/03-pull-request-baseline/plan.md), shared and not copied.
- The tracker interface, project choice and runtime vocabulary from tasker, as [issues follow the repository](issues-follow-the-repository.md) says.

## Open

- Which folder serves a repository when several served folders hold it. [Repositories are resources](repositories-are-resources.md) removes the question with a clone for each session.
