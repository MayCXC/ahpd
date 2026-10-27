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

## An action that takes or writes a file

An action with a `FILE` prop is offered with that prop as a string. The value is one of three things: an `https:` URL, a `data:` URI, or the name of a file in the session's attachments folder. The plugin turns it into the file the piece reads before the action runs. The piece sees the file the way it does in Activepieces. A URL is read only up to 32 MB, and a request that has not answered in 30 seconds is ended. A `data:` URI and an attachment have no limit of their own. The whole file is read into memory, because that is what the piece is given.

A URL is read by the plugin, not by the piece, and only `https:` is read. The name is resolved once. A call is refused when any address it answers on is loopback, link-local, private, shared, benchmarking, multicast, reserved or unspecified, in IPv4 or IPv6. It is refused too when it is an IPv4 address written as IPv6. Each redirect is checked again the same way, and the request goes to the address that was checked. A value that names an attachment is resolved inside the folder. It is refused when it leaves it, when no such file is there, or when the session's store keeps no files. A refusal names only a URL's host, so a signed URL's token is never repeated. Neither a refusal nor a problem line names the folder or repeats the bytes.

A piece that calls `files.write` puts the file in the session's attachments folder, under the name it asked for. A name longer than 80 characters is cut, and its extension is kept. The action's output carries the file's path, so the agent can read it. A name of a file already there gets a number before its extension, and an existing file is never replaced. The written file goes when the session goes, like every other attachment. A call on a session with no folder refuses the write, and a `FILE` value that names an attachment fails there too.
