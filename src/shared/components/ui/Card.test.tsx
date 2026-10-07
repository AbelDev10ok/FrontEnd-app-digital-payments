import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('renderiza children', () => {
    render(<Card>Contenido</Card>);
    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('mergea className propio con las clases base', () => {
    const { container } = render(<Card className="p-6 custom">X</Card>);
    expect(container.firstChild).toHaveClass('bg-white');
    expect(container.firstChild).toHaveClass('p-6');
    expect(container.firstChild).toHaveClass('custom');
  });

  it('propaga atributos HTML', () => {
    render(<Card data-testid="card-test">X</Card>);
    expect(screen.getByTestId('card-test')).toBeInTheDocument();
  });
});
