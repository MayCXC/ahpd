import type { PluginHost, PluginManifest } from '@ahpd/sdk';

/**
 * A fixture plugin that declares a manifest in both places.
 *
 * The package.json is the source a loader keeps, so what it reads here is
 * never what a client lists.
 */

export const name = 'declared-both';

export const manifest: PluginManifest = {
  description: 'Declares its manifest from the module.',
};

export function apply(_host: PluginHost): void {}
