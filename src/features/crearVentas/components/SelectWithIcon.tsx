import React from 'react';
import { Field, Select } from '@/shared/components/ui';

interface Option { value: string | number; label: string }

interface Props {
  id: string;
  name: string;
  label?: React.ReactNode;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  icon?: React.ReactNode;
  required?: boolean;
  error?: string;
  className?: string;
}

const SelectWithIcon: React.FC<Props> = ({ id, name, label, value, onChange, options, icon, required, error, className = '' }) => {
  return (
    <Field label={label ?? ''} htmlFor={id} error={error} required={required}>
      <div className="relative">
        {icon && <div className="absolute left-3 top-3 text-gray-400">{icon}</div>}
        <Select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          invalid={!!error}
          className={`${icon ? 'pl-10 pr-4' : ''} py-3 ${className}`}
        >
          {options.map(o => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
        </Select>
      </div>
    </Field>
  );
};

export default SelectWithIcon;
