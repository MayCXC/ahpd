/**
 * The catalogs a plugin names in `ahpd.i18n`, read at load.
 *
 * The field names a folder inside the package, and each `<locale>.json` in it
 * is one catalog. A file that does not parse costs that catalog and one
 * problem line, and never the plugin; a folder that points outside the package
 * is refused whole, as an icon that does is.
 */

import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { basename, extname, join, resolve, sep } from 'node:path';
import { isRecord, reason } from '@ahpd/sdk';
import type { Catalog, Catalogs } from '@ahpd/sdk';

/** Whether `at` is `base` or a path under it. */
const inside = (at: string, base: string): boolean => at === base || at.startsWith(base + sep);

/**
 * One catalog with every value that is not an object or a string dropped.
 *
 * A number or a list at a path is not a text, and a lookup that met one would
 * answer English anyway, so it is not kept to be met.
 */
const cleaned = (value: Record<string, unknown>): Catalog => {
  const catalog: Catalog = {};
  for (const [key, one] of Object.entries(value)) {
    if (typeof one === 'string') catalog[key] = one;
    else if (isRecord(one)) catalog[key] = cleaned(one);
  }
  return catalog;
};

/**
 * The catalogs in the folder `folder` names, relative to `base`.
 *
 * `by` names the plugin in each problem line. Answers `undefined` when the
 * folder is refused or cannot be read, and an empty object for a folder that
 * holds no catalog.
 */
export const readCatalogs = (folder: string, base: string, by: string, problem: (line: string) => void): Catalogs | undefined => {
  const outside = (): undefined => {
    problem(`${by}: the i18n folder ${folder} points outside the plugin package`);
    return undefined;
  };
  const at = resolve(base, folder);
  if (!inside(at, base)) return outside();
  let real: string;
  let names: string[];
  try {
    // The real paths decide, for a name inside the package that links out of it.
    real = realpathSync(at);
    if (!inside(real, realpathSync(base))) return outside();
    names = readdirSync(real).filter((name) => extname(name) === '.json').sort();
  }
  catch {
    problem(`${by}: the i18n folder ${folder} could not be read`);
    return undefined;
  }
  const catalogs: Catalogs = {};
  for (const name of names) {
    const locale = basename(name, '.json');
    if (locale === '') continue;
    try {
      const found: unknown = JSON.parse(readFileSync(join(real, name), 'utf8'));
      if (!isRecord(found)) {
        problem(`${by}: the catalog ${folder}/${name} is not a JSON object`);
        continue;
      }
      catalogs[locale] = cleaned(found);
    }
    catch (error) {
      problem(`${by}: the catalog ${folder}/${name} could not be read: ${reason(error)}`);
    }
  }
  return catalogs;
};
