import { createPrivateKey, generateKeyPairSync } from 'node:crypto';
import type { JsonWebKey, KeyObject } from 'node:crypto';
import { join } from 'node:path';
import { readJsonObject, reason, writeJsonAtomic } from '@ahpd/sdk';

/**
 * The VAPID key pair a host signs its web pushes with.
 *
 * One pair per host, kept beside the devices in `push-vapid.json` with the same
 * care: written whole, at a mode only its owner may read, and read at load. The
 * file holds the private key as a JWK, because that is the one form both this
 * module and `node:crypto` read back without a parser.
 *
 * A pair that is there and cannot be used is not replaced. Every browser that
 * subscribed did so against the public key of the pair in this file, and a new
 * pair would make every one of those subscriptions fail until each browser
 * subscribed again - so a broken file turns web push off and says so, and a
 * person decides whether to remove it and let the next load make a new pair.
 */

/** The name of the file the pair is kept in, under the daemon's configuration folder. */
const FILE = 'push-vapid.json';

/** What a host signs a VAPID JWT with. */
export interface Vapid {
  /** The public key, as the 65-octet uncompressed point, in base64url. */
  publicKey: string;
  /** The private key, for an ES256 signature. */
  privateKey: KeyObject;
}

/** The uncompressed point of a JWK's two coordinates, or nothing when they are not 32 octets each. */
const pointOf = (x: string, y: string): string | undefined => {
  const along = Buffer.from(x, 'base64url');
  const up = Buffer.from(y, 'base64url');
  if (along.length !== 32 || up.length !== 32) return undefined;
  return Buffer.concat([Buffer.from([0x04]), along, up]).toString('base64url');
};

/** A pair read from the file's value, or nothing when it does not hold one this host can sign with. */
const pairOf = (said: unknown): Vapid | undefined => {
  if (typeof said !== 'object' || said === null || Array.isArray(said)) return undefined;
  const held = (said as Record<string, unknown>)['privateKey'];
  if (typeof held !== 'object' || held === null || Array.isArray(held)) return undefined;
  const jwk = held as Record<string, unknown>;
  if (jwk['kty'] !== 'EC' || jwk['crv'] !== 'P-256') return undefined;
  const x = jwk['x'];
  const y = jwk['y'];
  if (typeof x !== 'string' || typeof y !== 'string') return undefined;
  const publicKey = pointOf(x, y);
  if (publicKey === undefined) return undefined;
  try {
    return { publicKey, privateKey: createPrivateKey({ key: held as JsonWebKey, format: 'jwk' }) };
  }
  catch {
    return undefined;
  }
};

/** A new pair, and the file it is written as. */
const made = (): { vapid: Vapid; file: Record<string, unknown> } => {
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const jwk = privateKey.export({ format: 'jwk' });
  const x = jwk.x ?? '';
  const y = jwk.y ?? '';
  const publicKey = pointOf(x, y);
  if (publicKey === undefined) throw new Error('a P-256 key pair exported no point');
  return { vapid: { publicKey, privateKey }, file: { privateKey: jwk } };
};

/**
 * The host's pair, made at the first load and read after that.
 *
 * `onProblem` hears the one line a file this module cannot use is worth, and
 * the answer is then nothing: a host with no pair serves no public key and
 * skips every web device. A file that is not there is a host that has never
 * made a pair, and that is when one is made and written.
 */
export const loadVapid = (configDir: string, onProblem: (line: string) => void): Vapid | undefined => {
  const file = join(configDir, FILE);
  const read = readJsonObject(file);

  if (read.ok) {
    const pair = pairOf(read.value);
    if (pair !== undefined) return pair;
    onProblem(`${file} does not hold a P-256 key pair; web push is off until it does`);
    return undefined;
  }

  if (read.kind !== 'missing') {
    onProblem(`${file} could not be read; web push is off until it does`);
    return undefined;
  }

  const { vapid, file: value } = made();
  try {
    writeJsonAtomic(file, value, { mode: 0o600 });
  }
  catch (error) {
    onProblem(`${file} could not be written (${reason(error)}); web push is off until it can be`);
    return undefined;
  }
  return vapid;
};
