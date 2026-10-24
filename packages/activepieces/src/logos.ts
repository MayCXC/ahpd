/**
 * The logo one Activepieces piece publishes, as the icon a client draws.
 *
 * A piece names its logo as a URL, and the plugin turns it into the `data:`
 * form a client draws. The fetch happens once for each piece: what it reads is
 * kept in the daemon's configuration folder, and a start after that reads the
 * file rather than the network.
 *
 * A logo is decoration, so a fetch that fails, takes too long or answers
 * something too large costs the icon and one line; it never fails the load.
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Icon } from '@ahpd/sdk';

/** The most one logo may be, in bytes, whether it came from the cache or the network. */
export const LOGO_LIMIT = 32 * 1024;

/** How long one fetch may take before the icon is given up. */
const LOGO_TIMEOUT_MS = 5_000;

/** What one piece's logo came to: an icon, or the line saying why there is none. */
export interface Logo {
  /** The icon to put on the piece's adapter, when there is one. */
  icon?: Icon;
  /** One line naming the piece and what kept its logo away. */
  problem?: string;
}

/** One line saying what went wrong, without a stack. */
const reason = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** The folder a piece's logo is kept in. */
const folderOf = (dir: string): string => join(dir, 'activepieces', 'icons');

/** The extension a logo of one type is kept under. */
const extensionOf = (contentType: string): string => {
  if (contentType === 'image/svg+xml') return 'svg';
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/x-icon' || contentType === 'image/vnd.microsoft.icon') return 'ico';
  const subtype = contentType.slice(contentType.indexOf('/') + 1).replace(/[^a-z0-9]/gi, '').toLowerCase();
  return subtype === '' ? 'png' : subtype;
};

/** The type a cached logo was kept under, read back from its extension. */
const typeOf = (extension: string): string => {
  if (extension === 'svg') return 'image/svg+xml';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'ico') return 'image/x-icon';
  return `image/${extension}`;
};

/**
 * The cached logo of one piece, if the folder holds one.
 *
 * The file is named after the extension of its type, so the type survives the
 * start that wrote it and the next start reads it back from the name.
 */
const cachedOf = (folder: string, piece: string): { at: string; contentType: string } | undefined => {
  let names: string[];
  try {
    names = readdirSync(folder);
  }
  catch {
    return undefined;
  }
  const prefix = `${piece}.`;
  const name = names.filter((one) => one.startsWith(prefix) && one.length > prefix.length).sort()[0];
  if (name === undefined) return undefined;
  return { at: join(folder, name), contentType: typeOf(name.slice(prefix.length)) };
};

/** The type an answer is taken to be: only an image is drawn, and anything else is a PNG. */
const typeOfHeader = (header: string | null): string => {
  const held = (header ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  return held.startsWith('image/') ? held : 'image/png';
};

/** One logo as the icon a client draws, with the type it is kept under. */
const iconOf = (bytes: Buffer, contentType: string): Icon => ({
  src: `data:${contentType};base64,${bytes.toString('base64')}`,
  contentType,
});

/**
 * The icon of one piece, read from the cache or fetched once.
 *
 * `dir` is the daemon's configuration folder, which is where the cache lives.
 * Absent, there is nowhere to keep the logo, so the promise of one fetch for
 * each piece cannot be kept and no fetch is made.
 *
 * `fetcher` is a parameter so a test can answer without a network, and the
 * same argument `fetch` takes otherwise.
 */
export async function logoOf(
  piece: string,
  url: string | undefined,
  dir: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<Logo> {
  if (dir === undefined || dir === '') return {};
  const folder = folderOf(dir);

  const cached = cachedOf(folder, piece);
  if (cached !== undefined) {
    try {
      const bytes = readFileSync(cached.at);
      if (bytes.length <= LOGO_LIMIT) {
        return { icon: iconOf(bytes, cached.contentType) };
      }
    }
    catch {
      // A cache that cannot be read is a miss, and the URL is tried instead.
    }
  }

  if (url === undefined || url === '') return {};

  let answer: Response;
  try {
    answer = await fetcher(url, { signal: AbortSignal.timeout(LOGO_TIMEOUT_MS) });
  }
  catch (error) {
    return { problem: `the logo of ${piece} could not be fetched: ${reason(error)}` };
  }
  if (!answer.ok) {
    return { problem: `the logo of ${piece} could not be fetched: HTTP ${String(answer.status)}` };
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(await answer.arrayBuffer());
  }
  catch (error) {
    return { problem: `the logo of ${piece} could not be read: ${reason(error)}` };
  }
  if (bytes.length > LOGO_LIMIT) {
    return { problem: `the logo of ${piece} is larger than ${LOGO_LIMIT / 1024} KB` };
  }

  const contentType = typeOfHeader(answer.headers.get('content-type'));
  const cache = join(folder, `${piece}.${extensionOf(contentType)}`);
  try {
    mkdirSync(folder, { recursive: true });
    writeFileSync(cache, bytes);
  }
  catch (error) {
    // The icon is still drawn this time; only the next start fetches again.
    return {
      icon: iconOf(bytes, contentType),
      problem: `the logo of ${piece} could not be cached: ${reason(error)}`,
    };
  }
  return { icon: iconOf(bytes, contentType) };
}
