# @ahpd/activepieces

<!--@include: ../../packages/activepieces/README.md{2,}-->

## How a session binds a connector

A session names the connectors it may use in the `connectors` key of its config. A bot names the same map in its `connectors` field:

```json
{ "connectors": { "work": "connectors://ap-resend/mail" } }
```

That session has the tool `ap_resend_send_email` with no `connector` argument, because the alias says whose account the call uses. With two bindings of one adapter, the tool takes a `connector` argument that names one alias. [PLUGINS.md](PLUGINS.md#an-action-offered-as-a-tool) says how a tool is named, offered and checked.

## Each piece shows its logo

Each piece becomes an adapter, and the adapter carries the logo Activepieces publishes for the piece. The plugin fetches each logo once, at load, and keeps it at `<configDir>/activepieces/icons/<piece>.<ext>`, with the extension of the image type the CDN sent. A client receives it as a `data:` icon, so a second start makes no fetch. A fetch that fails, or a logo larger than 32 KB, costs the icon and one line. The adapter is still registered, without it. A daemon with no configuration directory to cache in fetches nothing.

The logos are the brands' own marks, and the plugin passes on what Activepieces publishes for each piece. They belong to their owners: a host that shows one is showing the piece, not claiming the mark.
