import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonthlyBarChart from '../MonthlyBarChart';
import AnnualSummary from '../AnnualSummary';
import OverdueFeesAlert from '../OverdueFeesAlert';
import SalesStatusBreakdown from '../SalesStatusBreakdown';
import TopClientsList from '../TopClientsList';

describe('MonthlyBarChart', () => {
  const series = [
    { year: 2026, month: 8, vendido: 100, cobrado: 80, ganancia: 20 },
    { year: 2026, month: 9, vendido: 200, cobrado: 150, ganancia: 40 },
  ];

  it('renderiza la leyenda Vendido/Cobrado y las etiquetas de mes', () => {
    render(<MonthlyBarChart series={series} />);
    expect(screen.getByText('Vendido')).toBeInTheDocument();
    expect(screen.getByText('Cobrado')).toBeInTheDocument();
    expect(screen.getByText('Ago')).toBeInTheDocument();
    expect(screen.getByText('Sep')).toBeInTheDocument();
  });

  it('incluye montos formateados en los títulos de las barras', () => {
    const { container } = render(<MonthlyBarChart series={series} />);
    const vendidoBar = container.querySelector('[title^="Vendido Ago 2026"]');
    expect(vendidoBar).not.toBeNull();
    expect(vendidoBar?.getAttribute('title')).toMatch(/Ganancia Esperada: /);
  });

  it('no rompe con serie vacía', () => {
    const { container } = render(<MonthlyBarChart series={[]} />);
    expect(container.querySelector('[title^="Vendido"]')).toBeNull();
    expect(screen.getByText('Vendido')).toBeInTheDocument();
  });
});

describe('AnnualSummary', () => {
  it('muestra las cuatro métricas con sus valores formateados', () => {
    render(
      <AnnualSummary
        anual={{ totalVentas: 20, totalVendido: 6000, totalCobrado: 4500, ganancia: 1200 }}
      />,
    );
    expect(screen.getByText('Ventas')).toBeInTheDocument();
    expect(screen.getByText('Vendido')).toBeInTheDocument();
    expect(screen.getByText('Cobrado')).toBeInTheDocument();
    expect(screen.getByText('Ganancia Esperada')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText(/6\.000/)).toBeInTheDocument();
    expect(screen.getByText(/4\.500/)).toBeInTheDocument();
    expect(screen.getByText(/1\.200/)).toBeInTheDocument();
  });
});

describe('OverdueFeesAlert', () => {
  it('muestra el singular para una cuota vencida', () => {
    render(<OverdueFeesAlert cantidad={1} monto={500} />);
    expect(screen.getByText('1 cuota vencida')).toBeInTheDocument();
    expect(screen.getByText(/Monto total por cobrar: \$ 500/)).toBeInTheDocument();
  });

  it('muestra el plural y el monto formateado', () => {
    render(<OverdueFeesAlert cantidad={3} monto={2500} />);
    expect(screen.getByText('3 cuotas vencidas')).toBeInTheDocument();
    expect(screen.getByText(/2\.500/)).toBeInTheDocument();
  });

  it('no renderiza nada cuando no hay cuotas vencidas', () => {
    const { container } = render(<OverdueFeesAlert cantidad={0} monto={0} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('SalesStatusBreakdown', () => {
  it('muestra las etiquetas y los valores de cada estado', () => {
    render(
      <SalesStatusBreakdown
        summary={{ completadas: 3, pendientes: 1 }}
      />,
    );
    ['Completadas', 'Pendientes'].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});

describe('TopClientsList', () => {
  it('muestra el ranking, nombre, ventas y montos', () => {
    render(
      <TopClientsList
        clients={[
          { clientId: 1, clientName: 'Ana', totalVentas: 3, totalVendido: 900, totalCobrado: 700 },
        ]}
      />,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('3 ventas')).toBeInTheDocument();
    expect(screen.getByText(/900/)).toBeInTheDocument();
    expect(screen.getByText(/Cobrado: \$ 700/)).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando no hay clientes', () => {
    render(<TopClientsList clients={[]} />);
    expect(screen.getByText('Aún no hay clientes con ventas.')).toBeInTheDocument();
  });
});
