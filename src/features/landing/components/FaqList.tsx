export interface FaqItem {
  pregunta: string;
  respuesta: string;
}

/**
 * Acordeón de preguntas frecuentes: un solo tratamiento para todo el sitio
 * público (landing y precios). El "+" rota al abrir.
 */
export default function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-gray-200 rounded-card border border-gray-200 bg-surface">
      {items.map((item) => (
        <details key={item.pregunta} className="group px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 [&::-webkit-details-marker]:hidden">
            {item.pregunta}
            <span
              aria-hidden="true"
              className="text-brand-600 transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.respuesta}</p>
        </details>
      ))}
    </div>
  );
}
