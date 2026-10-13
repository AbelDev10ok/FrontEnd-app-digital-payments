import { createContext, useContext } from 'react';

/**
 * Asociación accesible entre un campo (Field) y su control (Input/Select):
 * el campo publica los ids de sus mensajes y el control los consume para
 * armar `aria-describedby` y `aria-invalid`.
 */
export interface FieldA11y {
  /** Ids de los mensajes (error o hint) que describen el control. */
  describedBy?: string;
  /** El campo tiene un error de validación activo. */
  invalid?: boolean;
}

export const FieldA11yContext = createContext<FieldA11y>({});

export function useFieldA11y(): FieldA11y {
  return useContext(FieldA11yContext);
}

/** Id del mensaje de error asociado al campo con id `fieldId`. */
export const fieldErrorId = (fieldId: string): string => `${fieldId}-error`;

/** Id del mensaje de ayuda (hint) asociado al campo con id `fieldId`. */
export const fieldHintId = (fieldId: string): string => `${fieldId}-hint`;

/**
 * Une ids de `aria-describedby` sin repetir: el campo (Field) y el llamador
 * pueden aportar el mismo id de mensaje.
 */
export function mergeDescribedBy(...values: Array<string | undefined>): string | undefined {
  const ids = values
    .flatMap((value) => (value ?? '').split(/\s+/))
    .filter(Boolean);
  return Array.from(new Set(ids)).join(' ') || undefined;
}
