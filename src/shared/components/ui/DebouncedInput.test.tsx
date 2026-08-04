import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DebouncedInput } from './DebouncedInput';

describe('DebouncedInput', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('dispara onChange solo después de transcurrido el delay', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<DebouncedInput value="" onChange={onChange} delay={100} />);

    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'hola' } });
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(99);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledWith('hola');
  });

  it('con escritura rápida solo emite el último valor', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<DebouncedInput value="" onChange={onChange} delay={100} />);

    const input = screen.getByRole('textbox');
    fireEvent.input(input, { target: { value: 'a' } });
    vi.advanceTimersByTime(50);
    fireEvent.input(input, { target: { value: 'ab' } });
    vi.advanceTimersByTime(100);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('ab');
  });
});
