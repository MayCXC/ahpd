---
title: Language servers run on the host
created: 2026-10-29
refs:
  - "[code://packages/sdk/src/types/plugin.ts#L1091-L1098](../../packages/sdk/src/types/plugin.ts#L1091-L1098) - registerChannel and registerMethod, which can relay LSP messages"
  - https://code.claude.com/docs/en/plugins/code-intelligence - Claude Code's code intelligence plugins and their .lsp.json
---

An `lsp` plugin runs language servers next to the files and gives their answers to two callers.
An agent gets an `lsp` host tool for definitions, references, hover and symbols, and the new diagnostics after each edit.
A client editor such as ahpw's gets completion, hover and go to definition, relayed over the AHP connection it already has.
Server entries use the field names of Claude Code's `.lsp.json`, so one entry works in both.
pi, ACP agents and cofold have nothing like it today.
