---
title: A browser gets a push
created: 2026-10-31
refs:
  - git://4e122781 - the commit of ahpd the facts were checked at
  - git://f51fbcbf - the commit of ahpw the facts were checked at
  - git://623fc9a4 - the commit of ahpapp the facts were checked at
  - git://171e90619c7 - the commit of VS Code the facts were checked at
  - "[code://packages/push/src/plugin.ts#L21-L24](../../packages/push/src/plugin.ts#L21-L24) - why the text of a notification is thin"
  - "[code://packages/push/src/plugin.ts#L44-L54](../../packages/push/src/plugin.ts#L44-L54) - the waits that send, the three texts, and the prefix of a worker's chat"
  - "[code://packages/push/src/plugin.ts#L85-L95](../../packages/push/src/plugin.ts#L85-L95) - `audience`, the devices whose client created or opened a session"
  - "[code://packages/push/src/plugin.ts#L114-L134](../../packages/push/src/plugin.ts#L114-L134) - `notify`, which makes one Expo message per device"
  - "[code://packages/push/src/plugin.ts#L136-L176](../../packages/push/src/plugin.ts#L136-L176) - the host events the plugin listens to"
  - "[code://packages/push/src/provider.ts#L40-L72](../../packages/push/src/provider.ts#L40-L72) - the registration body and `Device`, with `platform` fixed to `ios` or `android`"
  - "[code://packages/push/src/provider.ts#L128-L143](../../packages/push/src/provider.ts#L128-L143) - `kept`, which drops a stored device of another platform"
  - "[code://packages/push/src/provider.ts#L209-L244](../../packages/push/src/provider.ts#L209-L244) - `PushProvider` and `deviceOf`, which refuses a platform that is not `ios` or `android`"
  - "[code://packages/push/src/provider.ts#L313-L324](../../packages/push/src/provider.ts#L313-L324) - `write`, which stores the device with the id of the client that wrote it"
  - "[code://packages/push/src/send.ts#L28-L46](../../packages/push/src/send.ts#L28-L46) - the Expo endpoint and `PushMessage`"
  - "[code://packages/push/src/send.ts#L69-L78](../../packages/push/src/send.ts#L69-L78) - `Sender`, the one send seam"
  - "[code://packages/push/src/send.ts#L132-L141](../../packages/push/src/send.ts#L132-L141) - `refused`, which removes a device that Expo says is not registered"
  - "[code://packages/push/package.json#L60-L86](../../packages/push/package.json#L60-L86) - no runtime dependency, and the two options"
  - "[code://packages/sdk/src/types/resources.ts#L250-L257](../../packages/sdk/src/types/resources.ts#L250-L257) - `SchemeDescription`, which has a title, a description and a manifest only"
  - file:///github/ahpd/.project/plans/plugin/33-a-phone-hears-a-session-needs-a-person/plan.md - the plan that built the push plugin
  - file:///github/ahpapp/src/push.ts - how ahpapp registers its Expo token, at 623fc9a4, lines 100-125
  - file:///github/ahpw/src/shell/notify/browser-channel.ts - ahpw's page notifications, at f51fbcbf
  - file:///github/ahpw/src/shell/notify/index.ts - the command that asks for notification permission, at f51fbcbf, lines 36-64
  - file:///github/ahpw/src/bridges/offers.ts - how ahpw reads `ahpd.resourceProviders`, at f51fbcbf, lines 66-81
  - file:///github/ahpw/plugin/index.ts - the daemon serves ahpw under `/plugins/web/`, at f51fbcbf, lines 5-30
  - https://www.rfc-editor.org/rfc/rfc8030.html - Web Push protocol, sections 5.2 to 5.4 and 7.3
  - https://www.rfc-editor.org/rfc/rfc8291.html - message encryption, sections 1 to 4
  - https://www.rfc-editor.org/rfc/rfc8292.html - VAPID, sections 2 to 4
  - https://www.w3.org/TR/push-api/ - the Push API, sections 3.4.1, 7.1, 8 and 10.4
  - https://developer.mozilla.org/en-US/docs/Web/API/Push_API - a push reaches a service worker when the page is not loaded
  - https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API - a service worker needs a secure context
  - https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable - the manifest members an installable web app needs
  - https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers - Web Push in Safari and in iOS Home Screen web apps
  - https://nodejs.org/api/crypto.html - `node:crypto`, which has ECDH on P-256, HKDF, AES-128-GCM and ES256 signatures
