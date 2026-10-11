import type { PluginHost } from '@ahpd/sdk';

/**
 * A fixture that opens the `notes` collection while it applies.
 *
 * The collection is left on `globalThis` for the test to use, because the
 * loader imports this module and the test does not hold it.
 */

export const name = 'notes';

export function apply(host: PluginHost): void {
  (globalThis as Record<string, unknown>).__notesCollection = host.records('notes', { body: 'text' });
}
