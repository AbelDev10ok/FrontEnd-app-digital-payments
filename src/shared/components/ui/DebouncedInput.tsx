/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, memo } from 'react';

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
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hadFocus = useRef(false);

  // sync external value but preserve focus/cursor if user is typing
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
      if (hadFocus.current && inputRef.current) {
        const pos = String(value ?? '').length;
        inputRef.current.focus();
        try { inputRef.current.setSelectionRange(pos, pos); } catch (e) { /* ignore */ }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, delay);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [localValue, delay, onChange, value]);

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={localValue}
      ref={inputRef}
      onFocus={() => { hadFocus.current = true; }}
      onBlur={() => { hadFocus.current = false; }}
      onChange={(e) => setLocalValue(e.target.value)}
      className={className}
    />
  );
};

export const DebouncedInput = memo(DebouncedInputComponent);
