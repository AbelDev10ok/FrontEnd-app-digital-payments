import React from 'react';

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
    <div>
      {label && <label htmlFor={id} className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-3 text-gray-400">{icon}</div>}
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${error ? 'border-red-500' : 'border-gray-200'} ${className}`}
        >
          {options.map(o => <option key={String(o.value)} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
};

export default SelectWithIcon;
