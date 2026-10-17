/**
 * What a woken message carries in front of the person's words.
 *
 * A back session works from its own `AGENTS.md` and its system prompt, which
 * are the bot's and are the same for every message it is woken by. What does
 * change from message to message - the chat it was said in, who said it and
 * when - is said per message, in a block put in front of the text the harness
 * is given. The system prompt does not change for each message, so nothing
 * that changes per message is written there.
 *
 * The block has a fixed shape: one `name: value` line per field, in the order
 * the fields are given, between an opening and a closing tag. A later plan can
 * add a line - the open tasks, a hint from memory - without changing how a
 * model reads the lines that are already there.
 */

/** What a context block is written from: fields, in the order they are written. */
export type ContextFields = readonly (readonly [name: string, value: string])[];

/**
 * One context block, as it is put in front of a woken message.
 *
 * A field with an empty value is left out rather than written as a bare name:
 * the block is what is known about the message, and a line with nothing after
 * it says nothing. With no fields at all, the block is the two tags and no
 * lines between them.
 */
export const contextBlock = (fields: ContextFields): string => [
  '<context>',
  ...fields.filter(([, value]) => value !== '').map(([name, value]) => `${name}: ${value}`),
  '</context>',
].join('\n');

/**
 * One time as an ISO 8601 stamp in the host's own offset.
 *
 * `toISOString` writes `Z`, which is the same instant in UTC: true, and not
 * the time a person reading it beside the message keeps. This is that instant
 * written with the offset the host's clock is running on, so a host in Sao
 * Paulo writes `-03:00` and one in Berlin writes `+02:00`, and both say the
 * time it was there.
 */
export const timeWithOffset = (at: Date): string => {
  const pad = (value: number, width = 2): string => String(value).padStart(width, '0');
  // `getTimezoneOffset` is minutes *behind* UTC, so a place east of Greenwich
  // has a negative number and the offset written here is its negation.
  const offset = -at.getTimezoneOffset();
  const sign = offset < 0 ? '-' : '+';
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}` +
    `T${pad(at.getHours())}:${pad(at.getMinutes())}:${pad(at.getSeconds())}.${pad(at.getMilliseconds(), 3)}` +
    `${sign}${pad(hours)}:${pad(minutes)}`;
};
