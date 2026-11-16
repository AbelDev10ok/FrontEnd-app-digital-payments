import { describe, expect, it } from 'vitest';
import {
  buildTelHref,
  buildWhatsAppUrl,
  formatearTelefono,
  normalizarTelefonoArgentino,
  telefonoNacional,
} from './telefono';

describe('normalizarTelefonoArgentino', () => {
  it('normaliza el numero nacional de 10 digitos', () => {
    expect(normalizarTelefonoArgentino('1155551234')).toBe('+5491155551234');
    expect(normalizarTelefonoArgentino('11 5555-1234')).toBe('+5491155551234');
  });

  it('saca el 0 inicial del formato nacional', () => {
    expect(normalizarTelefonoArgentino('01155551234')).toBe('+5491155551234');
  });

  it('saca el 0 y el 15 del formato viejo', () => {
    expect(normalizarTelefonoArgentino('011 15 5555-1234')).toBe('+5491155551234');
    expect(normalizarTelefonoArgentino('0351 15 555-1234')).toBe('+5493515551234');
    expect(normalizarTelefonoArgentino('02983 15 55-1234')).toBe('+5492983551234');
  });

  it('acepta el formato movil sin 0', () => {
    expect(normalizarTelefonoArgentino('351 15 555-1234')).toBe('+5493515551234');
  });

  it('respeta un numero que ya viene en formato internacional', () => {
    expect(normalizarTelefonoArgentino('+54 9 11 5555-1234')).toBe('+5491155551234');
    expect(normalizarTelefonoArgentino('5491155551234')).toBe('+5491155551234');
    expect(normalizarTelefonoArgentino('541155551234')).toBe('+5491155551234');
  });

  it('rechaza numeros invalidos', () => {
    expect(normalizarTelefonoArgentino('')).toBeNull();
    expect(normalizarTelefonoArgentino(null)).toBeNull();
    expect(normalizarTelefonoArgentino('sin numero')).toBeNull();
    expect(normalizarTelefonoArgentino('123')).toBeNull();
    expect(normalizarTelefonoArgentino('0981123456')).toBeNull();
    expect(normalizarTelefonoArgentino('11555512345')).toBeNull();
  });
});

describe('telefonoNacional', () => {
  it('devuelve el numero nacional de un E.164 argentino', () => {
    expect(telefonoNacional('+5491155551234')).toBe('1155551234');
  });

  it('devuelve null si no se puede normalizar', () => {
    expect(telefonoNacional('0981123456')).toBeNull();
  });
});

describe('formatearTelefono', () => {
  it('muestra el numero nacional y deja intacto el legado', () => {
    expect(formatearTelefono('+5491155551234')).toBe('1155551234');
    expect(formatearTelefono('0981-555-123')).toBe('0981-555-123');
    expect(formatearTelefono(null)).toBe('');
  });
});

describe('buildTelHref', () => {
  it('quita espacios y guiones del telefono cargado', () => {
    expect(buildTelHref('0981-555-123')).toBe('tel:0981555123');
    expect(buildTelHref('(011) 4444 5555')).toBe('tel:01144445555');
  });

  it('conserva el + internacional al principio', () => {
    expect(buildTelHref('+54 9 11 5555-6666')).toBe('tel:+5491155556666');
  });

  it('devuelve null sin telefono o sin digitos', () => {
    expect(buildTelHref('')).toBeNull();
    expect(buildTelHref('   ')).toBeNull();
    expect(buildTelHref(null)).toBeNull();
    expect(buildTelHref(undefined)).toBeNull();
    expect(buildTelHref('sin numero')).toBeNull();
  });
});

describe('buildWhatsAppUrl', () => {
  it('arma el enlace wa.me con el celular normalizado y el mensaje codificado', () => {
    expect(buildWhatsAppUrl('+54 9 11 5555-6666', 'Hola, te recuerdo la cuota')).toBe(
      'https://wa.me/5491155556666?text=Hola%2C%20te%20recuerdo%20la%20cuota',
    );
  });

  it('normaliza el formato nacional y el viejo con 0 y 15', () => {
    expect(buildWhatsAppUrl('11 5555-6666', 'x')).toBe('https://wa.me/5491155556666?text=x');
    expect(buildWhatsAppUrl('011 15 5555-6666', 'x')).toBe('https://wa.me/5491155556666?text=x');
  });

  it('devuelve null si no es un celular argentino interpretable', () => {
    expect(buildWhatsAppUrl(null, 'x')).toBeNull();
    expect(buildWhatsAppUrl('', 'x')).toBeNull();
    expect(buildWhatsAppUrl('sin numero', 'x')).toBeNull();
    // Linea fija: wa.me no puede abrir un chat sin el 9 de celular.
    expect(buildWhatsAppUrl('0981-555-123', 'x')).toBeNull();
  });
});
