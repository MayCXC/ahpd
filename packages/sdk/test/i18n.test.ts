import { describe, expect, it } from 'vitest';
import { localesOf, translated } from '../src/i18n.js';
import type { Catalogs } from '../src/i18n.js';

const host: Catalogs = {
  pt: { session: { branch: { title: 'Ramo', description: { long: 'not a leaf' } } } },
  'pt-BR': { session: { isolation: { title: 'Isolamento' } } },
};
const plugin: Catalogs = { pt: { session: { branch: { title: 'Ramo do plugin' } } } };

describe('localesOf', () => {
  it('answers the tag, then its language, without repeats', () => {
    expect(localesOf('pt-BR')).toEqual(['pt-BR', 'pt']);
    expect(localesOf('pt')).toEqual(['pt']);
    expect(localesOf(undefined)).toEqual([]);
    expect(localesOf('')).toEqual([]);
  });
});

describe('translated', () => {
  it('finds the language entry when the tag has none', () => {
    expect(translated(['session', 'branch', 'title'], 'Branch', 'pt-BR', host)).toBe('Ramo');
  });

  it('finds the tag entry before the language entry', () => {
    expect(translated(['session', 'isolation', 'title'], 'Isolation', 'pt-BR', host)).toBe('Isolamento');
    expect(translated(['session', 'isolation', 'title'], 'Isolation', 'pt', host)).toBe('Isolation');
  });

  it('answers the English text for a missing path, an unknown locale, or no locale', () => {
    expect(translated(['session', 'model', 'title'], 'Model', 'pt', host)).toBe('Model');
    expect(translated(['session', 'branch', 'title'], 'Branch', 'fr', host)).toBe('Branch');
    expect(translated(['session', 'branch', 'title'], 'Branch', undefined, host)).toBe('Branch');
  });

  it('answers the English text for a path that ends at an object', () => {
    expect(translated(['session', 'branch'], 'Branch', 'pt', host)).toBe('Branch');
    expect(translated(['session', 'branch', 'description'], 'Where', 'pt', host)).toBe('Where');
  });

  it('tries the catalogs in order, so the first one with the path wins', () => {
    expect(translated(['session', 'branch', 'title'], 'Branch', 'pt', plugin, host)).toBe('Ramo do plugin');
    expect(translated(['session', 'isolation', 'title'], 'Isolation', 'pt-BR', plugin, host)).toBe('Isolamento');
    expect(translated(['session', 'branch', 'title'], 'Branch', 'pt', undefined, host)).toBe('Ramo');
  });

  it('reads no inherited key as a path', () => {
    expect(translated(['constructor'], 'Constructor', 'pt', host)).toBe('Constructor');
    expect(translated(['session', 'toString'], 'x', 'toString', host)).toBe('x');
  });
});
