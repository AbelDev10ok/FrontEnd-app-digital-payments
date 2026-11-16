import { describe, expect, it } from 'vitest';
import { PROVINCIAS } from './provincias';

describe('PROVINCIAS', () => {
  it('lista las 24 jurisdicciones sin repetir', () => {
    expect(PROVINCIAS).toHaveLength(24);
    expect(new Set(PROVINCIAS).size).toBe(24);
  });

  it('incluye CABA y las provincias con acentos', () => {
    expect(PROVINCIAS).toContain('CABA');
    expect(PROVINCIAS).toContain('Córdoba');
    expect(PROVINCIAS).toContain('Tucumán');
  });
});
