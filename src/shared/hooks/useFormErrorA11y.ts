import { useCallback, useEffect, useRef, useState } from 'react';

/** Resumen hablado de los errores de validación tras un envío fallido. */
export function buildErrorsAnnouncement(errors: Record<string, string>): string {
  const messages = Object.values(errors).filter(Boolean);
  if (messages.length === 0) return '';
  const head =
    messages.length === 1
      ? 'Hay 1 error en el formulario'
      : `Hay ${messages.length} errores en el formulario`;
  return messages.length === 1
    ? `${head}: ${messages[0]}.`
    : `${head}: ${messages[0]}. Revisá los campos marcados.`;
}

interface ErrorReport {
  /** Contador para que un reintento con los mismos errores vuelva a mover el foco. */
  id: number;
  message: string;
}

/**
 * Accesibilidad de los errores de envío: enfoca el primer campo inválido del
 * formulario y prepara un resumen para la región viva (aria-live).
 */
export default function useFormErrorA11y() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [report, setReport] = useState<ErrorReport>({ id: 0, message: '' });

  const reportErrors = useCallback((errors: Record<string, string>) => {
    setReport((prev) => ({ id: prev.id + 1, message: buildErrorsAnnouncement(errors) }));
  }, []);

  // El foco se mueve después del render: los campos marcados como inválidos
  // todavía no existen en el DOM cuando se procesa el envío.
  useEffect(() => {
    if (report.id === 0) return;
    const form = formRef.current;
    // Primer error en orden de lectura: el control inválido; si el campo ya no
    // tiene control (p. ej. un chip de selección), el mensaje de error.
    const target =
      form?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      form?.querySelector<HTMLElement>('[data-error-message]');
    target?.focus();
  }, [report]);

  return { formRef, errorAnnouncement: report.message, reportErrors };
}
