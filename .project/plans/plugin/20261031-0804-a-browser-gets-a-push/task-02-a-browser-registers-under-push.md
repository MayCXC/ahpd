---
title: A browser registers under push
status: todo
depends: [task-01-a-device-hears-its-persons-sessions.md]
layer: push
refs:
  - "[code://packages/push/src/provider.ts#L40-L49](../../../../packages/push/src/provider.ts#L40-L49) - the registration manifest"
  - "[code://packages/push/src/provider.ts#L105-L125](../../../../packages/push/src/provider.ts#L105-L125) - `placeOf` and `shownOf`"
  - "[code://packages/push/src/provider.ts#L150-L160](../../../../packages/push/src/provider.ts#L150-L160) - `deviceStore`, the file pattern for `push-vapid.json`"
  - https://www.rfc-editor.org/rfc/rfc8292.html - VAPID, sections 2 and 3.2
---

## Objective

A browser writes its subscription to `push://devices/<id>` with `platform: 'web'`.
A browser reads the host's VAPID public key from `push://vapid` before it subscribes.

## Files

- `CREATE: packages/push/src/vapid.ts` - the key pair in `push-vapid.json`, made at the first load, and the public key as base64url.
- `UPDATE: packages/push/src/provider.ts:40-49` - the manifest names the web body.
- `UPDATE: packages/push/src/provider.ts:52-72` - `Device` becomes an Expo device or a web device.
- `UPDATE: packages/push/src/provider.ts:105-143` - `placeOf` knows `vapid`; `shownOf` hides `endpoint` and `keys`; `kept` reads a web device.
- `UPDATE: packages/push/src/provider.ts:217-244` - `deviceOf` accepts the web body.
- `UPDATE: packages/push/src/provider.ts:250-341` - `list`, `resolve` and `read` serve `push://vapid`; `write` and `remove` refuse it.
- `UPDATE: packages/push/src/plugin.ts` - load the key pair and hand it to the provider.
- `UPDATE: packages/push/test/provider.test.ts` - add the cases of this task.
- `CREATE: packages/push/test/vapid.test.ts` - the key file cases.

## Steps

1. Generate a P-256 key pair with `generateKeyPairSync('ec', { namedCurve: 'prime256v1' })`.
2. Write it to `join(host.configDir, 'push-vapid.json')` with `writeJsonAtomic`, mode `0600`.
3. Read the file at load, and make a new pair only when the file is absent.
4. Log one line and skip every web device when `readJsonObject` fails on the file.
5. Export the public key as the 65-octet uncompressed point, in base64url.
6. Accept a web body: a `https:` `endpoint`, and `keys.p256dh` and `keys.auth` in base64url.
7. Refuse a web body whose `p256dh` is not 65 octets or whose `auth` is not 16 octets, with `-32602`.
8. Serve `push://vapid` as a file whose content is `{ "publicKey": "<base64url>" }`.
9. List `vapid` beside `devices` under `push://`.
10. Refuse a write or a remove of `push://vapid` with `-32602`.
11. Add tests for a web write, a read without `endpoint` and `keys`, and the bad bodies.
12. Add tests that the key file is `0600` and that a second load keeps the same key.

## Validation

- `packages/push/test/provider.test.ts` and `vapid.test.ts` pass.
- A daemon with the plugin answers `resourceRead push://vapid` with the public key.
