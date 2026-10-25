import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonthlyBarChart from '../MonthlyBarChart';
import AnnualSummary from '../AnnualSummary';
import OverdueFeesAlert from '../OverdueFeesAlert';
import SalesStatusBreakdown from '../SalesStatusBreakdown';
import TopClientsList from '../TopClientsList';
import type { MonthlySales } from '@/shared/types/dashboard';

describe('MonthlyBarChart', () => {
  const series = [
    { year: 2026, month: 8, vendido: { ARS: 100 }, cobrado: { ARS: 80 }, ganancia: { ARS: 20 } },
    { year: 2026, month: 9, vendido: { ARS: 200 }, cobrado: { ARS: 150 }, ganancia: { ARS: 40 } },
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

  it('no rompe con serie vacía: muestra un estado explícito sin barras fantasma', () => {
    const { container } = render(<MonthlyBarChart series={[]} />);
    expect(container.querySelector('[title^="Vendido"]')).toBeNull();
    expect(screen.getByText('Sin movimientos en este período.')).toBeInTheDocument();
  });

  it('con monedas mixtas dibuja un gráfico por moneda, sin sumarlas ni compararlas', () => {
    const mixta: MonthlySales[] = [
      { year: 2026, month: 8, vendido: { ARS: 100, USD: 10 }, cobrado: { ARS: 80 }, ganancia: { ARS: 20, USD: 2 } },
      { year: 2026, month: 9, vendido: { ARS: 200 }, cobrado: { USD: 15 }, ganancia: { ARS: 40 } },
    ];
    render(<MonthlyBarChart series={mixta} />);
    expect(screen.getByText('ARS')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    // Un bloque por moneda: la leyenda se repite una vez por cada uno
    expect(screen.getAllByText('Vendido')).toHaveLength(2);
    expect(screen.getAllByText('Cobrado')).toHaveLength(2);
  });
});

describe('AnnualSummary', () => {
  it('muestra las cuatro métricas con sus valores formateados', () => {
    render(
      <AnnualSummary
        anual={{ totalVentas: 20, totalVendido: { ARS: 6000 }, totalCobrado: { ARS: 4500 }, ganancia: { ARS: 1200 } }}
      />,
    );
    expect(screen.getByText('Ventas')).toBeInTheDocument();
    expect(screen.getByText('Vendido')).toBeInTheDocument();
    expect(screen.getByText('Cobrado')).toBeInTheDocument();
    expect(screen.getByText('Ganancia esperada')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText(/6\.000/)).toBeInTheDocument();
    expect(screen.getByText(/4\.500/)).toBeInTheDocument();
    expect(screen.getByText(/1\.200/)).toBeInTheDocument();
  });
});

describe('OverdueFeesAlert', () => {
  it('muestra el singular para una cuota vencida', () => {
    render(<OverdueFeesAlert cantidad={1} monto={{ ARS: 500 }} />);
    expect(screen.getByText('1 cuota vencida')).toBeInTheDocument();
    expect(screen.getByText(/Monto total por cobrar: \$ 500/)).toBeInTheDocument();
  });

  it('muestra el plural y el monto formateado', () => {
    render(<OverdueFeesAlert cantidad={3} monto={{ ARS: 2500 }} />);
    expect(screen.getByText('3 cuotas vencidas')).toBeInTheDocument();
    expect(screen.getByText(/2\.500/)).toBeInTheDocument();
  });

  it('no renderiza nada cuando no hay cuotas vencidas', () => {
    const { container } = render(<OverdueFeesAlert cantidad={0} monto={{}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('SalesStatusBreakdown', () => {
  it('muestra las etiquetas y los valores de cada estado', () => {
    render(
      <SalesStatusBreakdown
        summary={{ completadas: 3, pendientes: 1, canceladas: 1 }}
      />,
    );
    ['Completadas', 'Pendientes', 'Canceladas'].forEach((label) =>
      expect(screen.getByText(label)).toBeInTheDocument(),
    );
    expect(screen.getByText('3')).toBeInTheDocument();
    // pendientes y canceladas valen 1
    expect(screen.getAllByText('1')).toHaveLength(2);
  });
});

describe('TopClientsList', () => {
  it('muestra el ranking, nombre, ventas y montos', () => {
    render(
      <TopClientsList
        clients={[
          { clientId: 1, clientName: 'Ana', totalVentas: 3, totalVendido: { ARS: 900 }, totalCobrado: { ARS: 700 } },
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

  it('muestra cada moneda por separado, sin sumarlas', () => {
    render(
      <TopClientsList
        clients={[
          { clientId: 1, clientName: 'Ana', totalVentas: 3, totalVendido: { ARS: 900, USD: 70 }, totalCobrado: { ARS: 700 } },
        ]}
      />,
    );
    expect(screen.getByText(/900/)).toBeInTheDocument();
    expect(screen.getByText(/US\$\s*70/)).toBeInTheDocument();
  });
});
