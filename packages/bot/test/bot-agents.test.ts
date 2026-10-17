import { expect, it } from 'vitest';
import { AGENTS_VERSION, readAgents, writeAgents } from '../src/agents.js';
import { agentsFilled, DEFAULT_AGENTS_TEMPLATE } from '../src/template.js';
import type { AgentsParts } from '../src/agents.js';
import type { BotRecord } from '../src/record.js';

/*
 * The parts of an AGENTS.md that belong to the bot's owner: the frontmatter
 * keys `version`, `name` and `description`, and the text under
 * `## Instructions`. The rest of the file is the bot's own and is not read or
 * changed here.
 */

const parts = (over: Partial<AgentsParts> = {}): AgentsParts => ({
  version: 1,
  name: 'Motion',
  description: 'A careful reviewer.',
  instructions: 'Be calm.',
  ...over,
});

const FULL = `---
version: 1
name: Motion
description: A careful reviewer.
colour: red
---

## Instructions

Be calm.
Be kind.

## How you work

The rest is the bot's.
`;

it('reads the owner parts of a full file', () => {
  expect(readAgents(FULL)).toEqual({
    version: 1,
    name: 'Motion',
    description: 'A careful reviewer.',
    instructions: 'Be calm.\nBe kind.',
  });
});

it('reads a file with no frontmatter as empty parts and its section', () => {
  expect(readAgents('# Motion\n\n## Instructions\n\nBe calm.\n')).toEqual({
    version: undefined,
    name: '',
    description: '',
    instructions: 'Be calm.',
  });
});

it('reads a file with no Instructions section as empty instructions', () => {
  expect(readAgents('---\nversion: 1\nname: Motion\n---\n\n# Motion\n')).toEqual({
    version: 1,
    name: 'Motion',
    description: '',
    instructions: '',
  });
});

it('reads the default template filled with a bot as that bot words', () => {
  const bot: BotRecord = {
    id: 'motion',
    name: 'Motion',
    labels: [],
    body: 'robot',
    color: 'red',
    session: 'work',
    workspace: '/bots/motion',
    owner: 'user:soft',
    createdAt: '2026-10-14T00:00:00.000Z',
    updatedAt: '2026-10-14T00:00:00.000Z',
    description: 'A careful reviewer.',
    instructions: 'Be calm.',
  };
  expect(readAgents(agentsFilled(bot, DEFAULT_AGENTS_TEMPLATE))).toEqual({
    version: 1,
    name: 'Motion',
    description: 'A careful reviewer.',
    instructions: 'Be calm.',
  });
});

it('changes only the owner parts and keeps every other byte', () => {
  const edited = writeAgents(FULL, parts({ name: 'Reviewer', description: 'Reads code.', instructions: 'Be kind.\nBe exact.' }));
  expect(edited).toBe(`---
version: 1
name: Reviewer
description: Reads code.
colour: red
---

## Instructions

Be kind.
Be exact.

## How you work

The rest is the bot's.
`);
  expect(edited).toContain('colour: red');
});

it('quotes a description with a colon or a quote so it reads back the same', () => {
  const description = 'Reviews code: carefully, "at times".';
  expect(readAgents(writeAgents(FULL, parts({ description }))).description).toBe(description);
});

it('adds the Instructions section after the frontmatter when the file has none', () => {
  const text = '---\nversion: 1\nname: Motion\ndescription: Empty\n---\n\n## Notes\n\nKeep this.\n';
  expect(writeAgents(text, parts({ description: 'Empty' }))).toBe(`---
version: 1
name: Motion
description: Empty
---

## Instructions

Be calm.

## Notes

Keep this.
`);
});

it('adds the frontmatter to a file with none and keeps its text', () => {
  expect(writeAgents('## Notes\n\nKeep this.\n', parts())).toBe(`---
version: 1
name: Motion
description: A careful reviewer.
---

## Instructions

Be calm.

## Notes

Keep this.
`);
});

it('reads a section emptied by an edit as empty', () => {
  expect(readAgents(writeAgents(FULL, parts({ instructions: '' }))).instructions).toBe('');
});

it('keeps the layout version a file already names when the parts name none', () => {
  const text = '---\nversion: 2\nname: Motion\n---\n';
  expect(readAgents(writeAgents(text, parts({ version: undefined, instructions: '' }))).version).toBe(2);
});

it('writes the layout version when neither the parts nor the file name one', () => {
  const text = writeAgents('# Motion\n', parts({ version: undefined, instructions: '' }));
  expect(readAgents(text).version).toBe(AGENTS_VERSION);
});