---

# A browser gets a push

Softov wants web push.
ahpw is the browser client of ahpd.
When its tab is closed, ahpw gets no notification from ahpd.
The ahpapp mobile app gets one through Expo today.
Softov wants ahpw to get the same notifications through the browser's Web Push service.
The host side is built first, so this brief is in ahpd, and it covers the ahpw side too.

## What others do

### The standards

- A push reaches a service worker when the page is not in the foreground or not loaded (MDN, Push API).
- The worker gets a `push` event and shows the notification with `ServiceWorkerRegistration.showNotification()`.
- A service worker needs a secure context: HTTPS, or `http://localhost` (MDN, Service Worker API).
- The browser makes a subscription with `PushManager.subscribe()` on a service worker registration (Push API 7.1).
- A subscription belongs to one service worker registration (Push API 3.4.1).
- `toJSON()` of a subscription gives `endpoint`, `expirationTime` and `keys`, with `keys.p256dh` and `keys.auth` (Push API 8).
- `subscribe()` with an `applicationServerKey` that differs from the one of the existing subscription fails with `InvalidStateError` (Push API 7.1).
- The browser fires `pushsubscriptionchange` when a subscription changes outside the application's control (Push API 10.4).

### The host side

- The host keeps a VAPID key pair on P-256 (RFC 8292 section 2).
- The browser gets the public key as `applicationServerKey` when it subscribes (Push API 7.1, RFC 8292 section 4.1).
- Each send carries `Authorization: vapid t=<JWT>, k=<public key>`.
  The JWT is ES256. Its `aud` is the origin of the endpoint, and its `exp` is at most 24 hours ahead (RFC 8292 sections 2 and 3).
- The host encrypts each message with RFC 8291 and the `aes128gcm` content coding.
  It uses ECDH on P-256 with the subscription's `p256dh`, the 16-octet `auth` secret and HKDF with SHA-256 (RFC 8291 sections 2 and 3).
- RFC 8291 section 1 says the message is "secured against inspection, modification, and forgery by a push service".
  The push service still sees which server talks to which browser (RFC 8291 section 7).
- A push service must accept a body of 4096 octets and need not accept more (RFC 8291 section 4).
- Each send must have a `TTL` header in seconds (RFC 8030 section 5.2).
- `Urgency` is `very-low`, `low`, `normal` or `high`, and `normal` is the default (RFC 8030 section 5.3).
- A message with a `Topic` replaces a waiting message with the same topic (RFC 8030 section 5.4).
- A push service answers 404 for an expired subscription (RFC 8030 section 7.3).

### Safari and iOS

- Web Push works in Home Screen web apps on iOS 16.4 or later, and in Safari 16 on macOS 13 or later (Apple).
- The permission comes from a gesture, and the subscribe call runs in that gesture's event handler (Apple).
- Safari does not support invisible push. A worker that shows no notification makes Safari revoke the permission (Apple).
- Apple's push endpoints are under `https://*.push.apple.com` (Apple).
- An installable web app needs a manifest with `name` or `short_name`, `icons`, `start_url` and `display` (MDN, for Chromium browsers).

### VS Code

- VS Code at `171e90619c7` has no Web Push code. `PushManager` and `applicationServerKey` occur only in two test data files.

## What ahpd and ahpw have today

### How a device registers

