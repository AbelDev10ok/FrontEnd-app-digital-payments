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
  required?: boolean;
  error?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
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
  required,
  error,
  min,
  max,
  step,
  disabled,
  className = ''
}) => {
  return (
    <Field label={label ?? ''} htmlFor={id} error={error} required={required}>
      <div className="relative">
        {icon && <div className="absolute left-3 top-3 text-gray-400">{icon}</div>}
        <Input
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          required={required}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          invalid={!!error}
          className={`${icon ? 'pl-10 pr-4' : ''} py-3 ${className}`}
        />
      </div>
    </Field>
  );
};

export default InputWithIcon;
