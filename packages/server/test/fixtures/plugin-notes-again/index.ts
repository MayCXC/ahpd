import type { PluginHost } from '@ahpd/sdk';

/** A fixture that opens the `notes` collection that the `notes` fixture opened first. */

export const name = 'notes-again';

export function apply(host: PluginHost): void {
  host.records('notes');
}
