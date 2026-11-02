import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../../..');
const css = readFileSync(path.join(root, 'src', 'index.css'), 'utf8');

function blockAfter(src: string, marker: string): string {
  const i = src.indexOf(marker);
  expect(i, `bloque no encontrado: ${marker}`).toBeGreaterThanOrEqual(0);
  const open = src.indexOf('{', i);
  let depth = 0;
  let j = open;
  for (; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) break;
  }
  return src.slice(open + 1, j);
}
function vars(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/(--c-[a-z0-9-]+)\s*:\s*([0-9]+\s+[0-9]+\s+[0-9]+)\s*;/g)) {
    out[m[1]] = m[2].replace(/\s+/g, ' ').trim();
  }
  return out;
}
const toRgb = (hex: string) =>
  [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)].join(' ');

const rootVars = vars(blockAfter(css, ':root,'));
const printVars = vars(blockAfter(css, '@media print'));

/** Valores hex documentados: los que cada token reemplaza (Tailwind v3 + paleta brand). */
const EXPECTED: Record<string, string> = {
  '--c-page': '#f9fafb', '--c-surface': '#ffffff', '--c-field': '#ffffff', '--c-heading': '#07261c',
  '--c-brand-50': '#eefaf4', '--c-brand-100': '#d7f2e4', '--c-brand-200': '#b0e5cb',
  '--c-brand-600': '#1a8059', '--c-brand-700': '#166749', '--c-brand-800': '#13523b', '--c-brand-900': '#114332',
  '--c-gray-50': '#f9fafb', '--c-gray-100': '#f3f4f6', '--c-gray-200': '#e5e7eb', '--c-gray-300': '#d1d5db',
  '--c-gray-400': '#9ca3af', '--c-gray-500': '#6b7280', '--c-gray-600': '#4b5563', '--c-gray-700': '#374151',
  '--c-gray-800': '#1f2937', '--c-gray-900': '#111827',
  '--c-red-50': '#fef2f2', '--c-red-100': '#fee2e2', '--c-red-200': '#fecaca', '--c-red-300': '#fca5a5',
  '--c-red-600': '#dc2626', '--c-red-700': '#b91c1c', '--c-red-800': '#991b1b', '--c-red-900': '#7f1d1d',
  '--c-amber-50': '#fffbeb', '--c-amber-100': '#fef3c7', '--c-amber-200': '#fde68a', '--c-amber-300': '#fcd34d',
  '--c-amber-600': '#d97706', '--c-amber-700': '#b45309', '--c-amber-800': '#92400e', '--c-amber-900': '#78350f',
  '--c-emerald-50': '#ecfdf5', '--c-emerald-100': '#d1fae5', '--c-emerald-200': '#a7f3d0', '--c-emerald-300': '#6ee7b7',
  '--c-emerald-600': '#059669', '--c-emerald-700': '#047857', '--c-emerald-800': '#065f46', '--c-emerald-900': '#064e3b',
  '--c-purple-50': '#faf5ff', '--c-purple-100': '#f3e8ff', '--c-purple-200': '#e9d5ff', '--c-purple-300': '#d8b4fe',
  '--c-purple-600': '#9333ea', '--c-purple-700': '#7e22ce', '--c-purple-800': '#6b21a8', '--c-purple-900': '#581c87',
};

describe('tokens de tema', () => {
  it('S4: cada valor claro de :root es idéntico al hex que reemplaza', () => {
    for (const [name, hex] of Object.entries(EXPECTED)) {
      expect(rootVars[name], name).toBe(toRgb(hex));
    }
    expect(Object.keys(rootVars).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it('S5: @media print restaura todos los valores de :root', () => {
    for (const [name, value] of Object.entries(rootVars)) {
      expect(printVars[name], name).toBe(value);
    }
  });

  it('S4: los tokens literales conservan los hex que reemplazan', () => {
    const tw = readFileSync(path.join(root, 'tailwind.config.js'), 'utf8');
    expect(tw).toMatch(/DEFAULT: '#1a8059'/);      // bg-brand-600 -> bg-action
    expect(tw).toMatch(/hover: '#166749'/);        // hover:bg-brand-700 -> hover:bg-action-hover
    expect(tw).toMatch(/DEFAULT: '#dc2626'/);      // bg-red-600 -> bg-danger-solid
    expect(tw).toMatch(/hover: '#b91c1c'/);        // hover:bg-red-700 -> hover:bg-danger-solid-hover
    expect(tw).toMatch(/'on-dark': '#ffffff'/);    // bg-white/N -> bg-on-dark/N
    expect(tw).toMatch(/300: '#7fd2ac'/);          // brand literal
    expect(tw).toMatch(/950: '#07261c'/);
  });

  it('S1/S4: no quedan clases de color sin tematizar en src/', () => {
    const banned = /bg-white|via-white|to-white|text-brand-950|bg-brand-600|bg-brand-700|bg-red-600|bg-red-700/;
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const p = path.join(dir, entry);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(entry) && entry !== 'themeTokens.test.ts') {
          readFileSync(p, 'utf8').split(/\r?\n/).forEach((line, i) => {
            if (banned.test(line)) offenders.push(`${p}:${i + 1}`);
          });
        }
      }
    };
    walk(path.join(root, 'src'));
    expect(offenders).toEqual([]);
  });
});
