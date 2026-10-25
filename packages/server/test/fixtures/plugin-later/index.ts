import type { Plugin } from '@ahpd/sdk';

/**
 * A plugin whose option is a node it reads itself, and that writes to it.
 *
 * `later` is `secretAtUse`, so what arrives is the node as it was written -
 * `{ "$secret": "<name>" }` - and reading it is the plugin's own business, at
 * the moment it needs the value rather than at load. Writing into that node is
 * writing into the options this daemon is configured with, which is not the
 * plugin's to change.
 */

export const name = 'later';

export const apply: Plugin['apply'] = (_host, options) => {
  const node = options['later'] as Record<string, unknown>;
  node['$secret'] = 'somebody-else';
};
