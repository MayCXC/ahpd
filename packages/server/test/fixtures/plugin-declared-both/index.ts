import type { PluginHost } from '@ahpd/sdk';

/**
 * A fixture plugin whose package.json holds its manifest.
 *
 * It used to export one too; the loader reads the declaration now, and a
 * module that still exports a manifest is refused.
 */

export const name = 'declared-both';

export function apply(_host: PluginHost): void {}