- `@ahpd/push` serves the `push` scheme. A device is a record at `push://devices/<install id>`, written with `resourceWrite` and removed with `resourceDelete`.
- The body is `token`, `platform` and an optional `lang`, as [`code://packages/push/src/provider.ts#L40-L49`](../../packages/push/src/provider.ts#L40-L49) says.
  `token` is "The Expo push token this device answers to".
- `platform` is fixed to `ios` or `android`.
  [`code://packages/push/src/provider.ts#L236-L238`](../../packages/push/src/provider.ts#L236-L238) refuses another value, and [`code://packages/push/src/provider.ts#L134`](../../packages/push/src/provider.ts#L134) drops a stored device of another platform.
- `write` stores the device with the id of the client that wrote it, from the connection and not from the body ([`code://packages/push/src/provider.ts#L313-L324`](../../packages/push/src/provider.ts#L313-L324)).
- The devices are one file, `push-devices.json`, in the daemon's configuration folder ([`code://packages/push/src/provider.ts#L153-L154`](../../packages/push/src/provider.ts#L153-L154)).

ahpapp registers in `writeToken` at `src/push.ts` lines 100-115.
It writes this body to `push://devices/<install id>` on channel `ahp-root://`:

```ts
data: JSON.stringify({ token, platform, lang }),
```

It writes again on each connect and when the token changes, and removes the record when the switch is off (lines 144-191).
It finds the host's `push` root in `ahpd.resourceProviders` (lines 42-45).

### What sends a push

- A device hears only about the sessions that its client created or opened, from `session_start` and `session_opened` ([`code://packages/push/src/plugin.ts#L85-L95`](../../packages/push/src/plugin.ts#L85-L95)).
- `input_needed_set` sends when the kind is `chatInput`, `toolConfirmation` or `toolAuthentication`, once per pair of session and id ([`code://packages/push/src/plugin.ts#L150-L156`](../../packages/push/src/plugin.ts#L150-L156)).
- `turn_end` sends when the status is `complete` and the chat is not a worker's chat, `ahp-chat://subagent/` ([`code://packages/push/src/plugin.ts#L163-L166`](../../packages/push/src/plugin.ts#L163-L166)).
- `input_needed_removed` sends nothing and forgets the pair.

### What a push holds

- The title is the `title` option, or the host's name.
- The body is one of three texts: "A session is waiting for your approval", "A session is waiting for your answer" or "A session finished".
- `data` is `{ uri: <session>, kind }`, and only the app reads it.
- The text is thin on purpose. [`code://packages/push/src/plugin.ts#L21-L24`](../../packages/push/src/plugin.ts#L21-L24) says it "passes through Expo's service and a phone's lock screen, and neither is where a prompt belongs".

### How it sends

- `createSender` posts batches of up to 100 messages to `https://exp.host/--/api/v2/push/send`, with an optional bearer `accessToken` ([`code://packages/push/src/send.ts#L28-L34`](../../packages/push/src/send.ts#L28-L34)).
- It reads the receipts of the last send before the next send, and never on a timer.
- A `DeviceNotRegistered` answer removes the device ([`code://packages/push/src/send.ts#L132-L141`](../../packages/push/src/send.ts#L132-L141)).
- `@ahpd/push` has no runtime dependency, only the `@ahpd/sdk` peer.

### Is there a seam for a second push service

No.
`PushProvider` is a resource provider for the `push` scheme, not a push service interface:

```ts
export interface PushProvider extends ResourceProvider {
  list(uri: string): Promise<Entry[]>;
  resolve(uri: string, followSymlinks?: boolean): Promise<Metadata>;
  read(uri: string, wanted?: string): Promise<Read>;
  write(uri: string, content: Write, owner?: Owner, client?: string, reader?: Principal): Promise<void>;
  remove(uri: string, recursive?: boolean, owner?: Owner, reader?: Principal): Promise<void>;
  describe(): SchemeDescription;
}
```

The send seam is `Sender`, with one method `send(messages: PushMessage[], accessToken?: string)` ([`code://packages/push/src/send.ts#L69-L78`](../../packages/push/src/send.ts#L69-L78)).
`PushMessage` is Expo's shape: `to`, `title`, `body` and `data`.
`notify` builds that shape for every device and calls the one Expo sender ([`code://packages/push/src/plugin.ts#L127-L133`](../../packages/push/src/plugin.ts#L127-L133)).
So the trigger and the audience are shared code, and the device record and the sender are Expo only.

### ahpw today

- ahpw has no service worker, no web app manifest and no `public/` folder at `f51fbcbf`.
- `src/shell/notify/browser-channel.ts` shows page notifications with `new window.Notification(...)`, only while the tab is open and hidden, or unfocused for 60 seconds.
- The command `notifications.enableAlerts` asks for the permission from the command palette (`src/shell/notify/index.ts` lines 36-64).
- `src/bridges/offers.ts` reads `ahpd.resourceProviders`, so ahpw can find the `push` root as ahpapp does.
- ahpw connects to several hosts through `MultiHostClient` (`src/bridges/data.ts`).
- The daemon serves ahpw under `/plugins/web/` (`plugin/index.ts`), and `ahpw serve` serves it on `127.0.0.1:5190` by default (`cli/serve.ts`).
- `SchemeDescription` has a title, a description and a manifest only ([`code://packages/sdk/src/types/resources.ts#L250-L257`](../../packages/sdk/src/types/resources.ts#L250-L257)).
  The `push` scheme has no place today for the VAPID public key that a browser needs.

### Encryption in ahpd

- No ahpd package depends on a Web Push package.
- `jose` is in the lockfile only through `@modelcontextprotocol/sdk`. It signs a JWT and does not do RFC 8291 encryption.
- `node:crypto` on Node 24.19 has `createECDH`, `hkdfSync`, the `aes-128-gcm` cipher, the `prime256v1` curve and 64-octet `ieee-p1363` ECDSA signatures.
  These are the parts of VAPID and RFC 8291.

## Who writes

- `packages/push` in ahpd: no worktree and no unmerged remote branch changes it at `4e122781`.
  The worktrees are `agent-reload`, `build-agents-fda88f4a`, `release-prerelease`, `review-maycxc-union`, `skills-file` and `vm`, and none has uncommitted changes there.
- ahpw: no worktree and no unmerged remote branch changes `src/shell/notify/`, `index.html`, `vite.config.ts`, `plugin/static.ts` or a `public/` folder at `f51fbcbf`.
  The worktree `ahpw-custom-kinds` is at `f51fbcbf` with no change to these files.

## The change

### ahpd

- The `push` scheme takes a browser device. Its body is the subscription: `endpoint`, `keys.p256dh` and `keys.auth`, with a platform for the web.
- The host keeps one VAPID key pair, and a browser can read the public key before it subscribes.
- A web sender encrypts each message with RFC 8291 and posts it to the device's endpoint with a VAPID header and a `TTL`.
- `notify` sends to Expo devices through the Expo sender and to browser devices through the web sender.
  The events, the audience and the once-per-pair rule stay as they are.
- A 404 from a push service removes the device, as `DeviceNotRegistered` does for Expo.

### ahpw

- ahpw gets a service worker that shows a notification on each `push` event and opens the session from `data.uri` on a click.
- ahpw subscribes from a user gesture, with the host's VAPID public key, and writes the subscription to `push://devices/<install id>` on each host that serves `push`.
- ahpw writes again on each connect and on `pushsubscriptionchange`, and removes the record when the person turns push off.
- ahpw gets a web app manifest, so iOS can add it to the Home Screen.

## Open points

- Whether a Web Push message carries more text than an Expo message.
  RFC 8291 keeps the payload from the push service, so the reason in [`code://packages/push/src/plugin.ts#L21-L24`](../../packages/push/src/plugin.ts#L21-L24) holds only for the lock screen.
  A body of up to 4096 octets could carry the question or the session title.
- Encryption: a new npm dependency for Web Push, or `node:crypto` in `@ahpd/push`. A new dependency is Softov's call.
- Where the VAPID private key is kept: a file in the configuration folder beside `push-devices.json`, or the host's secret store.
- Where the browser reads the VAPID public key: a field of the `push` scheme in `ahpd.resourceProviders`, or a record such as `push://key`.
- One host per service worker registration: a subscription has one `applicationServerKey`, and ahpw connects to several hosts.
  ahpw needs either one registration per host, with its own scope, or one key shared by the hosts.
- Which `platform` value names a browser, and whether `lang` stays.
- Which `Urgency`, `TTL` and `Topic` a send uses. A `Topic` per session would replace a waiting push for the same session.
- Not checked: whether `clientId` of ahpw's `MultiHostClient` stays the same after the tab is closed and opened again.
  A device matches a session through that id.
- Not checked: whether a page under `/plugins/web/` can register a service worker whose scope covers the page, and which headers `plugin/static.ts` sends for it.
- Not checked: how a person reaches ahpw over HTTPS on a remote host, which a service worker needs.
- Not checked: whether iOS needs more manifest members than the Chromium list in MDN.
