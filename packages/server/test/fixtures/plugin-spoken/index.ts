import type { PluginHost } from '@ahpd/sdk';

/**
 * A fixture plugin whose package.json names a catalog folder in `ahpd.i18n`.
 *
 * It registers nothing, because what these cases read is the row a client
 * lists in its own locale.
 */

export const name = 'spoken';

export function apply(_host: PluginHost): void {}
