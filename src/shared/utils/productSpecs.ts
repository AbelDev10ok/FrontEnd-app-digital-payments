import type { ProductDto } from '@/shared/types/sales';

/** Minúsculas y sin acentos: compara nombres y valores sin pelear con tildes. */
const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');

const limpiar = (texto: string | null | undefined) => (texto ?? '').trim();

/**
 * "Color: Rojo" — nombre y valor del atributo; si el valor ya nombra al
 * atributo ("4GB RAM") se muestra solo, porque repetirlo no agrega nada.
 */
const describir = (nombre: string, valor: string) =>
  normalizar(valor).includes(normalizar(nombre)) ? valor : `${nombre}: ${valor}`;

/**
 * Atributos de una variante como lista legible para la UI:
 * `Color: Rojo · RAM: 4 GB`. Sin atributos, cae a `variantLabel` ("Rojo / M",
 * la combinación de valores que arma el backend).
 */
export function especificacionesDe(
  producto: Pick<ProductDto, 'attributes' | 'variantLabel'>,
): string[] {
  const specs: string[] = [];

  (producto.attributes ?? []).forEach((atributo) => {
    const nombre = limpiar(atributo.attributeName);
    const valor = limpiar(atributo.value);
    if (!nombre || !valor) return;
    const spec = describir(nombre, valor);
    if (!specs.some((s) => normalizar(s) === normalizar(spec))) specs.push(spec);
  });

  if (specs.length === 0) {
    const etiqueta = limpiar(producto.variantLabel);
    if (etiqueta) specs.push(etiqueta);
  }

  return specs;
}

interface GrupoAtributo {
  etiqueta: string;
  valores: string[];
}

/**
 * Resumen de un producto con varias variantes: agrupa por atributo y une sus
 * valores distintos — "Color: Rojo / Negro · RAM: 4 GB / 8 GB". Corta a `max`
 * bloques con un "+N más" para no llenar la fila de la lista.
 */
export function resumenEspecificaciones(
  variantes: Array<Pick<ProductDto, 'attributes' | 'variantLabel'>>,
  max = 3,
): string {
  const grupos = new Map<string, GrupoAtributo>();

  variantes.forEach((variante) => {
    (variante.attributes ?? []).forEach((atributo) => {
      const etiqueta = limpiar(atributo.attributeName);
      const valor = limpiar(atributo.value);
      if (!etiqueta || !valor) return;
      const clave = normalizar(etiqueta);
      const grupo = grupos.get(clave) ?? { etiqueta, valores: [] };
      if (!grupo.valores.some((v) => normalizar(v) === normalizar(valor))) {
        grupo.valores.push(valor);
      }
      grupos.set(clave, grupo);
    });
  });

  let bloques = Array.from(grupos.values()).map(({ etiqueta, valores }) =>
    valores.every((valor) => normalizar(valor).includes(normalizar(etiqueta)))
      ? valores.join(' / ')
      : `${etiqueta}: ${valores.join(' / ')}`,
  );

  if (bloques.length === 0) {
    const etiquetas: string[] = [];
    variantes.forEach((variante) => {
      const etiqueta = limpiar(variante.variantLabel);
      if (etiqueta && !etiquetas.includes(etiqueta)) etiquetas.push(etiqueta);
    });
    bloques = etiquetas;
  }

  if (max > 0 && bloques.length > max) {
    bloques = [...bloques.slice(0, max), `+${bloques.length - max} más`];
  }

  return bloques.join(' · ');
}