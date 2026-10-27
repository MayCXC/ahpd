---
title: Check an OpenRouter sign-in
plans:
  - plans/plugin/71-a-connector-signs-in-with-its-provider/plan.md
---

# Check an OpenRouter sign-in

Plan plugin 71 signs a connector in to OpenRouter. Its tests use a fake provider and no network. This check needs your daemon, a real OpenRouter account and the network.
Restart the daemon on main before you start.
Do these checks from a terminal that is not a Claude Code session.
The Connect button in ahpw is its own plan. Until it lands, call the two commands from a client.

## Steps

1. Start a sign-in with `x-ahpd/connectors/signin` for a connector of the `openrouter` adapter.
2. Open the URL it answered, sign in to OpenRouter, and copy the code the page shows.
3. Finish with `x-ahpd/connectors/signin-finish`, the state and the code.
4. Check that the answer is the connector row with `state: "ready"`.
5. Check that the vault holds the key under `connector/<id>/key` in the owner's scope.
6. Check that the connector's record holds a `$secret` reference and no key.
7. Check that the daemon log, the answer and every row show no code and no key.
8. Finish the sign-in from step 1 again with the same state and code. Check that the host refuses it.
9. Ask the proxy for a model through the connector, and check that the call works.
10. When ahpw has the Connect button, do steps 1 to 3 from that button, and check the same rows.

## Reply

Write "done" when each step works, or say which step stopped.
