/**
 * URL de ruta en Google Maps con las direcciones como paradas, en el orden
 * recibido. Deduplica las repetidas (sin distinguir mayúsculas) y se queda con
 * las primeras `MAX_PARADAS_RUTA`: la URL de Maps no acepta más.
 * Devuelve null si no hay ninguna dirección utilizable.
 */
export const MAX_PARADAS_RUTA = 10;

export function buildMapsRouteUrl(direcciones: string[]): string | null {
  const vistas = new Set<string>();
  const paradas: string[] = [];

  for (const direccion of direcciones) {
    const limpia = direccion.trim();
    if (!limpia) continue;
    const clave = limpia.toLowerCase();
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    paradas.push(limpia);
    if (paradas.length === MAX_PARADAS_RUTA) break;
  }

  if (paradas.length === 0) return null;
  return `https://www.google.com/maps/dir/${paradas.map(encodeURIComponent).join('/')}`;
}

/**
 * URL de Google Maps con indicaciones hacia UNA dirección (la usa la fila de la
 * agenda). Devuelve null sin dirección utilizable.
 */
export function buildMapsDestinationUrl(direccion: string): string | null {
  const limpia = direccion.trim();
  if (!limpia) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(limpia)}`;
}
