# Install

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

To move to a newer version, see [Upgrade](UPGRADE.md).
