import { describe, expect, it } from 'vitest';
import { buildMapsDestinationUrl, buildMapsRouteUrl, MAX_PARADAS_RUTA } from './mapsRoute';

describe('buildMapsRouteUrl', () => {
  it('devuelve null sin direcciones utilizables', () => {
    expect(buildMapsRouteUrl([])).toBeNull();
    expect(buildMapsRouteUrl(['', '   '])).toBeNull();
  });

  it('arma la ruta en el orden recibido y escapa las direcciones', () => {
    expect(buildMapsRouteUrl(['Av. Siempre Viva 123', 'Calle Falsa 742'])).toBe(
      'https://www.google.com/maps/dir/Av.%20Siempre%20Viva%20123/Calle%20Falsa%20742',
    );
  });

  it('deduplica direcciones repetidas sin distinguir mayúsculas', () => {
    expect(
      buildMapsRouteUrl(['Av. Siempre Viva 123', 'av. siempre viva 123', 'Otra 1']),
    ).toBe('https://www.google.com/maps/dir/Av.%20Siempre%20Viva%20123/Otra%201');
  });

  it('recorta a las primeras 10 paradas (límite de la URL de Maps)', () => {
    const direcciones = Array.from({ length: 12 }, (_, i) => `Calle ${i + 1}`);

    const url = buildMapsRouteUrl(direcciones)!;

    expect(url.split('/dir/')[1].split('/')).toHaveLength(MAX_PARADAS_RUTA);
    expect(url).toContain('Calle%201/');
    expect(url).not.toContain('Calle%2011');
  });
});

describe('buildMapsDestinationUrl', () => {
  it('arma la URL de navegación a una dirección', () => {
    expect(buildMapsDestinationUrl('Av. Siempre Viva 123')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=Av.%20Siempre%20Viva%20123',
    );
  });

  it('recorta los espacios alrededor de la dirección', () => {
    expect(buildMapsDestinationUrl('  Calle Falsa 742  ')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=Calle%20Falsa%20742',
    );
  });

  it('devuelve null sin dirección utilizable', () => {
    expect(buildMapsDestinationUrl('')).toBeNull();
    expect(buildMapsDestinationUrl('   ')).toBeNull();
  });
});
