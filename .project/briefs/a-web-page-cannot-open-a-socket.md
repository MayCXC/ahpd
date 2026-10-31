---
title: A web page cannot open a socket
created: 2026-10-31
refs:
  - git://4e122781 - the commit of ahpd the facts were checked at
  - git://171e90619c7 - the commit of VS Code the facts were checked at
  - git://f51fbcb - the commit of ahpw the facts were checked at
  - "[code://packages/sdk/src/listen.ts#L143-L178](../../packages/sdk/src/listen.ts#L143-L178) - `doorOf`, which admits every upgrade when there is no token and never reads `Origin`"
  - "[code://packages/sdk/src/listen.ts#L229-L243](../../packages/sdk/src/listen.ts#L229-L243) - the Bun branch, where the upgrade is decided on a `Request`"
  - "[code://packages/sdk/src/listen.ts#L301-L307](../../packages/sdk/src/listen.ts#L301-L307) - the Deno branch, where the upgrade is decided on a `Request`"
  - "[code://packages/sdk/src/listen.ts#L369-L421](../../packages/sdk/src/listen.ts#L369-L421) - the Node branch: `verifyClient` decides the upgrade, and the socket gets no `error` listener"
  - "[code://packages/sdk/src/listen.ts#L677-L680](../../packages/sdk/src/listen.ts#L677-L680) - `NodeRequest`, whose type names only the `authorization` header"
  - "[code://packages/sdk/src/types/listen.ts#L181-L209](../../packages/sdk/src/types/listen.ts#L181-L209) - `DoorOptions` and `Door`, which take a URL and an authorization and nothing else"
  - "[code://packages/server/src/commands/options.ts#L1294-L1330](../../packages/server/src/commands/options.ts#L1294-L1330) - `secret`, which decides when the daemon runs with no token"
  - "[code://packages/server/src/commands/options.ts#L538-L541](../../packages/server/src/commands/options.ts#L538-L541) - `withoutConnectionToken`, which accepts any connection on any bind"
  - "[code://packages/server/src/commands/options.ts#L557-L562](../../packages/server/src/commands/options.ts#L557-L562) - `origins`, the extra origins a deployment names"
  - "[code://packages/server/src/commands/configure.ts#L354-L366](../../packages/server/src/commands/configure.ts#L354-L366) - `ahpd configure`, whose default answer writes a token"
  - "[code://packages/server/src/commands/configure.ts#L472-L481](../../packages/server/src/commands/configure.ts#L472-L481) - `offerConfigure`, which asks only when there is no configuration file and a terminal"
  - "[code://packages/server/src/commands/run.ts#L107-L123](../../packages/server/src/commands/run.ts#L107-L123) - `apiOrigins`, the allow list of the HTTP API"
  - "[code://packages/server/src/commands/run.ts#L633-L648](../../packages/server/src/commands/run.ts#L633-L648) - the `DoorOptions` the daemon builds, with no token when `secret` gives none"
  - "[code://packages/server/src/commands/run.ts#L1768-L1778](../../packages/server/src/commands/run.ts#L1768-L1778) - the daemon's `listen` call, which spreads that door"
  - "[code://packages/server/src/http.ts#L91-L125](../../packages/server/src/http.ts#L91-L125) - `foreign`, `originRefusal` and `apiHandler`: the `Origin` check of the HTTP API"
  - "[code://packages/sdk/src/host/admission.ts#L353-L363](../../packages/sdk/src/host/admission.ts#L353-L363) - `admit`, which passes every command on a host with no user directory"
  - "[code://packages/sdk/src/host/gate.ts#L38-L86](../../packages/sdk/src/host/gate.ts#L38-L86) - `NEEDS`, with `resourceWrite`, `createSession` and `createTerminal`"
  - "[code://docs/sdk/AUTHENTICATION.md#L34](../../docs/sdk/AUTHENTICATION.md#L34) - the docs say loopback with no token needs no secret"
  - "[code://docs/server/CONNECT.md#L43](../../docs/server/CONNECT.md#L43) - the docs tell VS Code that a loopback host with no token needs no token"
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/agentHostServerMain.ts#L146-L149 - VS Code's agent host makes a random token when none is given
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/agentHostServerMain.ts#L310-L315 - the server checks a token only when there is one
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/webSocketTransport.ts#L170-L188 - `verifyClient` checks the `tkn` query and reads no `Origin`
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/webSocketTransport.ts#L73-L76 - an `error` listener on each socket
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/node/webSocketTransport.ts#L218-L224 - a connection with no token is not marked authenticated
  - https://github.com/microsoft/vscode/blob/171e90619c7/src/vs/platform/agentHost/browser/webSocketClientTransport.ts#L178-L180 - VS Code opens its socket with the window's `WebSocket`
  - https://github.com/microsoft/agent-host-protocol/blob/1ef06429/docs/specification/transport.md#L40-L42 - AHP puts access to the endpoint in the transport handshake
  - https://www.rfc-editor.org/rfc/rfc6455#section-10.2 - RFC 6455 Origin Considerations, checked 2026-10-31
  - https://fetch.spec.whatwg.org/#origin-header - Fetch appends `Origin` to every request whose mode is `websocket`, checked 2026-10-31
  - https://developer.chrome.com/blog/local-network-access - Chrome's Local Network Access, which replaces Private Network Access and does not gate WebSockets yet, checked 2026-10-31
  - npm://ws@8.21.3 - the WebSocket server of the Node branch, which hands `origin` to `verifyClient`
  - file:///github/ahpw/cli/proxy.ts - `ahpw serve`, which checks `Origin` itself and forwards none
  - file:///github/ahpw/vite.config.ts - the ahpw dev server, whose socket proxy forwards the browser's `Origin`
  - file:///github/ahpw/src/bridges/socket.ts - `socketUrl`, the page's socket on the host that served it
