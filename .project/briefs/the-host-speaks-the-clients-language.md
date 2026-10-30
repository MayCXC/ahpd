---
title: The host speaks the client's language
created: 2026-10-30
refs:
  - git://55c4d420 - the commit of ahpd the facts were checked at
  - https://github.com/microsoft/agent-host-protocol/blob/main/types/common/commands.ts - `initialize` takes `locale`, a BCP 47 tag, and the server "SHOULD use this to localise user-facing strings"
  - "[code://packages/sdk/src/host/handshake.ts#L148-L165](../../packages/sdk/src/host/handshake.ts#L148-L165) - `initialize`, which reads `protocolVersions` and not `locale`"
  - "[code://packages/sdk/src/host/chatattachment.ts#L15-L22](../../packages/sdk/src/host/chatattachment.ts#L15-L22) - text the model reads stays English, with the reason"
  - "[code://packages/sdk/src/host/sessionmethods.ts#L1527-L1605](../../packages/sdk/src/host/sessionmethods.ts#L1527-L1605) - `resolveSessionConfig`, the form whose titles a person reads first"
  - "[code://packages/server/src/commands/update.ts#L293-L296](../../packages/server/src/commands/update.ts#L293-L296) - a command's `describe`, a title and a description in English"
  - "[code://packages/server/src/commands/scopes.ts#L42-L43](../../packages/server/src/commands/scopes.ts#L42-L43) - a refusal, an English sentence made from parts"
  - npm://@activepieces/piece-resend@0.6.1 - a piece ships `src/i18n/<lang>.json`, keyed by the English text
---

# The host speaks the client's language

Softov wants a client's person to read the host's text in their own language.
A Portuguese ahpw screen today shows the host's English inside it: form labels, command titles and refusals.
AHP's `initialize` carries `locale`, and the spec says a server should use it for text a person reads.
ahpd reads `protocolVersions` from `initialize` and ignores `locale`.
No client of ours sends `locale`: ahpw, ahpapp and ahpc leave it out.

## What is in scope

- The text the host makes for a person: titles, descriptions, form labels, enum labels, command summaries and refusals.
- The same text from each plugin, from that plugin's own catalog.
- A person's own text stays as it is.
- Text the model reads stays English, as `chatattachment.ts` says.

## What exists

- Each Activepieces piece ships `src/i18n/<lang>.json`, one map from the English text to the translation.
- ahpw has `en`, `pt` and `es` catalogs, and ahpapp has `en`, `pt-BR` and `es`.
- ahpd's text is English string literals, spread over the sdk, the server and each plugin.

## A catalog shape to decide

- **Keyed by the English text**, as Activepieces does. The code stays as it is, and a changed English sentence loses its translations.
- **Keyed by an id**, as ahpw and ahpapp do. Every string gets an id, and the change touches each place that makes text.
- A refusal made from parts, such as `deploymentOnly`, needs a template with named slots in either shape.

## A first slice

1. The host keeps the `locale` of each connection from `initialize`.
2. The new session form's titles, descriptions and enum labels come in that locale, with English as the fallback.
3. A plugin may ship a catalog beside its `package.json`, and the host reads it at load.
4. ahpw and ahpapp send their own locale in `initialize`.

Refusals, command titles and the Activepieces catalogs come after the first slice.

## Open questions

- The catalog shape: keyed by the English text, or by an id.
- Whether a client that changes its language reconnects, or tells the host on the open connection.
- Which languages ship first: Portuguese and Spanish, as the clients have.
