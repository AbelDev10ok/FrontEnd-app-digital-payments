import { useState, useEffect } from 'react';

interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  delay?: number;
  className?: string;
}

export const DebouncedInput = ({
  value,
  onChange,
  placeholder,
  delay = 500,
  className = ''
}: DebouncedInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [localValue, delay]);

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      className={className}
    />
  );
};
