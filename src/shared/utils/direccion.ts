export interface PartesDireccion {
  direccion?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  codigoPostal?: string | null;
}

/**
 * Compone el domicilio en una linea, omitiendo las partes vacias. Espejo de
 * `DireccionUtils` del backend: la usan la ficha y la tabla de clientes. La
 * agenda de cobros no la necesita porque `clientAddress` ya llega compuesta.
 */
export function formatearDireccion(partes: PartesDireccion): string {
  return [partes.direccion, partes.localidad, partes.provincia, partes.codigoPostal]
    .map((parte) => parte?.trim())
    .filter((parte): parte is string => !!parte)
    .join(', ');
}
