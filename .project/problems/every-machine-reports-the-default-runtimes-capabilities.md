---
title: Every machine reports the default runtime's capabilities
status: open
date: 2026-10-16
severity: minor
refs:
  - "[code://packages/computer/src/provider.ts#L152-L155](../../packages/computer/src/provider.ts#L152-L155) - `capabilities` comes from the one runtime the provider serves"
  - "[code://packages/computer/src/runtime.ts#L508](../../packages/computer/src/runtime.ts#L508) - `RuntimeCapabilities`, what a runtime can be asked for"
---

## Symptom

ahpd reports the default runtime's capabilities for every machine, whatever its source.
A client shows the Dev container field when Source is Image.

## Cause

Unknown in detail. The provider builds `capabilities` from one runtime, not from the source of each machine.

## Impact

A client cannot hide the fields that do not apply to a source, so a person sees fields that do nothing.

## Workaround

None.

## Fix

- Report capabilities per source, so a client hides the Dev container field for Image.
