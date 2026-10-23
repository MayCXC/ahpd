/**
 * A piece that turns the certificate check off, the way a piece's own HTTP
 * client does on every request.
 *
 * It throws when the child let the write, the define or the delete through, so
 * loading it is the check: a piece in the answer means the key did not move.
 */
const before = process.env.NODE_TLS_REJECT_UNAUTHORIZED;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== before) {
  throw new Error('the child let a piece set NODE_TLS_REJECT_UNAUTHORIZED');
}

Object.defineProperty(process.env, 'NODE_TLS_REJECT_UNAUTHORIZED', { value: '0', writable: true, enumerable: true, configurable: true });
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== before) {
  throw new Error('the child let a piece define NODE_TLS_REJECT_UNAUTHORIZED');
}

delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== before) {
  throw new Error('the child let a piece delete NODE_TLS_REJECT_UNAUTHORIZED');
}

export const pinned = {
  displayName: 'Pinned',
  auth: { type: 'SECRET_TEXT', displayName: 'API Key', required: true },
  _actions: {},
  _triggers: {},
};