---

# A web page cannot open a socket

Softov wants to close a security gap on the daemon's WebSocket port.
When ahpd runs with no connection token, `doorOf` admits every WebSocket upgrade and never reads the `Origin` header.
So any web page that the person opens can open a socket to a local ahpd and drive its sessions.
The `Origin` check exists only on the HTTP API.
The goal is that a socket from a page of another site is refused at the handshake, and that ahpd's own clients still connect.

## What others do

### The standards

- RFC 6455 section 10.2: a server that takes input only from some sites SHOULD verify the `Origin` field.
  It SHOULD answer an unacceptable origin with 403 Forbidden.
- The same section says the `Origin` field protects against a script in a trusted browser.
  It does not stop a client that is not a browser.
- The Fetch standard appends `Origin` to every request whose mode is `websocket`. A browser page cannot leave it out.
- The WebSocket handshake has no CORS check. The page gets the socket when the server answers 101.
- Chrome's Local Network Access asks the person before a site reaches the local machine, from Chrome 142. It replaces Private Network Access.
- Local Network Access does not gate WebSocket connections yet, so Chrome does not block a page's socket to loopback today.

### VS Code's agent host

- The standalone server makes a random token when none is given, with the comment "secure by default". `--without-connection-token` turns it off.
- `verifyClient` checks the `tkn` query parameter and answers 403 for a bad token. It reads no `Origin`, and the file has no `Origin` check.
- With no token, the server sets no `verifyClient` and admits every upgrade. Such a connection is not marked authenticated, and only loses the TCP channel.
- Each socket has an `error` listener, which closes the transport.
- So VS Code protects its socket with a token by default, not with an `Origin` check.

### The AHP spec

- Access to the endpoint is a transport concern. A server SHOULD gate it in the transport handshake, for example in the WebSocket upgrade request.
- The spec names no `Origin` rule.

## What ahpd has today

### When there is no token

