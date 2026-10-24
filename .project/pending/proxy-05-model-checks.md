---
title: Call a provider's own model and the root paths
plans:
  - plans/proxy/05-a-providers-own-models-are-callable/plan.md
---

# Call a provider's own model and the root paths

Proxy 05 is merged in #88, and the plan closes after these checks.
Do them after the restart, with the `openrouter` connector from proxy 04 ready.

## Steps

1. Call `GET /models` on the proxy, and find names that start with `openrouter/`.
2. Check that an `openrouter/` row carries `name`, `context_length` and `pricing`.
3. Send one chat call to `openrouter/<id>` for a model that is not in the table.
4. Check that the usage record names the `openrouter` connector and a price.
5. Point an OpenAI SDK at the proxy's base URL with no `/v1`, and send one chat call.
6. Point an Anthropic SDK at the same base URL, and send one message.

## Reply

Write "done" when the calls work, or say which step stopped.
