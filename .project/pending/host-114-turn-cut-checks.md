---
title: Check the 50-turn cut in a VS Code window
plans:
  - plans/host/114-a-subscribe-with-no-view-gets-every-turn/plan.md
---

# Check the 50-turn cut in a VS Code window

host/114 says that ahpd sends only the newest 50 turns of a chat when a subscribe names no `view`. The protocol says that a host must send every turn it keeps. This check shows what a VS Code 1.143 window gets from ahpd at `main`, before the fix. Use VS Code 1.143.0 or later.

## Set up

1. Clone `git@github.com:softov/ahpd.git` at `main`, then run `pnpm install` and `pnpm build`.
2. Write a token to a file: `echo chk-token > /tmp/ahpd-token`.
3. Use a config folder of its own: `export XDG_CONFIG_HOME=/tmp/ahpd-chk`.
4. Run `ahpd paths add <folder>`, where `<folder>` has a Claude session with more than 50 turns.
5. Add `<clone>/packages/agent-claude/dist/index.js` to `"plugins"` in `/tmp/ahpd-chk/ahpd/config.json`.
6. Run `ahpd start --port 39111 --connection-token-file /tmp/ahpd-token --wire /tmp/ahpd-wire.jsonl`.
7. In VS Code's `settings.json`, set `"chat.remoteAgentHostsEnabled": true`.
8. Add `{ "name": "ahpd", "address": "ws://127.0.0.1:39111", "connectionToken": "chk-token" }` to `"chat.remoteAgentHosts"`.
9. Reload the window, and check that ahpd shows in the Chat view.

Below, `ahpd` means `node packages/server/dist/main.js`.

## A session that is not running

1. Open the long Claude session from the session list. Do not send a turn.
2. Scroll to the top of the chat.
3. Write down the first message that the window shows.
4. Check whether it is the first message of the session, or a message near the 50th turn from the end.
5. Check whether the window offers a way to load older turns.
6. Run `jq -c 'select(.result.snapshot.state.turns != null) | {turns: (.result.snapshot.state.turns | length), cursor: .result.snapshot.state.turnsNextCursor, bytes: ._ahpLog.byteLength}' /tmp/ahpd-wire.jsonl`.
7. Write down the number of turns, the cursor and the bytes of the chat snapshot.
8. If `jq` shows no line for the chat, the capture cut the line. Then write down `_ahpLog.byteLength` of the subscribe answer.

## The same session after a turn

1. Send one short turn to the same session, for example "say ok".
2. Wait for the answer, then reload the window.
3. Open the session again, and scroll to the top of the chat.
4. Do steps 3 to 8 of the section above again.

## Reply

For each of the two sections, write the first message shown, and the turns, cursor and bytes of the snapshot. Write "no cut" if the window shows the first message of the session both times. The reply goes into the Resume of task 01 in the plan.
