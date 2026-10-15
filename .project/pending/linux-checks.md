---
title: Check host/86 and plugin/51 on Linux
plans:
  - plans/host/86-every-automation-due-at-once-fires/plan.md
  - plans/plugin/51-a-plugin-id-is-a-slug/plan.md
---

# Check host/86 and plugin/51 on Linux

Both plans are built, and their tests pass. Each has checks in its final checklist that need a running daemon. They need no other machine.

## Set up

1. Clone `git@github.com:softov/ahpd.git` at `main`, then run `pnpm install` and `pnpm build`.
2. Write a token to a file: `echo chk-token > /tmp/ahpd-token`.
3. Use a config folder of its own: `export XDG_CONFIG_HOME=/tmp/ahpd-chk`.
4. Run `ahpd paths add <folder>`, then add `<clone>/packages/agent-claude/dist/index.js` to `"plugins"` in `/tmp/ahpd-chk/ahpd/config.json`.
5. Run `ahpd start --port 39111 --connection-token-file /tmp/ahpd-token`.

Below, `ahpd` means `node packages/server/dist/main.js`.

## host/86: two automations with one schedule both run

1. Make two automations with the same schedule, two minutes from now, and different prompts.
2. Wait until that minute passes.
3. Check that each automation has one new run, and that each run has its own session.

## plugin/51: the webhook plugin serves under its slug

1. Add `<clone>/packages/webhook/dist/index.js` to `"plugins"`, and run `ahpd restart`.
2. Write one endpoint as `/tmp/ahpd-chk/ahpd/webhooks/chk.md`, with `automation: true` and a `secret`, as [WEBHOOKS.md](../../docs/plugins/WEBHOOKS.md) shows.
3. Send a `POST` to `http://127.0.0.1:39111/plugins/webhook/chk` with that secret as the bearer token.
4. Check that the call is answered, and that it is not a 404.

## plugin/51: a plugin named with a scope is skipped

1. Write a plugin file that exports `name = '@acme/x'`, and add its path to `"plugins"`.
2. Run `ahpd restart`.
3. Check that the daemon starts, and that `ahpd plugin list` shows a problem line that names the slug rule.

## plugin/51: an old owner reads back as a slug

1. Stop the daemon.
2. In one saved session file, set the owner to `plugin:@ahpd/bot`.
3. Start the daemon, and open that session.
4. Check that its owner reads `plugin:bot`.

## plugin/51: ahpw answers under its slug

1. Run `ahpd plugin install @ahpd/web`, then `ahpd restart`.
2. Open `http://127.0.0.1:39111/plugins/web/` and sign in with the token.
3. Check that the page loads, and that it lists the sessions.

## Reply

Write "pass" for each section, or what you saw. A pass ticks the matching line in the plan.
