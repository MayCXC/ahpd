/**
 * The Responses id the proxy sends, and the provider's id inside it.
 *
 * A provider's own id says nothing of the connector that made it, so a
 * follow-up would have nowhere to go. The id the caller sees is `resp_` and
 * then the base64url of `<connector id>:<the provider's id>`, which is also the
 * prefix the OpenAI SDKs expect. The connector is decoded from it before a
 * follow-up is sent, and the provider's id replaces it on the way out.
 *
 * Every answer is rewritten on its way to the caller: a JSON answer whole, and
 * an SSE stream line by line as it passes, so a streamed call carries the
 * proxy's id too.
 */

import { isRecord } from '@ahpd/sdk';

/** What a Responses id holds. */
export interface DecodedResponseId {
  /** The connector that made the response. */
  connector: string;
  /** The provider's own id, which is what a follow-up is sent with. */
  id: string;
}

/** The prefix an OpenAI Responses id carries. */
export const RESPONSE_PREFIX = 'resp_';

/** The proxy's id for one provider response, as `resp_<base64url>` . */
export const encodeResponseId = (connector: string, id: string): string =>
  `${RESPONSE_PREFIX}${Buffer.from(`${connector}:${id}`, 'utf8').toString('base64url')}`;

/** What a proxy id holds, or nothing when it is not one of this proxy's ids. */
export const decodeResponseId = (value: string): DecodedResponseId | undefined => {
  if (!value.startsWith(RESPONSE_PREFIX)) return undefined;
  const raw = value.slice(RESPONSE_PREFIX.length);
  if (raw === '' || !/^[A-Za-z0-9_-]+$/u.test(raw)) return undefined;
  const text = Buffer.from(raw, 'base64url').toString('utf8');
  // A lenient decoder would accept almost any run of characters, so the text
  // must encode back to exactly the id that came in.
  if (Buffer.from(text, 'utf8').toString('base64url') !== raw) return undefined;
  const at = text.indexOf(':');
  if (at <= 0 || at === text.length - 1) return undefined;
  return { connector: text.slice(0, at), id: text.slice(at + 1) };
};

/** A response id, encoded once. */
const rewriteField = (holder: Record<string, unknown>, field: string, connector: string): void => {
  if (typeof holder[field] === 'string') holder[field] = encodeResponseId(connector, holder[field] as string);
};

/**
 * Rewrite a response object's ids in place.
 *
 * `id` is rewritten when the object is a response or a deleted response, and
 * `previous_response_id` wherever a response carries one. An output item's own
 * `id` is not a response id and is left alone.
 */
export const rewriteObject = (value: unknown, connector: string): void => {
  if (!isRecord(value)) return;
  const response = value['response'];
  if (isRecord(response)) {
    rewriteField(response, 'id', connector);
    rewriteField(response, 'previous_response_id', connector);
  }
  const object = value['object'];
  if (typeof object === 'string' && object.startsWith('response')) rewriteField(value, 'id', connector);
  rewriteField(value, 'previous_response_id', connector);
};

/** A `JSON.parse` that answers nothing rather than throwing. */
const parse = (text: string): unknown => {
  try { return JSON.parse(text) as unknown; }
  catch { return undefined; }
};

/** One SSE line with its `data:` payload rewritten, or the line unchanged. */
const rewriteLine = (line: string, connector: string): string => {
  if (!line.startsWith('data:')) return line;
  const value = parse(line.slice(5).trim());
  if (value === undefined) return line;
  rewriteObject(value, connector);
  return `data: ${JSON.stringify(value)}`;
};

/** A stream that rewrites every SSE event's response id as the event passes. */
const rewritingStream = (connector: string): TransformStream<Uint8Array, Uint8Array> => {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let held = '';
  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      held += decoder.decode(chunk, { stream: true });
      for (let at = held.indexOf('\n'); at !== -1; at = held.indexOf('\n')) {
        let line = held.slice(0, at);
        held = held.slice(at + 1);
        const carriage = line.endsWith('\r');
        if (carriage) line = line.slice(0, -1);
        controller.enqueue(encoder.encode(`${rewriteLine(line, connector)}${carriage ? '\r' : ''}\n`));
      }
    },
    flush(controller) {
      held += decoder.decode();
      if (held === '') return;
      const carriage = held.endsWith('\r');
      const line = carriage ? held.slice(0, -1) : held;
      controller.enqueue(encoder.encode(`${rewriteLine(line, connector)}${carriage ? '\r' : ''}`));
    },
  });
};

/**
 * One answer with the provider's response ids replaced by the proxy's.
 *
 * A JSON answer is read whole, because its id may be anywhere and rewriting it
 * needs the parsed object. An SSE stream is rewritten line by line and never
 * held beyond the line arriving. Any other body is passed through unchanged.
 */
export const rewriteAnswer = async (response: Response, connector: string): Promise<Response> => {
  const type = (response.headers.get('content-type') ?? '').toLowerCase();
  if (type.includes('text/event-stream')) {
    if (response.body === null) return response;
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(response.body.pipeThrough(rewritingStream(connector)), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  if (!type.includes('json')) return response;
  const text = await response.text();
  const value = parse(text);
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  if (value === undefined) return new Response(text, { status: response.status, statusText: response.statusText, headers });
  rewriteObject(value, connector);
  return new Response(JSON.stringify(value), { status: response.status, statusText: response.statusText, headers });
};
