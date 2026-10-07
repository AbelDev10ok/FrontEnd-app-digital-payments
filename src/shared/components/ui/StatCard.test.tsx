import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

describe('StatCard', () => {
  it('renderiza label y valor', () => {
    render(<StatCard label="Ventas" value="10" />);
    expect(screen.getByText('Ventas')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renderiza icono y footnote', () => {
    render(
      <StatCard
        label="Ganancia"
        value="$100"
        icon={<span>icon-test</span>}
        footnote="vs mes anterior"
      />,
    );
    expect(screen.getByText('icon-test')).toBeInTheDocument();
    expect(screen.getByText('vs mes anterior')).toBeInTheDocument();
  });

  it('aplica el color de valor según el tone', () => {
    render(<StatCard label="Alertas" value="3" tone="danger" />);
    expect(screen.getByText('3')).toHaveClass('text-red-700');
  });

  it('usa tone brand por defecto', () => {
    render(<StatCard label="Ventas" value="5" />);
    expect(screen.getByText('5')).toHaveClass('text-gray-900');
  });
});
