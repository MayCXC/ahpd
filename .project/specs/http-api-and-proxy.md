---
title: HTTP API and proxy
status: current
covers:
  - packages/server/src/http.ts
  - packages/server/src/commands/authorize.ts
  - packages/server/src/commands/scopes.ts
  - packages/server/src/commands/served.ts
  - packages/server/src/commands/registry.ts
  - packages/server/src/commands/run.ts
  - packages/server/src/proxy/**
  - packages/sdk/src/listen.ts
decisions:
  - decisions/a-persons-token-names-them-unless-the-issuer-is-required.md
refs:
  - "[code://packages/server/src/http.ts#L24](../../packages/server/src/http.ts#L24) - `API_PREFIX`, the path the API is served under"
  - "[code://packages/server/src/http.ts#L77-L127](../../packages/server/src/http.ts#L77-L127) - `hostRefusal`, `foreign`, `originRefusal` and `apiHandler`"
  - "[code://packages/server/src/http.ts#L130-L149](../../packages/server/src/http.ts#L130-L149) - `PROXY_PREFIX` and `withoutApi`, the answer of a daemon with no API"
  - "[code://packages/server/src/http.ts#L255-L281](../../packages/server/src/http.ts#L255-L281) - `plainRequests` and `listenApi`"
  - "[code://packages/server/src/commands/authorize.ts#L73-L91](../../packages/server/src/commands/authorize.ts#L73-L91) - `authorizeOverHttp`, who the caller of a request is"
  - "[code://packages/server/src/commands/options.ts#L884-L926](../../packages/server/src/commands/options.ts#L884-L926) - `httpOf` and `originOf`"
  - "[code://packages/server/src/commands/run.ts#L82-L98](../../packages/server/src/commands/run.ts#L82-L98) - `apiOrigins`, the names and origins the API answers to"
  - "[code://packages/server/src/commands/run.ts#L314-L339](../../packages/server/src/commands/run.ts#L314-L339) - the refusals of `http` without a port or a credential, and `apiHost`"
  - "[code://packages/server/src/commands/run.ts#L456-L488](../../packages/server/src/commands/run.ts#L456-L488) - the proxy in front of the API, and the API's own listener"
  - "[code://packages/server/src/proxy/dialects.ts#L16-L50](../../packages/server/src/proxy/dialects.ts#L16-L50) - the caller paths, `MODELS_PATH` and `dialectOfHeaders`"
  - "[code://packages/server/src/proxy/dialects.ts#L303-L322](../../packages/server/src/proxy/dialects.ts#L303-L322) - `modelList`, names only, in the caller's dialect"
  - "[code://packages/server/src/proxy/listener.ts#L416-L421](../../packages/server/src/proxy/listener.ts#L416-L421) - `refusedGuard`, a loopback `Host` at any port"
  - "[code://packages/server/src/proxy/listener.ts#L519-L532](../../packages/server/src/proxy/listener.ts#L519-L532) - a provider's key refusal, and the statuses that are retried"
  - "[code://packages/server/src/proxy/listener.ts#L615-L645](../../packages/server/src/proxy/listener.ts#L615-L645) - `models` and the dispatch under `/v1`"
  - "[code://packages/sdk/src/listen.ts#L455-L463](../../packages/sdk/src/listen.ts#L455-L463) - `mountable`, the Node listener the host hands in"
  - git://d9d4f950^ - the deleted decisions this spec was written from: a-deployment-names-extra-origins-apart-from-resource, an-http-api-is-served-by-cofold-remote, an-unconfigured-daemon-does-not-serve-the-http-api, cofold-serve-is-fetch-style-with-a-node-adapter, http-host-binds-the-apis-own-listener, the-http-api-checks-origin-and-host-and-takes-only-json, the-http-api-is-on-the-daemon-port-under-api, the-models-list-answers-in-the-dialect-the-caller-sent, the-proxy-answers-a-providers-key-refusal-with-its-own-error, the-proxy-answers-under-v1-beside-the-api, the-sdk-mounts-the-node-listener-the-server-adapts
---

The daemon serves its commands as an HTTP API under `/api`, through `serve()` of `@cofold/remote`.
These are the same declarations the terminal runs, as [Daemon](daemon.md) says, so the API and the CLI cannot drift apart.
The model proxy answers under `/v1` on the same listener, in front of the API.
Both are off until the `http` key turns them on.
Both refuse a request from a foreign host or origin before a credential is read.
`serve()` is a fetch-style handler, and the daemon adapts it to `node:http` with `toNodeListener`.
The code is in [`code://packages/server/src/http.ts`](../../packages/server/src/http.ts) and [`code://packages/server/src/proxy/listener.ts`](../../packages/server/src/proxy/listener.ts).

## Scenarios

### A daemon without http

WHEN the configuration has no `http` key, or `http` is false
THEN the daemon answers 404 for a path under `/api` or `/v1`
AND it answers 426 for each other plain request, because the listener speaks AHP.

### The API on the daemon port

WHEN `http` is true
THEN the API answers under `/api` on the daemon's own port, beside the WebSocket
AND the proxy answers under `/v1` on that port.

### The API on its own listener

WHEN `http` holds a `port`
THEN the API and the proxy answer on that port, at `http.host` or at the daemon's host
AND the daemon's own port answers 404 under `/api` and `/v1`.
The daemon binds that port before it announces itself, so a port that is in use stops the start.

WHEN `http` holds a `host` and no `port`
THEN the daemon refuses to start, because the host names a listener that has no port.

### http needs a credential

WHEN `http` is on and the daemon has no connection token and no users file
THEN the daemon refuses to start.
The reason: with no credential, any caller that reaches the port could drive the administration commands.

WHEN `http` is on with `--stdio`
THEN the daemon refuses to start, because stdio has no port to serve on.

### A request names its caller

WHEN a request carries the deployment's connection token as a bearer
THEN the caller is root, as on the WebSocket.

WHEN the daemon has a users file and the request carries a person's token
THEN `users.verify` names the person
AND the command checks that person's grants, as [People, roles and grants](people-roles-and-grants.md) says.

WHEN the daemon has no users file and the token is not the deployment's
THEN the answer is 401.

### A foreign host or origin

WHEN a request under `/api` has a `Host` that is not one of the daemon's names
THEN the answer is 403 JSON, before a command or a grant is read.
This is the shape of DNS rebinding, where a page points its own name at loopback.

WHEN a request has an `Origin` that is not one of the daemon's origins
THEN the answer is 403 JSON.
A request with no `Origin` is a caller outside a browser and passes this check.

### The names the API answers to

WHEN the daemon computes its names
THEN they are `127.0.0.1`, `localhost` and `[::1]` at its port, and its host when that is not a wildcard
AND they include the host and origin of `resource` and of each `origins` entry.

WHEN a person passes `--origin` or writes an `origins` entry with a path or a query
THEN the daemon refuses to start, because an origin is only a scheme, a host and a port.

### The API takes JSON

WHEN a request body is not JSON
THEN `serve()` answers 415.

WHEN a body is larger than 1 MiB
THEN `serve()` answers 413.

### A remote CLI reads the manifest

WHEN `ahpd --remote <url>` starts
THEN it loads the command list from `<url>/api/cli-manifest` and keeps it in the cache folder, readable by the owner only
AND `--refresh` loads it again.

### The SDK mounts the Node listener

WHEN the daemon serves plain requests on Node
THEN it hands `listen` the handler and the handler as a `node:http` listener.
Bun and Deno serve the fetch handler as it is.
The SDK has no adapter of its own and depends on no cofold package, so the server builds the listener with `toNodeListener`.

### The proxy guard

WHEN a request under `/v1` has a loopback `Host` at any port
THEN the proxy checks only its `Origin`.
The reason: a forward from another machine lands on a loopback port that is not the daemon's port.

WHEN the `Host` is not loopback
THEN the proxy holds it to the API's names and origins.

### The models list

WHEN a caller sends `GET /v1/models`
THEN the proxy answers with the names of the models this caller can call now
AND it uses the Anthropic shape when the request has `anthropic-version`, and the OpenAI shape when it does not.
The list holds only names, never a provider, a price or a variable.

### A provider refuses the key

WHEN a provider answers 401 or 403 to a call
THEN the proxy answers 502 with `model <name> on <provider> refused this host's key`
AND it logs the provider's words with key-shaped text removed, and tries no other provider.
The reason: the key is this host's configuration, so another provider cannot fix it.

WHEN a provider answers 429 or 5xx, or the connection never arrived
THEN the proxy tries the next candidate.
