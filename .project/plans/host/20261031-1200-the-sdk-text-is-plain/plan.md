---
title: The sdk's text is plain and in the client's language
domain: host
status: draft
priority: medium
created: 2026-10-31
revalidated: 2026-10-31
requires:
  - plans/host/20261030-1037-host-text-in-the-clients-language/plan.md
changes: []
creates: []
refs:
  - git://cb47945e - the commit of ahpd this plan was checked at
  - "[code://.project/briefs/the-text-a-person-reads-is-plain.md](../../../briefs/the-text-a-person-reads-is-plain.md) - the brief; it stays for the server and plugin slices"
  - "[code://packages/sdk/src/i18n.ts#L1-L22](../../../../packages/sdk/src/i18n.ts#L1-L22) - a catalog is keyed by field path, and English is the text in the code"
  - "[code://packages/sdk/src/i18n.ts#L55](../../../../packages/sdk/src/i18n.ts#L55) - `translated`, the lookup each text goes through"
  - "[code://packages/sdk/src/i18n/pt.json](../../../../packages/sdk/src/i18n/pt.json) - the host's Portuguese catalog, all under `session`"
  - "[code://packages/sdk/src/host/sessionconfig.ts#L76-L270](../../../../packages/sdk/src/host/sessionconfig.ts#L76-L270) - the English of the new session form"
  - "[code://packages/sdk/src/host/root.ts#L445-L515](../../../../packages/sdk/src/host/root.ts#L445-L515) - `advertisedSchemes`, `advertisedChannels` and `advertisedMethods`, which serve each `describe()` as it is"
  - "[code://packages/sdk/src/host/root.ts#L563](../../../../packages/sdk/src/host/root.ts#L563) - `rootState`, which gets the connection"
  - "[code://packages/sdk/src/host/handshake.ts#L452-L458](../../../../packages/sdk/src/host/handshake.ts#L452-L458) - `initialize` sends the three lists"
  - "[code://packages/sdk/src/host/context.ts#L103-L105](../../../../packages/sdk/src/host/context.ts#L103-L105) - `localeOf`, the locale of a connection"
  - "[code://packages/sdk/src/resources/recordschannel.ts#L384-L410](../../../../packages/sdk/src/resources/recordschannel.ts#L384-L410) - `recordsMethods`, which makes a title from the scheme's name"
  - "[code://packages/server/src/pluginschannel.ts#L315-L339](../../../../packages/server/src/pluginschannel.ts#L315-L339) - `translate`, the pattern of a record copied into a reader's locale"
---

## Goal

ahpd gets the rules for the text a person reads, and a list of the terms in English, Portuguese and Spanish.
The first slice applies them to the sdk: the new session form, and the titles and descriptions of the sdk's commands, channels and schemes.
Each text is rewritten in plain English first, then translated, and the host sends it in the client's locale.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "describe: \(\) =>" packages/sdk/src` - 26 `describe()` texts in nine files of the sdk.
- `rg -n "title:|description:" packages/sdk/src/host/sessionconfig.ts` - the form's English, which the catalogs translate as it is.
- `rg -n "advertised(Schemes|Channels|Methods)" packages/sdk/src` - two callers: `initialize` and `rootState`.
- `rg -n "Put a|Remove a" packages/sdk/src` - one sentence built from parts, in `recordsMethods`.

### Runtime path

```
initialize(locale) -> context.locales -> rootState / initialize meta
  -> advertisedMethods(locale) -> translated(['methods', name, 'title'], english, locale, HOST_CATALOGS)
  -> ahpd.methods, ahpd.channels, ahpd.resourceProviders in the client's locale
```

### Gaps

- No file holds the writing rules or the terms.
- The form's English says how the code works, in places, and its translations copy that.
- The three lists are in English for each client.
- `recordsMethods` builds `Put a ${scheme}`, which no catalog can translate.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Make the English plain first; it is then the source for each translation | Softov, the brief: "Do not move the current text into catalogs as it is" | 02, 03 |
| The order is sdk, then server, then plugins | Softov, 2026-10-31: "from sdk to server then plugins right?" | - |
| The first slice is the new session form and the sdk's titles and descriptions | Softov, 2026-10-31: "Form and descriptions" | 02, 03 |
| The rules and the terms go in a docs page | Softov, 2026-10-31: "A docs page" | 01 |
| Softov reads each rewritten string before it is committed | Softov, 2026-10-31: "Softov reads each string" | 01, 02, 03 |
| Softov reads all the new strings of tasks 02 and 03 in one list, before any code | Softov, 2026-10-31: "One pass before any code" | 01 |
| The list is `.project/research/sdk-plain-text-strings.md`, and tasks 02 and 03 copy the approved texts from it | (defaulted: one file to read, and a research note is where a working list goes) | 01, 02, 03 |
| Refusals, the server's commands, the plugins' texts and the CLI output come in later plans | (defaulted: the first slice is form and descriptions) | - |
| A command's texts are at `methods.<method>.title` and `.description`; a channel's at `channels.<scheme>`; a scheme's at `schemes.<scheme>` | (defaulted: the field path of the list the text is in) | 03 |
| A records domain names its put and remove commands with whole sentences, and one that gives none gets "Save a record" and "Remove a record" | (defaulted: the brief's rule "Do not make a sentence from translated parts") | 03 |
| A changed English text updates `pt` and `es` in the same commit | the brief, *What ahpd has now* | 02, 03 |

## Proposed architecture

- **Data flow** - English stays in the code; `pt.json` and `es.json` hold the translations at the field path.
- **Event flow** - none new; the lists are sent where they are sent now.
- **State flow** - none new; the locale is the one `context.locales` keeps for each connection.
- **Layer responsibilities** - `docs/sdk/TEXT.md` holds the rules and the terms; `root.ts` translates the lists; each `describe()` keeps its English. docs: `HOST.md`.
- **Source-of-truth files** - [`code://packages/sdk/src/i18n.ts`](../../../../packages/sdk/src/i18n.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The rules, the terms and the strings are written](task-01-the-rules-and-the-terms-are-written.md) | todo | - |
| [02 - The new session form reads plain](task-02-the-new-session-form-reads-plain.md) | todo | 01 |
| [03 - The sdk's lists come in the locale](task-03-the-sdks-lists-come-in-the-locale.md) | todo | 01 |

## Risks and tradeoffs

- A client breaks when it matches a changed title as text.
- The clients match a method by its name, and task 03 checks each of them.
- No code starts until Softov approves the whole list of the form and the 26 descriptions.

## Resume state

- **Done so far:** drafted 2026-10-31.
- **Next action:** Softov reviews the draft; then [task-01-the-rules-and-the-terms-are-written.md](task-01-the-rules-and-the-terms-are-written.md).
- **Open questions:** none.
- **Watch out for:** `pt.json` keeps the old translation when only the English changes; update both in one commit.

## Final verification checklist

- [ ] `docs/sdk/TEXT.md` has the rules and a term table, and Softov approved it.
- [ ] Softov approved the list of new strings before task 02 and task 03 started.
- [ ] The new session form in ahpw reads plain in English, Portuguese and Spanish.
- [ ] `ahpd.methods`, `ahpd.channels` and `ahpd.resourceProviders` come in Portuguese for a client that sends `pt`.
- [ ] No title or description in the sdk is built from parts.
- [ ] `pnpm typecheck` and the sdk suite pass, and Windows CI is green.
