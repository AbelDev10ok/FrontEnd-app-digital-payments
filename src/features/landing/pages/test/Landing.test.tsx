import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Landing from '../Landing';

const renderLanding = () =>
  render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>,
  );

describe('Landing', () => {
  it('renderiza el hero con su título y CTAs principales', () => {
    renderLanding();

    expect(
      screen.getByRole('heading', { level: 1, name: /cuotas/i }),
    ).toBeInTheDocument();
    const ctas = screen.getAllByRole('link', { name: 'Probar la app' });
    expect(ctas.length).toBeGreaterThanOrEqual(2);
    ctas.forEach((cta) => expect(cta).toHaveAttribute('href', '/register'));
    const comoFunciona = screen.getAllByRole('link', { name: 'Cómo funciona' });
    comoFunciona.forEach((link) => expect(link.getAttribute('href')).toMatch(/#como-funciona$/));
  });

  it('renderiza las funciones y la sección cómo funciona', () => {
    renderLanding();

    expect(screen.getByText('Cronograma automático')).toBeInTheDocument();
    expect(screen.getByText('Posponer sin romper el plan')).toBeInTheDocument();
    expect(screen.getByText('Registrá la venta o el préstamo')).toBeInTheDocument();
  });

  it('muestra el cronograma de ejemplo con cuotas y estados', () => {
    renderLanding();

    expect(screen.getByText('Ana Giménez')).toBeInTheDocument();
    expect(screen.getAllByText(/Cuota \d/).length).toBe(4);
    expect(screen.getByText('Vencida')).toBeInTheDocument();
    expect(screen.getByText('Próxima')).toBeInTheDocument();
    expect(screen.getByText('$30.000 de $60.000')).toBeInTheDocument();
  });

  it('muestra el ejemplo de números del mes con cifras y detalles', () => {
    renderLanding();

    expect(screen.getByText('Tu mes a un vistazo')).toBeInTheDocument();
    expect(screen.getByText('$840.000')).toBeInTheDocument();
    expect(screen.getByText('$320.000')).toBeInTheDocument();
    expect(screen.getByText('$40.000')).toBeInTheDocument();
    expect(screen.getByText('8 de 10 cuotas pagadas')).toBeInTheDocument();
  });

  it('lista las preguntas frecuentes', () => {
    renderLanding();

    expect(screen.getByText('¿Funciona en el celular?')).toBeInTheDocument();
    expect(
      screen.getByText('¿Qué pasa si dejo de pagar la suscripción?'),
    ).toBeInTheDocument();
  });

  it('incluye enlaces a precios y páginas legales en el pie', () => {
    renderLanding();

    expect(screen.getByRole('contentinfo').querySelector('a[href="/precios"]')).not.toBeNull();
    expect(screen.getByRole('contentinfo').querySelector('a[href="/terminos"]')).not.toBeNull();
    expect(screen.getByRole('contentinfo').querySelector('a[href="/privacidad"]')).not.toBeNull();
  });
});
