# Upgrade

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
