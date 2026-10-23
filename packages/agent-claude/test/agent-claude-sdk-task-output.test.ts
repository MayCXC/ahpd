import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { expect, it } from 'vitest';

/*
 * The one call this backend reads a background shell's output with.
 *
 * `getTaskOutput` is on a query and `get_task_output` is on the wire, and the
 * package declares neither the method on `Query` nor the shape it answers - so
 * `session/taskoutput.ts` carries its own copy. This reads the installed
 * package and fails the moment it stops shipping what that copy describes,
 * which is the only thing that would turn the copy into a lie.
 */

const entry = createRequire(import.meta.url).resolve('@anthropic-ai/claude-agent-sdk');
const beside = (name: string): string => join(dirname(entry), name);

it('still ships getTaskOutput on the query', () => {
  expect(readFileSync(entry, 'utf8')).toMatch(/getTaskOutput\(/);
});

it('still declares the request and the answer the poll reads', () => {
  const types = readFileSync(beside('sdk.d.ts'), 'utf8');
  // The request the method sends, and the three fields the answer carries.
  expect(types).toContain("subtype: 'get_task_output'");
  expect(types).toMatch(/total_bytes: number/);
  expect(types).toMatch(/truncated: boolean/);
});
