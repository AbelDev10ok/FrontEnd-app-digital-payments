import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Precios from '../Precios';

const renderPrecios = () =>
  render(
    <MemoryRouter>
      <Precios />
    </MemoryRouter>,
  );

describe('Precios', () => {
  it('muestra el plan único con precio mensual', () => {
    renderPrecios();

    expect(screen.getByText('Un plan. Todo incluido.')).toBeInTheDocument();
    expect(screen.getByText('Plan único')).toBeInTheDocument();
    expect(screen.getByText(/15\.000/)).toBeInTheDocument();
    expect(screen.getByText('/mes')).toBeInTheDocument();
  });

  it('lista lo que incluye el plan', () => {
    renderPrecios();

    expect(
      screen.getByText('Ventas a crédito y préstamos ilimitados'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Cronograma de cuotas con cobro y posposición'),
    ).toBeInTheDocument();
  });

  it('tiene CTA de alta y enlaces legales', () => {
    renderPrecios();

    expect(screen.getByRole('link', { name: 'Empezar ahora' })).toHaveAttribute('href', '/register');
    expect(
      screen.getByText(/El pago se administra con MercadoPago/),
    ).toBeInTheDocument();
  });
});
