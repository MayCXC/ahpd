---
title: The inner host gets the proxy's URL and the token instead of a key
status: todo
depends: [task-01-a-session-has-a-token.md]
layer: "sdk | computer"
refs:
  - "[code://packages/sdk/src/types/computers.ts#L38-L48](../../../../packages/sdk/src/types/computers.ts#L38-L48) - `NestedStart`"
  - "[code://packages/sdk/src/nested.ts#L115-L129](../../../../packages/sdk/src/nested.ts#L115-L129) - `startInside`"
  - "[code://packages/sdk/src/types/machine.ts#L60-L64](../../../../packages/sdk/src/types/machine.ts#L60-L64) - `EnvNeed`"
  - "[code://packages/server/src/proxy/providers.ts#L25-L39](../../../../packages/server/src/proxy/providers.ts#L25-L39) - a provider's key variable"
  - "[code://packages/sdk/src/nested.ts#L50](../../../../packages/sdk/src/nested.ts#L50) - `NestedAsked`, which carries no env"
  - "[code://packages/computer/src/plugin.ts#L679-L695](../../../../packages/computer/src/plugin.ts#L679-L695) - `nestedHost`, the port's `nested`"
  - "[code://.project/plans/container/05-p12-off-host-machine-reaches-models-via-proxy/plan.md](./plan.md) - the per-session env holds only the token and the proxy URL"
---

## Objective

A nested session in a remote machine starts its inner host with the session token in each provider key variable of its agent.
Each base URL variable holds the proxy URL.
Nothing else from this host's environment reaches the inner host.
The token and the URL reach the inner host in a per-session env that holds nothing else.
The ssh runtime's option `proxyForward` picks a random remote port (the default) or a remote unix socket.

## Files

- `UPDATE: packages/sdk/src/types/computers.ts:38-48` - `NestedStart.env`, and `ComputerPort.proxyUrl?(id): Promise<string | undefined>`, the URL a machine reaches this host's proxy at, answered by the port since only the runtime knows how its machine is reached.
- `UPDATE: packages/sdk/src/nested.ts:50` - `NestedAsked.env`.
- `UPDATE: packages/sdk/src/types/machine.ts:60-64` - `EnvNeed.proxy?: string` (a provider id) and `EnvNeed.role?: 'key' | 'url'`, documented.
- `UPDATE: packages/sdk/src/nested.ts:115-129` - `env` passed to `nested`.
- `UPDATE: packages/computer/src/plugin.ts:679-695` - `nestedHost` takes `env` and passes it by name, per p1 (`-e NAME` with the value in the spawned env, never in argv).
- `UPDATE: packages/computer/src/ssh.ts` - `nested` writes `env` into the remote command as `how` does; `proxyUrl(id)` opens the `-R` forward on the session's own ssh with `-o ExitOnForwardFailure=yes` and answers `http://127.0.0.1:<port>`; p8 and p11 do the same for theirs.
- `UPDATE: packages/computer/src/plugin.ts:99` - `proxyForward: 'port' | 'socket'` beside `pollSeconds`, default `port`.
- `UPDATE: packages/computer/src/ssh.ts:88` - `proxyForward` in the ssh options.
- `UPDATE: packages/agent-claude/src/claude.ts` - `ANTHROPIC_API_KEY` declared with `proxy: 'anthropic', role: 'key'` and `ANTHROPIC_BASE_URL` with `proxy: 'anthropic', role: 'url'`.

## Steps

1. Add `ComputerPort.proxyUrl(id)`, because the SDK cannot build an ssh `-R` and only the runtime knows the URL.
2. For an ssh machine and a VM reached by ssh, add the `-R` forward in `ssh.ts` with `-o ExitOnForwardFailure=yes`.
3. Fail the start when the forward cannot bind, so no session runs without its proxy.
4. For a joined node (p10) and a remote Docker (p8), answer the URL that reaches this host.
5. Refuse a node or a remote Docker with a sentence when it has no such URL configured.
6. With `proxyForward: 'port'`, the default, pick a random remote port and retry with a new one when the forward fails.
7. With `proxyForward: 'socket'`, forward a remote unix socket and make the inner host relay a loopback URL to it.
8. Refuse any variable in the per-session env other than the token and the URL.
9. Treat a variable as a key when its need says `role: 'key'`, or when its name is a provider's `key.env`.
10. Give a `role: 'url'` variable the port's `proxyUrl(id)` answer for its `proxy` provider.

## Validation

- `nested-start.test.ts`: the `env` of a remote nested start holds the token and the URL, and no provider key from `process.env`.
- `computer-ssh.test.ts`: the remote command carries them quoted, and `-R` is in the argv.
- `computer-ssh.test.ts`: with `proxyForward: 'port'`, the runtime tries a new port after a failed forward.
- `computer-ssh.test.ts`: with `proxyForward: 'socket'`, the runtime forwards a socket path.
- `proxyUrl` answers the forwarded loopback URL for an ssh machine, with `ExitOnForwardFailure=yes` in the argv.
- `proxyUrl` answers the configured URL for a node, and refuses a node with none.
- `computer-spawn.test.ts`: `nestedHost` with `env` passes each name as `-e NAME` and its value in the spawned env only.

## Resume
