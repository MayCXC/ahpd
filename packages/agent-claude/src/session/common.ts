export { bag, str } from '@ahpd/sdk';

export const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** What the SDK takes as an id of our choosing, a session's or a prompt's. */
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
