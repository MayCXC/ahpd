# Install and upgrade

## Install

```bash
npm i -g @ahpd/server --allow-scripts=node-pty
```

This installs the `ahpd` command. It has no backend of its own: add one with [`ahpd configure`](CONFIGURE.md#first-setup) or [`ahpd plugin install`](PLUGINS.md).

::: tip node-pty
npm 12 skips install scripts by default. `node-pty` needs its script to build the terminal binding. Allow it once for every install:

```bash
npm config set allow-scripts=node-pty --location=user
```

Without it, terminals fall back to pipes (`isPty: false`).
:::

## Upgrade

```bash
npm i -g @ahpd/server
ahpd plugin update all
ahpd restart
```

`plugin update all` moves each plugin to its newest version that fits the new daemon. See [Plugins](PLUGINS.md#update).

::: warning From 0.6
0.6 had Claude built in, so an old `config.json` names no plugin. Run `ahpd plugin install @ahpd/agent-claude` once after the upgrade.
:::

## Update check

The daemon asks npm every six hours if a newer `@ahpd/server` exists. `ahpd start` and `ahpd status` then say so:

```
update: @ahpd/server 0.6.0 is on npm, this is 0.5.0
```

The request runs in the background and never blocks a start. It uses `npm_config_registry` when it is set.

| Turn it off with | |
| --- | --- |
| `"updateCheck": false` | in `config.json` |
| `--no-update-check` | for one run |
| `NO_UPDATE_NOTIFIER` or `CI` | set to anything in the environment |

## Runtimes

ahpd runs on Node, Bun and Deno. The first line of output names the runtime.

::: code-group

```bash [Node]
ahpd
```

```bash [Bun]
bun "$(npm root -g)/@ahpd/server/dist/main.js"
```

```bash [Deno]
deno run -A "$(npm root -g)/@ahpd/server/dist/main.js"
```

:::

Node needs the optional `ws` dependency, which npm installs. Bun and Deno use their built-in servers.

## From a checkout

```bash
pnpm install && pnpm build
node packages/server/dist/main.js --help
```

Use `node packages/server/dist/main.js` wherever these pages say `ahpd`. To work on ahpd itself, see [DEVELOPER.md](../../DEVELOPER.md).
