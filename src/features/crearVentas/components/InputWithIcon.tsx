import React from 'react';
import { Field, Input } from '@/shared/components/ui';

interface Props {
  id: string;
  name: string;
  label?: React.ReactNode;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ReactNode;
  /** Símbolo de moneda que precede al número ('$' ARS, 'US$' USD). Tiene prioridad sobre `icon`. */
  symbol?: string;
  required?: boolean;
  error?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

const InputWithIcon: React.FC<Props> = ({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  symbol,
  required,
  error,
  min,
  max,
  step,
  maxLength,
  disabled,
  className = ''
}) => {
  return (
    <Field label={label ?? ''} htmlFor={id} error={error} required={required}>
      <div className="relative">
        {symbol ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-brand-600">
            {symbol}
          </span>
        ) : icon ? (
          <div className="absolute left-3 top-3 text-gray-400">{icon}</div>
        ) : null}
        <Input
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          // `aria-required` en lugar del `required` nativo: el navegador no debe
          // frenar el envío con su propio globo, porque el formulario anuncia los
          // errores en línea y lleva el foco al primer campo inválido.
          aria-required={required || undefined}
          min={min}
          max={max}
          step={step}
          maxLength={maxLength}
          disabled={disabled}
          invalid={!!error}
          // "US$" ocupa más que "$": el padding deja lugar al símbolo sin tapar el número.
          className={`${symbol ? (symbol.length > 1 ? 'pl-12 pr-4' : 'pl-8 pr-4') : icon ? 'pl-10 pr-4' : ''} py-3 ${className}`}
        />
      </div>
    </Field>
  );
};

export default InputWithIcon;
