---
title: A browser is sent a push
status: implemented
depends: [task-02-a-browser-registers-under-push.md]
layer: push
refs:
  - "[code://packages/push/src/send.ts#L28-L78](../../../../packages/push/src/send.ts#L28-L78) - `PushMessage` and `Sender`"
  - "[code://packages/push/src/send.ts#L132-L141](../../../../packages/push/src/send.ts#L132-L141) - `refused`"
  - "[code://packages/push/src/plugin.ts#L97-L134](../../../../packages/push/src/plugin.ts#L97-L134) - `tokenNow`, the sender and `notify`"
  - "[code://packages/push/package.json#L80-L86](../../../../packages/push/package.json#L80-L86) - `optionsSchema`"
  - https://www.rfc-editor.org/rfc/rfc8291.html - sections 3 and 4, and appendix A
  - https://www.rfc-editor.org/rfc/rfc8292.html - sections 2 and 3
  - https://www.rfc-editor.org/rfc/rfc8030.html - sections 5.2 to 5.4 and 7.3
---

## Objective

`notify` sends to each web device through a web sender, and to each Expo device through the Expo sender.
The web sender encrypts with RFC 8291 `aes128gcm` and signs with VAPID ES256, with `node:crypto` only.
A push service that answers 404 or 410 removes the device.

## Files

- `CREATE: packages/push/src/webpush.ts` - `encrypt`, `vapidHeader` and `createWebSender`.
- `UPDATE: packages/push/src/plugin.ts:97-134` - make the web sender, and dispatch each device by platform.
- `UPDATE: packages/push/src/provider.ts:217-244` - refuse an endpoint whose host is not in `webPushHosts`.
- `UPDATE: packages/push/package.json:80-86` - add the `webPushHosts` and `contact` options.
- `UPDATE: packages/push/i18n/es.json` - the option descriptions.
- `UPDATE: packages/push/i18n/pt.json` - the option descriptions.
- `CREATE: packages/push/test/webpush.test.ts` - the RFC vector, the headers and the answers.

## Steps

1. In `encrypt`, derive the keys with `createECDH('prime256v1')` and `hkdfSync('sha256', ...)`, as RFC 8291 section 3.4 says.
2. Build the body as RFC 8291 section 4 says: the salt, the record size, the key id and one record.
3. Encrypt the record with `aes-128-gcm`, with the padding delimiter `0x02`.
4. Accept `salt` and the sender's key pair as parameters, so a test can give the vector's values.
5. In `vapidHeader`, sign `{ aud, exp, sub? }` with ES256 and `dsaEncoding: 'ieee-p1363'`.
6. Set `aud` to the endpoint's origin and `exp` to 12 hours from now.
7. POST to the endpoint with `Content-Encoding: aes128gcm`, `TTL: 86400`, `Urgency` and `Topic`.
8. Set `Urgency` to `high` for a wait and `normal` for a finished turn.
9. Set `Topic` to the first 32 base64url characters of the SHA-256 hash of the session URI.
10. Send the payload `{ title, body, data }` as JSON.
11. Call `gone(id)` on a 404 or a 410, and log any other answer that is not 2xx.
12. Never throw from a send; log the failure, as the Expo sender does.
13. In `deviceOf`, refuse an endpoint whose host does not match `webPushHosts`, with `-32602`.
14. Match a pattern `*.<domain>` to every host that ends with `.<domain>`.
15. In `notify`, send Expo devices through `sender` and web devices through the web sender.
16. Add a test that `encrypt` matches the body of RFC 8291 appendix A.
17. Add a test that the JWT verifies with the public key and has the right `aud`.
18. Add tests for the headers, a 410 that removes the device and a 500 that keeps it.
19. Add a test that `deviceOf` refuses an endpoint on another host.

## Validation

- `packages/push/test/webpush.test.ts` passes, with the RFC 8291 vector.
- `node scripts/boundary.mjs` reports no new dependency for `@ahpd/push`.
- `pnpm typecheck` is clean.
