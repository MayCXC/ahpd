import type { Plugin } from '@ahpd/sdk';

/**
 * A plugin that says whether the daemon's environment holds `AHPD_DETACHED` or
 * `AHPD_SERVICE`.
 *
 * A session's shell is spawned with the daemon's environment as it is, so what
 * this reads at load is what every shell would inherit.
 */

export const name = 'env';

export const apply: Plugin['apply'] = (host) => {
  host.say(`AHPD_DETACHED ${process.env['AHPD_DETACHED'] ?? 'unset'}`);
  host.say(`AHPD_SERVICE ${process.env['AHPD_SERVICE'] ?? 'unset'}`);
};
