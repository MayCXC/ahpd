---
title: The docs say how to test a token
status: todo
depends:
  - task-01-a-host-answers-plain-request-by-token.md
layer: "docs"
refs: []
---

## Objective

The docs say that a plain `GET /?tkn=<token>` answers 401 for a refused token and 426 for an accepted one, from any origin.

## Files

- `UPDATE: docs/server/REMOTE.md` - a short section on how a client tests a token.
- `UPDATE: docs/sdk/AHP.md` - one sentence on what `listen` answers to a plain request.

## Steps

1. Find where each doc describes the 426, and add the 401 there.
2. Say that the answer carries `Access-Control-Allow-Origin: *`, and that `/api` keeps its `origins` check.
3. Set this task and the plan row to `implemented`.

## Validation

- Each doc names the 401, the 426 and the header.

## Resume
