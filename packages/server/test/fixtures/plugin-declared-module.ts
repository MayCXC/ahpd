import type { PluginHost } from '@ahpd/sdk';

/**
 * A fixture plugin whose manifest is the `plugin.json` beside it.
 *
 * Loaded by path rather than as a package, so the file is the only place the
 * manifest is written; the loader reads it with no import.
 */

export const name = 'declared-module';

export function apply(_host: PluginHost): void {}
