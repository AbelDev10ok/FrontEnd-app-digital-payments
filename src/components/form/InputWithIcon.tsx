import React from 'react';

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
  step?: number | string;
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
  step,
  className = ''
}) => {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 mb-2 block">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && <div className="absolute left-3 top-3 text-gray-400">{icon}</div>}
        <input
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          required={required}
          min={min}
          step={step}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${error ? 'border-red-500' : 'border-gray-200'} ${className}`}
        />
      </div>
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
};

export default InputWithIcon;
