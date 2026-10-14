import { expect, it } from 'vitest';
import { fillWords } from '../src/index.js';

/*
 * The filler a template and a wake message share: each `{{word}}` the map
 * holds is filled, and any other name is left as written.
 */

it('fills each word of the map', () => {
  expect(fillWords('You are {{name}}. {{description}}', { name: 'Motion', description: 'A reviewer.' }))
    .toBe('You are Motion. A reviewer.');
});

it('fills a word that occurs twice', () => {
  expect(fillWords('{{name}} and {{name}}', { name: 'Motion' })).toBe('Motion and Motion');
});

it('leaves a word the map does not hold as written', () => {
  expect(fillWords('{{name}} {{other}} {{event.repo}}', { name: 'Motion' })).toBe('Motion {{other}} {{event.repo}}');
});

it('fills an empty value as nothing', () => {
  expect(fillWords('[{{description}}]', { description: '' })).toBe('[]');
});

it('fills a dotted name the map holds whole', () => {
  expect(fillWords('{{event.repo}}', { 'event.repo': 'ahpd' })).toBe('ahpd');
});

it('takes a word inherited from the map prototype as unknown', () => {
  expect(fillWords('{{toString}}', {})).toBe('{{toString}}');
});