The daemon has no token in these cases, from `secret` in [`code://packages/server/src/commands/options.ts#L1294-L1330`](../../packages/server/src/commands/options.ts#L1294-L1330):

| Case | Bind | Source |
|---|---|---|
| `--without-connection-token` or `withoutConnectionToken: true` | any, `0.0.0.0` too | lines 1295-1300 |
| no token key in the flags or the configuration file | loopback only: `127.0.0.1`, `::1` or `localhost` | lines 1321-1329 |

- Any other bind with no token key stops the start ([`code://packages/server/src/commands/options.ts#L1325-L1328`](../../packages/server/src/commands/options.ts#L1325-L1328)).
- `ahpd configure` writes a token file when the person presses Enter ([`code://packages/server/src/commands/configure.ts#L354-L366`](../../packages/server/src/commands/configure.ts#L354-L366)).
- `ahpd run` and `ahpd start` offer `ahpd configure` only when there is no configuration file and a terminal answers ([`code://packages/server/src/commands/configure.ts#L472-L481`](../../packages/server/src/commands/configure.ts#L472-L481)).
- So the guided setup has a token. A loopback host has no token when the configuration file has no token key, when the person declines the offer, or when no terminal answers.
- The docs call that case safe: "Loopback with no token needs no secret" ([`code://docs/sdk/AUTHENTICATION.md#L34`](../../docs/sdk/AUTHENTICATION.md#L34)). They also tell VS Code that such a host needs no token ([`code://docs/server/CONNECT.md#L43`](../../docs/server/CONNECT.md#L43)).
- The size of the gap: it is not the default of the guided setup.
  It is the default of the code on loopback, and the docs present it as safe.

### What a socket with no token can do

- The daemon builds `DoorOptions` with no `token` when `secret` gives none ([`code://packages/server/src/commands/run.ts#L633-L648`](../../packages/server/src/commands/run.ts#L633-L648)), and hands it to `listen` ([`code://packages/server/src/commands/run.ts#L1768-L1778`](../../packages/server/src/commands/run.ts#L1768-L1778)).
- With no token, `doorOf` answers `{ admitted: true }`, with a principal only when a directory knows a presented token ([`code://packages/sdk/src/listen.ts#L157-L162`](../../packages/sdk/src/listen.ts#L157-L162)).
- The socket is not root: `root` is set only on the deployment's own token with a user directory.
- With no user directory, `admit` passes every command ([`code://packages/sdk/src/host/admission.ts#L354`](../../packages/sdk/src/host/admission.ts#L354)).
  These include `resourceWrite`, `createSession` and `createTerminal` ([`code://packages/sdk/src/host/gate.ts#L38-L86`](../../packages/sdk/src/host/gate.ts#L38-L86)).
- With a user directory, a socket that names nobody gets `-32007` "Sign in to use this host" on each gated command ([`code://packages/sdk/src/host/admission.ts#L358-L362`](../../packages/sdk/src/host/admission.ts#L358-L362)).

### Where the upgrade is decided

`listen` has three branches, and each one decides the upgrade before the socket exists:

| Branch | Where | `Origin` reachable |
|---|---|---|
| Bun | `fetch`, on a `Request` ([`code://packages/sdk/src/listen.ts#L236-L242`](../../packages/sdk/src/listen.ts#L236-L242)) | `request.headers.get('origin')` |
| Deno | the `Deno.serve` handler, on a `Request` ([`code://packages/sdk/src/listen.ts#L303-L307`](../../packages/sdk/src/listen.ts#L303-L307)) | `request.headers.get('origin')` |
| Node | `verifyClient` of `ws` ([`code://packages/sdk/src/listen.ts#L369-L381`](../../packages/sdk/src/listen.ts#L369-L381)) | `info.origin`, and `info.req.headers.origin` |

- `ws` 8.21.3 hands `origin` to `verifyClient` beside `req`. ahpd's `NodeRequest` type names only `authorization` ([`code://packages/sdk/src/listen.ts#L677-L680`](../../packages/sdk/src/listen.ts#L677-L680)).
- A `Door` takes a URL and an authorization and nothing else ([`code://packages/sdk/src/types/listen.ts#L209`](../../packages/sdk/src/types/listen.ts#L209)).
- The daemon runs on Node: `main.ts` starts with `#!/usr/bin/env node`, and `engines` names only Node.
- Second hole on the same path: the Node branch puts no `error` listener on a socket ([`code://packages/sdk/src/listen.ts#L404-L421`](../../packages/sdk/src/listen.ts#L404-L421)).
  A standalone `ws` 8.21.3 server of that shape exits on one bad UTF-8 frame.

### The `Origin` check of the HTTP API

- `apiHandler` refuses a request under `/api` with 403 when `foreign` gives a reason ([`code://packages/server/src/http.ts#L118-L122`](../../packages/server/src/http.ts#L118-L122)).
- `foreign` checks `Host` against the authorities, then `Origin` against the origins ([`code://packages/server/src/http.ts#L91-L93`](../../packages/server/src/http.ts#L91-L93)).
- `originRefusal` passes a request with no `Origin`, as a caller outside a browser ([`code://packages/server/src/http.ts#L95-L100`](../../packages/server/src/http.ts#L95-L100)).
- `apiOrigins` makes the allow list ([`code://packages/server/src/commands/run.ts#L107-L123`](../../packages/server/src/commands/run.ts#L107-L123)):
  - `http://127.0.0.1`, `http://localhost` and `http://[::1]` at the bound port.
  - The bound address at the port, unless the bind is `0.0.0.0` or `::`.
  - The origin of `resource`, when the deployment names one.
  - Each entry of `origins`, from `--origin` or the configuration file ([`code://packages/server/src/commands/options.ts#L557-L562`](../../packages/server/src/commands/options.ts#L557-L562)).
- So the deployment sets the list, through `host`, `port`, `resource` and `origins`.

### The clients

| Client | How it opens the socket | `Origin` that ahpd sees |
|---|---|---|
| ahpc | the AHP client's `WebSocketTransport`, on Node's global `WebSocket` | none, on Node 24.19.0 |
| ahpw, served by the daemon under `/plugins/web/` | `socketUrl`, on the host that served the page | the daemon's own, such as `http://127.0.0.1:9187` |
| `ahpw serve` | the browser connects to ahpw, and ahpw dials the daemon | none: ahpw forwards only the handshake headers, and checks `Origin` itself |
| the ahpw dev server, port 5180 | its `/ahp` proxy | the browser's, such as `http://127.0.0.1:5180`: the proxy removes `Origin` on `/api` only |
| VS Code desktop | the window's `WebSocket` | one is sent, value not checked |
| ahpapp on Android | its React Native `WebSocket` | `http://<host>:<port>` of the socket URL, added when the app sets none |

## Who writes

- No worktree of `/github/ahpd` changes `packages/sdk/src/listen.ts`, `packages/sdk/src/types/listen.ts` or `packages/server/src/http.ts`, in commits or in uncommitted files.
- No remote branch of `origin` or `maycxc` that is not merged into `origin/main` changes them.
- No local branch that is not merged changes them.
- No file in `.project/` at `4e122781` plans an `Origin` check on the socket.

## The change

- The door refuses a WebSocket upgrade whose `Origin` is present and is not in the allow list, with 403, as RFC 6455 section 10.2 says.
- An upgrade with no `Origin` is admitted, as `originRefusal` does on the API.
- The allow list is the one `apiOrigins` makes for the daemon's own port, so `origins` and `resource` widen both the API and the socket.
- The check is in all three branches of `listen`, before the token is read.
- The Node branch reads the origin that `ws` hands to `verifyClient`.

## Open points

- Whether the check runs on every upgrade, as on the API, or only on a host with no token. A page cannot know a token, so the second case is the gap.
- VS Code desktop sends an `Origin`, so the allow list must admit it, or VS Code cannot connect to a loopback host with no token.
- The ahpw dev server forwards the browser's `Origin` on its socket, so it is refused unless its proxy removes `Origin` there too, as on `/api`.
- ahpapp on Android sends the socket URL's origin. On a `0.0.0.0` host reached by its address, that origin is in the list only when `origins` names it.
- Whether a page loaded from `file://`, which sends `Origin: null`, is refused. The API refuses it today, because `null` is in no list.
- Not checked: the `Origin` value that VS Code desktop sends, such as `vscode-file://vscode-app`.
- Not checked: the `Origin` that an app which embeds ahpw sends, where the page does not come from the host.
- Not checked: the `Origin` that ahpapp sends on iOS.
- Not checked: that the daemon process itself exits on a bad frame. The probe ran a standalone `ws` server, not ahpd.
- Not checked: which commands a socket that names nobody can still use on a host with a user directory.
