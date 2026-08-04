import { useEffect, useRef, memo } from 'react';

interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}

const DebouncedInputComponent = ({
  value,
  onChange,
  placeholder = '',
  delay = 500,
  className = ''
}: DebouncedInputProps) => {
  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleChange = (e: Event) => {
      const target = e.target as HTMLInputElement;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = window.setTimeout(() => {
        onChange(target.value);
      }, delay);
    };

    const input = inputRef.current;
    input?.addEventListener('input', handleChange);

    return () => {
      input?.removeEventListener('input', handleChange);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onChange, delay]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      defaultValue={value}
      className={className}
    />
  );
};

export const DebouncedInput = memo(DebouncedInputComponent);
