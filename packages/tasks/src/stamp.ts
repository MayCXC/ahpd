import type { Stamp } from './record.js';
import type { ToolCall } from '@ahpd/sdk';

/**
 * The stamp a call writes.
 *
 * `at` is the host's clock, `by` is the person behind the call and `in` is the
 * session it ran in. None of the three comes from the model: the tools take no
 * stamp input, so the host is the one writer, and a stamp says what the call
 * was rather than what the model says about it.
 *
 * `by` always names something - a person, a session's owner or `host` - so a
 * stamp never says nobody. That is the answer `person()` gives as well.
 */
export const stampOf = (at: ToolCall): Stamp => ({
  at: new Date().toISOString(),
  by: at.person() ?? 'host',
  in: at.session,
});
