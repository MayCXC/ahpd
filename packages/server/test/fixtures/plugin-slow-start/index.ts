import { existsSync, writeFileSync } from 'node:fs';
import type { Plugin } from '@ahpd/sdk';

/**
 * A plugin that holds the daemon's start until the file `AHPD_RELEASE` names
 * exists, or thirty seconds have passed, after writing the daemon's pid to the
 * file `AHPD_STARTING` names.
 *
 * The daemon announces itself only once its plugins have applied, so a test
 * can signal the `ahpd start` waiting on it and still know which daemon to
 * look for.
 */

export const name = 'slow-start';

export const apply: Plugin['apply'] = () => new Promise<void>((done) => {
  const starting = process.env.AHPD_STARTING;
  if (starting !== undefined) writeFileSync(starting, String(process.pid));
  const release = process.env.AHPD_RELEASE;
  const until = Date.now() + 30_000;
  const look = (): void => {
    if (release === undefined || existsSync(release) || Date.now() > until) { done(); return; }
    setTimeout(look, 25);
  };
  look();
});
