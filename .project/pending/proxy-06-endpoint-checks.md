---
title: Check the proxy model endpoints
plans:
  - plans/proxy/06-the-proxy-serves-every-model-endpoint/plan.md
---

# Check the proxy model endpoints

Plan proxy 06 makes the proxy answer every model endpoint. Its tests use fake providers and no network. These checks need your daemon, real connectors and the network.
Restart the daemon on main before you start.
Do these checks from a terminal that is not a Claude Code session.

## Steps

1. Set the OpenAI SDK base URL to `http://host:port`, with no `/v1`.
2. Through an `openai` connector, ask for embeddings, and check that the answer has vectors.
3. Through the same connector, create a Response, then send a follow-up with its `previous_response_id`.
4. Get the same Response with `GET /responses/{id}`, and check that the id starts with `resp_`.
5. Through the same connector, create an image, a speech file and a transcription.
6. With the Anthropic SDK, count tokens through an `anthropic` connector.
7. Through an `openrouter` connector, send a rerank call.
8. Check that the daemon log and every answer show no key.

## Reply

Write "done" when each step works, or say which step stopped.
