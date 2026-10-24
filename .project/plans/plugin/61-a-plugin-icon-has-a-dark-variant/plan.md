---
title: A plugin icon has a dark variant
domain: plugin
status: planned
priority: medium
created: 2026-10-24
revalidated: 2026-10-24
requires:
  - plans/plugin/58-plugins-and-adapters-carry-icons/plan.md
refs:
  - "[code://packages/sdk/src/plugins/validate.ts#L593](../../../../packages/sdk/src/plugins/validate.ts#L593) - an icon's `theme` is `light`, `dark` or nothing"
  - "[code://packages/server/src/icons.ts#L54](../../../../packages/server/src/icons.ts#L54) - the host keeps `theme` on each icon it sends"
  - "[code://packages/webhook/src/adapter.ts](../../../../packages/webhook/src/adapter.ts) - the webhook adapter, which names its own icons"
  - "[code://.project/pending/plugin-58-icon-curation.md](../../../pending/plugin-58-icon-curation.md) - the eight Lucide icons and their sources"
  - https://lucide.dev/icons/ - the source of the eight drawings
---

## Goal

The eight plugin icons from Lucide draw black in a client, because `currentColor` has no value inside an image.
On a dark background they are almost invisible.
Each of these plugins ships a second icon for a dark background, and a client picks the icon for its scheme.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `rg -n "stroke=" packages/*/icon.svg` - eight files use `stroke="currentColor"`: agent-acp, agent-cofold, bot, computer, push, tasks, tunnel-devtunnel and webhook.
- `rg -n "theme" packages/sdk/src packages/server/src` - the check accepts `theme`, and the host keeps it on the icons it sends.
- `rg -n "theme" /github/ahpw/src/bridges/icons.ts` - ahpw picks the icon whose `theme` matches its scheme, then one with no `theme`, then the first.

### Runtime path

```
package.json ahpd.icons -> loadOne -> resolveIcons (data: URI, theme kept) -> plugin row -> client picks by scheme -> <img>
```

### Gaps

- No first-party icon has a `theme`, so a client has one drawing for both schemes.
- The Activepieces, Claude and pi marks have their own colours, and read on both backgrounds.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Each Lucide icon gets a light and a dark variant | Softov, 2026-10-24: "about the suggestion on dark icon light icon i think we need this" | 01 |
| `icon.svg` is the light variant, with `theme: "light"`, and `icon-dark.svg` is the dark variant, with `theme: "dark"` | (defaulted: the existing path stays, so the curation file and `files` entries keep their meaning) | 01 |
| The light variant strokes in `#1F2328`, and the dark variant strokes in `#E6EDF3` | (defaulted: explicit colours, because `currentColor` has no value in an image; Softov curates them) | 01 |
| The webhook adapter names the same two files as its plugin | (defaulted: one drawing for the plugin and its adapter, as in plan 58) | 01 |
| The vendor marks keep one icon with no `theme` | (defaulted: their colours read on both backgrounds) | 01 |
| The host and the clients do not change | [code://packages/server/src/icons.ts#L54](../../../../packages/server/src/icons.ts#L54) | - |

## Proposed architecture

- **Data flow** - each of the eight packages names two icons; the host sends both as `data:` URIs with their `theme`.
- **Event flow** - none.
- **State flow** - none.
- **Layer responsibilities** - packages: the two SVG files and the manifest entries.
  webhook: the adapter's icon list.
- **Source-of-truth files** - [`code://packages/webhook/src/adapter.ts`](../../../../packages/webhook/src/adapter.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - each-lucide-icon-has-a-dark-variant](task-01-each-lucide-icon-has-a-dark-variant.md) | todo | - |

## Risks and tradeoffs

- A client that ignores `theme` draws the first icon - the light variant comes first, so it draws as it does today.
- Two fixed colours can clash with a custom theme - Softov curates both colours.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-each-lucide-icon-has-a-dark-variant.md](task-01-each-lucide-icon-has-a-dark-variant.md).
- **Open questions:** none.
- **Watch out for:** the `files` list in each `package.json` must name `icon-dark.svg`, or a packed plugin has no dark icon.

## Final verification checklist

- [ ] ahpw shows each of the eight icons on a light and on a dark background.
- [ ] `plans/index.md` updated.
