import type { PluginHost } from '@ahpd/sdk';

/**
 * A fixture plugin whose manifest is its package.json.
 *
 * It registers nothing, because what these cases read is the manifest a client
 * lists rather than what the plugin contributes.
 */

export const name = 'declared';

export function apply(_host: PluginHost): void {}
