import { writeFileSync } from 'node:fs';
import type { Plugin } from '@ahpd/sdk';

/**
 * A plugin that leaves a file behind the moment it is imported.
 *
 * Its package.json names it, so a listing can key its row without importing it;
 * the file the module writes is how a test tells whether anything did.
 */

const marker = process.env['AHPD_MARKER'];
if (marker !== undefined) writeFileSync(marker, 'imported\n');

export const name = 'marker-off';

export const optionsSchema = { type: 'object', properties: { level: { type: 'integer' } } };

export const apply: Plugin['apply'] = () => {};
