interface ErrorAnnouncerProps {
  message: string;
}

/**
 * Región viva para el resumen de errores de validación: se anuncia al instante
 * tras un envío fallido sin sacar el foco del primer campo inválido.
 */
export default function ErrorAnnouncer({ message }: ErrorAnnouncerProps) {
  return (
    <div role="alert" className="sr-only">
      {message}
    </div>
  );
}
