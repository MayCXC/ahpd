import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { logoOf, LOGO_LIMIT } from '../src/logos.js';

/*
 * The logo one piece publishes, read from the cache or fetched once.
 *
 * A fetch is handed in rather than reached for, so a case answers without a
 * network and can count how many times the piece was asked for.
 */

let home: string;
beforeEach(() => { home = mkdtempSync(join(tmpdir(), 'ahpd-logos-')); });
afterEach(() => { rmSync(home, { recursive: true, force: true }); });

/** The cache file of one piece, under the extension its type is kept as. */
const cache = (piece: string, extension = 'png'): string => join(home, 'activepieces', 'icons', `${piece}.${extension}`);

/** A fake fetch that answers one image, and counts the calls. */
function fetcher(body: Buffer, init: { status?: number; contentType?: string } = {}) {
  const calls: string[] = [];
  const answer = (async (url: string) => {
    calls.push(url);
    const response = new Response(new Uint8Array(body), {
      status: init.status ?? 200,
      headers: init.contentType === undefined ? {} : { 'content-type': init.contentType },
    });
    return response;
  }) as unknown as typeof fetch;
  return { calls, answer };
}

describe('logoOf', () => {
  it('reads a cached logo without a fetch', async () => {
    const body = Buffer.from('a cached logo');
    mkdirSync(join(home, 'activepieces', 'icons'), { recursive: true });
    writeFileSync(cache('ap-demo'), body);
    const fake = fetcher(Buffer.from('never'));

    const logo = await logoOf('ap-demo', 'https://example.com/demo.png', home, fake.answer);

    expect(fake.calls).toEqual([]);
    expect(logo.problem).toBeUndefined();
    expect(logo.icon).toEqual({ src: `data:image/png;base64,${body.toString('base64')}`, contentType: 'image/png' });
  });

  it('fetches a logo once, keeps it, and reads the cache after that', async () => {
    const body = Buffer.from('the logo');
    const fake = fetcher(body, { contentType: 'image/svg+xml' });

    const first = await logoOf('ap-demo', 'https://example.com/demo.svg', home, fake.answer);
    expect(first.problem).toBeUndefined();
    expect(first.icon).toEqual({ src: `data:image/svg+xml;base64,${body.toString('base64')}`, contentType: 'image/svg+xml' });
    expect(readFileSync(cache('ap-demo', 'svg'))).toEqual(body);

    const again = fetcher(Buffer.from('never'));
    const second = await logoOf('ap-demo', 'https://example.com/demo.svg', home, again.answer);
    expect(again.calls).toEqual([]);
    expect(second.icon).toBeDefined();
  });

  it('reads a cached SVG back as image/svg+xml, from the extension of its name', async () => {
    const body = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');
    mkdirSync(join(home, 'activepieces', 'icons'), { recursive: true });
    writeFileSync(cache('ap-demo', 'svg'), body);
    const fake = fetcher(Buffer.from('never'));

    const logo = await logoOf('ap-demo', 'https://example.com/demo.svg', home, fake.answer);

    expect(fake.calls).toEqual([]);
    expect(logo.problem).toBeUndefined();
    expect(logo.icon).toEqual({ src: `data:image/svg+xml;base64,${body.toString('base64')}`, contentType: 'image/svg+xml' });
  });

  it('answers a response that is not an image as image/png, and keeps it as a PNG', async () => {
    const body = Buffer.from('<html><body>not an image</body></html>');
    const fake = fetcher(body, { contentType: 'text/html' });

    const logo = await logoOf('ap-demo', 'https://example.com/demo', home, fake.answer);

    expect(logo.problem).toBeUndefined();
    expect(logo.icon).toEqual({ src: `data:image/png;base64,${body.toString('base64')}`, contentType: 'image/png' });
    expect(readFileSync(cache('ap-demo'))).toEqual(body);
  });

  it('answers no icon and one line when the fetch is not ok', async () => {
    const fake = fetcher(Buffer.from('gone'), { status: 404 });

    const logo = await logoOf('ap-demo', 'https://example.com/demo.png', home, fake.answer);

    expect(logo.icon).toBeUndefined();
    expect(logo.problem).toContain('HTTP 404');
    expect(existsSync(cache('ap-demo'))).toBe(false);
  });

  it('answers no icon and one line when the fetch throws', async () => {
    const failing = (async () => { throw new Error('the CDN is down'); }) as unknown as typeof fetch;

    const logo = await logoOf('ap-demo', 'https://example.com/demo.png', home, failing);

    expect(logo.icon).toBeUndefined();
    expect(logo.problem).toContain('the CDN is down');
  });

  it('answers no icon and one line for a body over 32 KB, and caches nothing', async () => {
    const fake = fetcher(Buffer.alloc(LOGO_LIMIT + 1, 'a'));

    const logo = await logoOf('ap-demo', 'https://example.com/demo.png', home, fake.answer);

    expect(logo.icon).toBeUndefined();
    expect(logo.problem).toContain('larger than 32 KB');
    expect(existsSync(cache('ap-demo'))).toBe(false);
  });

  it('makes no fetch when there is nowhere to cache', async () => {
    const fake = fetcher(Buffer.from('never'));

    const logo = await logoOf('ap-demo', 'https://example.com/demo.png', undefined, fake.answer);

    expect(logo).toEqual({});
    expect(fake.calls).toEqual([]);
  });

  it('answers nothing when the piece publishes no logo', async () => {
    const fake = fetcher(Buffer.from('never'));

    const logo = await logoOf('ap-demo', undefined, home, fake.answer);

    expect(logo).toEqual({});
    expect(fake.calls).toEqual([]);
  });
});
