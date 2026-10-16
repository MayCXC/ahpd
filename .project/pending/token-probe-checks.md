---
title: Check that a browser reads the token answer
plans:
  - plans/host/96-a-plain-request-tests-the-token/plan.md
---

# Check that a browser reads the token answer

host/96 is built, and its tests pass. This check uses a browser on another origin, after a restart onto this build.

## A page on another origin

1. Open any https page in the browser, for example `https://example.com`, and open the developer console.
2. Run `fetch('http://127.0.0.1:<port>/?tkn=wrong').then(r => console.log(r.status))` with the daemon's port.
3. Check that the console prints 401, and that the network tab shows no CORS error.
4. Run the same line with the daemon's real token in place of `wrong`.
5. Check that the console prints 426.

## Reply

Write "pass", or what you saw. A pass ticks the matching line in the plan.
