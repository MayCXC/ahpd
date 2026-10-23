# @ahpd/connector-activepieces

<!--@include: ../../packages/connector-activepieces/README.md{2,}-->

## How a session binds a connector

A session names the connectors it may use in the `connectors` key of its config. A bot names the same map in its `connectors` field:

```json
{ "connectors": { "work": "connectors://ap-resend/mail" } }
```

That session has the tool `ap_resend_send_email` with no `connector` argument, because the alias says whose account the call uses. With two bindings of one adapter, the tool takes a `connector` argument that names one alias. [PLUGINS.md](PLUGINS.md#an-action-offered-as-a-tool) says how a tool is named, offered and checked.
