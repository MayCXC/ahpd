import type { Plugin } from '@ahpd/sdk';
import { echo } from '../../../../../examples/echo/agent.ts';

/**
 * An engine and no agent, as cofold and pi register since agents became
 * records: each record of `echoed` is the example backend under the record's id.
 */

export const name = 'engine-plugin';

export const apply: Plugin['apply'] = (host) => {
  host.registerEngine({
    name: 'echoed',
    title: 'Echoed',
    description: 'The example backend, opened from a record.',
    schema: { properties: { apiKey: { type: 'string', writeOnly: true } } },
    open: (record) => ({ ...echo({ path: host.path, pace: 0 }), provider: record.id, displayName: record.name }),
  });
};
