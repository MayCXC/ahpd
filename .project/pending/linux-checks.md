---
title: Check plugin/51 on Linux
plans:
  - plans/plugin/51-a-plugin-id-is-a-slug/plan.md
---

# Check plugin/51 on Linux

plugin/51 is built, and its tests pass. Two checks in its final checklist need a running daemon and you. They need no other machine.

## Results so far

I ran these on a second daemon on 2026-10-20, built from `main` at `11f5efa6`, with its own config folder and port 39111.

- host/86, two automations with one schedule both run: pass. Both automations were due at 04:24, and each started a session of its own.
- plugin/51, the webhook plugin serves under its slug: pass. A call with the secret got 202 and fired its automation, and a wrong token got 401.
- plugin/51, a plugin named with a scope is skipped: pass. The daemon started, and `ahpd plugin list` shows `@acme/x` with "its name is not a slug".
- plugin/51, ahpw answers under its slug: the page part passes. `/plugins/web/` gives the page, and `/plugins/ahpd-web/` gives 404. The sign-in is the check below.
- plugin/51, an old owner reads back as a slug: not run. The echo agent forgets its sessions on a restart, so the check needs a session from a real agent.

## Set up

1. Run a daemon from `main` with the Claude agent.
2. Run `ahpd plugin install @ahpd/web`, then `ahpd restart`.

## plugin/51: an old owner reads back as a slug

1. Make a Claude session, and send it one short prompt.
2. Stop the daemon.
3. In that session's file in `<configDir>/sessions/`, set `"owner"` to `plugin:@ahpd/bot`.
4. Start the daemon.
5. Run `ahpc session show <uri> --json`.
6. Check that `_meta["ahpd.owner"]` reads `plugin:bot`.

## plugin/51: ahpw signs in under its slug

1. Open `http://127.0.0.1:<port>/plugins/web/` in a browser.
2. Sign in with the token.
3. Check that the page lists the sessions.

## Reply

Write "pass" for each section, or what you saw. A pass ticks the matching line in the plan.
