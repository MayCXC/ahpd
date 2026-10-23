---
title: Check each first Activepieces piece with a real account
plans:
  - plans/plugin/50-a-connector-plugin-runs-activepieces-pieces/plan.md
---

# Check each first Activepieces piece with a real account

Task 04 of plugin/50 ships Resend, Telegram and Slack as adapters, and the tests load each piece and check its adapter. A call to a real service needs a key and a receiving account, which the build machine does not have.

## Set up

1. Set the plugin's options to the three piece packages, in the daemon's configuration file.
2. Restart the daemon, and check its log names no piece error.
3. Check that a client lists the adapters `ap-resend`, `ap-telegram-bot` and `ap-slack`.

## Resend

1. Make a connector `mail` of `ap-resend`, with `secret_text` set to a Resend key that may send from a verified domain.
2. Bind `mail` to a bot, or to the session config key the session reads.
3. In a session, call `ap_resend_send_email` with `from`, `to`, `subject` and `content`.
4. Check that the mail arrives, and that the call answers the piece's id.

## Telegram

1. Make a connector `tg` of `ap-telegram-bot`, with `secret_text` set to a bot token from BotFather.
2. Send the bot one message, so that the chat exists.
3. In a session, call `ap_telegram_bot_send_text_message` with `chat_id` and `message`.
4. Check that the message arrives in the chat.

## Slack

1. Make a connector `work` of `ap-slack`, with `botToken` and `userToken` from a Slack app installed in the workspace.
2. Check that the app holds the `chat:write` scope, and that the bot is in the channel.
3. In a session, call `ap_slack_send_channel_message` with `channel` set to the channel id and `text` set to one line.
4. Check that the message arrives in the channel.

## A wrong key

1. Change the Resend connector's `secret_text` to a key that is not valid.
2. Call `ap_resend_send_email` again, and check that the answer is the piece's message about the key.
3. Check that the daemon log and the answer hold no key value.

## Reply

Write "pass" for each section, or what you saw.
