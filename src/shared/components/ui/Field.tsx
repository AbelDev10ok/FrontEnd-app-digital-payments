import { useId } from 'react';
import type { ReactNode } from 'react';
import { FieldA11yContext, fieldErrorId, fieldHintId } from './fieldA11y';

export interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export default function Field({ label, htmlFor, error, hint, required, children }: FieldProps) {
  const autoId = useId();
  const fieldId = htmlFor ?? autoId;
  const errorId = fieldErrorId(fieldId);
  const hintId = fieldHintId(fieldId);
  // El error manda sobre el hint: el control describe su mensaje visible.
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <FieldA11yContext.Provider value={{ describedBy, invalid: Boolean(error) }}>
        {children}
      </FieldA11yContext.Provider>
      {error ? (
        // tabIndex -1 permite enfocar el mensaje cuando el campo no tiene
        // control asociado (p. ej. un valor ya elegido que se muestra en un chip).
        <p id={errorId} tabIndex={-1} data-error-message className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1 text-sm text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
