import type { PluginHost } from '@ahpd/sdk';

/** A fixture plugin whose manifest links is not a list, so the loader refuses it. */

export const name = 'bad-links';

export function apply(_host: PluginHost): void {}
