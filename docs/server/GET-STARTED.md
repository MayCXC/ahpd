# Get started

Run an ahpd host on your machine and open it from a client.

You need Node 22 or newer, and at least one agent for the host to run: Claude Code, pi, cofold, or an ACP agent such as Copilot, Codex or Gemini. Each one is a [plugin](PLUGINS.md), and the agent signs in as it does on its own.

## 1. Install

```bash
npm i -g @ahpd/server --allow-scripts=node-pty
```

::: tip
`--allow-scripts=node-pty` lets npm build the terminal binding. Without it, terminals still work, but without a real TTY.
:::

## 2. Set it up

```bash
ahpd configure
```

It asks a few questions. Press Enter to take each default:

```
Claude? [Y/n]:
cofold? [y/N]:
pi? [y/N]:
Host [127.0.0.1]:
Port [9187]:
Connection token [generate one in ~/.config/ahpd/connection-token]:
Serve /work/project? [Y/n]:
```

This installs the agents you pick and writes `~/.config/ahpd/config.json`. For an ACP agent, see [Plugins](PLUGINS.md).

## 3. Start it

```bash
ahpd start
ahpd status
```

```
ahpd on ws://127.0.0.1:9187 (pid 41822), started 2026-10-15T08:30:21.084Z
sessions in /work/project
```

## 4. Connect a client

Get the token with `cat ~/.config/ahpd/connection-token`.

::: code-group

```bash [Web (ahpw)]
ahpd plugin install @ahpd/web
ahpd restart
# open http://127.0.0.1:9187/plugins/web/ and sign in with the token
```

```jsonc [VS Code settings.json]
"chat.remoteAgentHostsEnabled": true,
"chat.remoteAgentHosts": [
  { "name": "ahpd", "address": "ws://127.0.0.1:9187", "connectionToken": "<token>" }
]
// then reload the window; ahpd shows in the Chat view
```

```bash [Terminal (ahpc)]
npm i -g @softov/ahpc
ahpc --host ws://127.0.0.1:9187 --token <token>
```

:::

## Next

| To | Read |
| --- | --- |
| Add other backends or plugins | [Plugins](PLUGINS.md) |
| Serve more folders, change the port | [Configure](CONFIGURE.md) |
| Stop, restart, read the log | [Run](RUN.md) |
| Use other clients | [Connect a client](CONNECT.md) |
| Reach it from another machine | [Remote access](REMOTE.md) |
| Every command and flag | [Reference](REFERENCE.md) |
