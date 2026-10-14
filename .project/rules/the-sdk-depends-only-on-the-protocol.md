---
title: "Never add a dependency to @ahpd/sdk other than the protocol package"
applies:
  - packages/sdk/package.json
  - packages/sdk/src/**
refs:
  - "[code://packages/sdk/package.json](../../packages/sdk/package.json) - `dependencies`, which holds `@microsoft/agent-host-protocol` only"
  - "[code://packages/server/package.json](../../packages/server/package.json) - where a package the host needs goes"
---

`@ahpd/sdk` depends on `@microsoft/agent-host-protocol` and on nothing else, a `@cofold/*` package included.
A plugin and every embedder install the sdk, so each package it takes is a package they all take.

Put the package in `@ahpd/server`, and give the sdk a port or a plain value that the server fills. The HTTP listener is the example: the server builds the Node listener with `toNodeListener`, and the sdk mounts what it is given.

How to check: `dependencies` in `packages/sdk/package.json` has one key.

Known exception: none.
