/**
 * Provincias argentinas tal como se guardan en el cliente. Es el dominio del
 * select del domicilio: el backend lo acepta como texto libre, así que este
 * listado es la unica fuente de los valores canonicos (con acentos).
 */
export const PROVINCIAS = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const;

export type Provincia = (typeof PROVINCIAS)[number];
