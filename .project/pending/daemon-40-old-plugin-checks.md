---
title: Check daemon/40 with a 0.13 plugin
plans:
  - plans/daemon/40-a-daemon-starts-with-no-backend/plan.md
---

# Check daemon/40 with a 0.13 plugin

daemon/40 is built, and its tests pass. This run checks the plan's final checklist on a real install before 0.14.1 is tagged.

## Set up

1. Make a temporary folder, and set `XDG_CONFIG_HOME`, `XDG_STATE_HOME` and `XDG_DATA_HOME` under it.
2. Install the 0.14.1 candidate of `@ahpd/server` with `npm i --prefix <folder>/server`.
3. Install `@ahpd/agent-claude@0.13.0` in the plugin root with `npm i --prefix`, and name it in `plugins`.
4. Use a port other than 37537, and remove the `CLAUDE*` and `ANTHROPIC*` variables with `env -u`.

## A daemon with a 0.13 plugin starts

1. Start the 0.14.1 daemon.
2. Check that it does not exit.
3. Check that the log refuses the plugin and names `ahpd plugin update all`.
4. Connect a client, and check that the agent list is empty.
5. Check that a session create is refused with `-32002`.

## A client moves the plugin

1. Call `x-ahpd/plugins/update` with the plugin's id, as a user with `plugin:install`.
2. Check that the answer has `from: 0.13.0` and a 0.14 `to`.
3. Check that the agent appears without a restart.
4. Stop the daemon by its pid.

## Reply

- Pass or fail for each section, with the log lines of a fail.
