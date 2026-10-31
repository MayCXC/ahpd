---
title: Check that a browser gets a push
plans:
  - plans/plugin/20261031-0804-a-browser-gets-a-push/plan.md
---

# Check that a browser gets a push

The plan `plugin/20261031-0804-a-browser-gets-a-push` is implemented, and its tests pass. The RFC 8291 vector and the request the sender makes are checked in the push suite. These checks need a real browser, a real push service and a test ahpd under XDG scratch directories.

## Set up

1. Start a test ahpd from the merged tree, with `XDG_CONFIG_HOME` and `XDG_DATA_HOME` set to scratch folders, and `@ahpd/push` loaded.
2. Read `push://vapid` and keep the `publicKey`, which the subscription needs as `applicationServerKey`.
3. Open ahpw from that ahpd in Chrome, and allow notifications.

## Steps

1. In Chrome, subscribe with the key from `push://vapid`. Write the subscription to `push://devices` with `platform: "web"`, its `endpoint` and its `keys`.
2. Start a session in another client of the same person, and leave a request waiting. Close the Chrome tab. Expect a notification on the desktop, and a click that opens that session.
3. Close the tab again, then finish a turn. Expect `A session finished` with normal urgency. A desktop that coalesces the two should still show the latest.
4. Repeat steps 1 to 3 in Firefox, against `updates.push.services.mozilla.com`.
5. Delete `push://devices/<id>` or let the browser unsubscribe. Send again. Expect the send to log a 404 or a 410, and the device to disappear from `push://devices`.
6. Write a device whose endpoint is `https://example.invalid/x`. Expect the provider to refuse it `-32602`.

## The Apple question

1. Open ahpw in Safari on macOS, and subscribe. Safari passes the endpoint through Apple's push service.
2. Send a notification with no `contact` option set, and read the daemon log. Expect either a delivery, or a 403 that names the `sub` claim.
3. If Apple refuses it, set `contact` to a `mailto:` and send again. Expect delivery. If it does, `contact` needs a default in the plugin, and the plan says so in its watch-out.

## Reply

- Write "ok", or what went wrong at which step, and the log line Safari's push service gave.
