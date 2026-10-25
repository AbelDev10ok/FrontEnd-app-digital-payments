import { describe, expect, it } from 'vitest';
import { formatDateHour, getLocalDateString, toInputDate } from './formatDate';

describe('getLocalDateString', () => {
  it('usa la fecha local aunque la hora UTC cambie de día', () => {
    // 23:30 local: en UTC-3 la fecha UTC ya es el día siguiente.
    const tarde = new Date(2026, 0, 15, 23, 30, 0);
    expect(getLocalDateString(tarde)).toBe('2026-01-15');
  });

  it('usa la fecha local en la madrugada', () => {
    const madrugada = new Date(2026, 11, 31, 1, 0, 0);
    expect(getLocalDateString(madrugada)).toBe('2026-12-31');
  });

  it('rellena mes y día con ceros', () => {
    expect(getLocalDateString(new Date(2026, 2, 5))).toBe('2026-03-05');
  });
});

describe('toInputDate', () => {
  it('toma los strings YYYY-MM-DD tal cual, sin corrimiento de zona horaria', () => {
    expect(toInputDate('2026-01-15')).toBe('2026-01-15');
  });

  it('recorta la parte de fecha de un ISO con hora', () => {
    expect(toInputDate('2026-01-15T22:30:00')).toBe('2026-01-15');
  });

  it('no altera fechas límite de fin de año', () => {
    expect(toInputDate('2026-12-31')).toBe('2026-12-31');
    expect(toInputDate('2026-01-01')).toBe('2026-01-01');
  });
});

describe('formatDateHour', () => {
  it('muestra la fecha y la hora de un cobro sin corrimiento de zona horaria', () => {
    // La hora se lee tal cual viene del backend (hora local del servidor)
    expect(formatDateHour('2026-11-12T15:45:30')).toBe('12/11/2026 · 15:45');
  });

  it('muestra solo la fecha cuando no hay hora', () => {
    expect(formatDateHour('2026-11-12')).toBe('12/11/2026');
  });

  it('no corre la hora en cobros de la madrugada', () => {
    expect(formatDateHour('2026-11-12T00:05:00')).toBe('12/11/2026 · 00:05');
  });
});
