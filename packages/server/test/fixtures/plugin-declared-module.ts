import type { PluginHost, PluginManifest } from '@ahpd/sdk';

/**
 * A fixture plugin whose manifest is its own export.
 *
 * Loaded by path rather than as a package, so there is no package.json to read
 * and the export is the only source.
 */

export const name = 'declared-module';

export const manifest: PluginManifest = {
  description: 'Declares its manifest from the module.',
  categories: ['channel'],
  links: [{ title: 'Docs', url: 'https://ahpd.dev/plugins' }],
  contracts: { channels: ['x-declared'] },
};

export function apply(_host: PluginHost): void {}
