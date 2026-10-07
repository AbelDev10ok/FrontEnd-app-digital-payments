import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CronogramaFees from '../CronogramaFees';
import type { FeeDto, SaleResponseDto } from '@/shared/types/sales';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    markFeeAsPaid: vi.fn(),
    postponeFee: vi.fn(),
  },
}));

vi.mock('@/features/cobros/components/PayFeeModal', () => ({
  default: () => <div data-testid="modal-pago" />,
}));

vi.mock('@/features/ventaDetalle/components/PosponedFeeModal', () => ({
  default: () => <div data-testid="modal-posponer" />,
}));

const HOY = new Date(2026, 7, 24, 12, 0, 0); // 2026-08-24

const crearCuota = (overrides: Partial<FeeDto> = {}): FeeDto => ({
  id: 1,
  saleId: 1,
  numberFee: 1,
  amount: 15000,
  expirationDate: '2026-09-01',
  paid: false,
  paymentDate: undefined,
  paidAmount: undefined,
  postponed: false,
  productDescription: 'TV 32',
  status: 'PENDING',
  ...overrides,
});

const crearTransaccion = (overrides: Partial<SaleResponseDto> = {}): SaleResponseDto => ({
  id: 10,
  client: { id: 5, name: 'Juana Pérez', telefono: '', email: '', direccion: '', seller: false },
  descriptionProduct: 'Televisor 32 pulgadas',
  priceTotal: 60000,
  dateSale: '2026-06-01',
  finalPaymentDate: '2026-12-01',
  realFinalPayment: '',
  typePayments: 'MENSUAL',
  quantityFees: 4,
  amountFee: 15000,
  fees: [],
  cost: 50000,
  interestRate: null,
  productType: null,
  paidFeesCount: 0,
  remainingAmount: 60000,
  totalFees: 4,
  status: '',
  kind: 'VENTA',
  ...overrides,
});

// Formateador determinístico, independiente del locale del entorno
const formatCurrency = (n: number) =>
  `$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
const formatDate = (fecha: string) => fecha.split('-').reverse().join('/');

describe('CronogramaFees', () => {
  const refreshTransaction = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(HOY);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const armarCronograma = () => {
    const cuotas = [
      crearCuota({
        id: 1,
        numberFee: 1,
        expirationDate: '2026-07-01',
        paid: true,
        status: 'PAID',
        paymentDate: '2026-07-05',
      }),
      crearCuota({ id: 2, numberFee: 2, expirationDate: '2026-08-20' }),
      crearCuota({
        id: 3,
        numberFee: 3,
        expirationDate: '2026-10-01',
        postponed: true,
      }),
      crearCuota({ id: 4, numberFee: 4, expirationDate: '2026-11-01' }),
    ];
    return crearTransaccion({
      fees: cuotas,
      paidFeesCount: 1,
      remainingAmount: 45000,
      totalFees: 4,
    });
  };

  it('muestra la barra de progreso con lo cobrado y las cuotas restantes', () => {
    render(
      <CronogramaFees
        transaction={armarCronograma()}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        refreshTransaction={refreshTransaction}
      />,
    );

    expect(screen.getByText('Cobrado $15.000 de $60.000')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('cuotas cobradas'))).toBeInTheDocument();
    const barra = screen.getByRole('progressbar', { name: 'Progreso de cobro' });
    expect(barra).toHaveAttribute('aria-valuenow', '25');
  });

  it('etiqueta cada cuota con su estado: pagada, vencida y próxima', () => {
    render(
      <CronogramaFees
        transaction={armarCronograma()}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        refreshTransaction={refreshTransaction}
      />,
    );

    expect(screen.getByText('Pagada')).toBeInTheDocument();
    expect(screen.getByText('Vencida')).toBeInTheDocument();
    expect(screen.getAllByText('Próxima')).toHaveLength(2);
  });

  it('resalta la fila de la cuota vencida con tinte rojo', () => {
    render(
      <CronogramaFees
        transaction={armarCronograma()}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        refreshTransaction={refreshTransaction}
      />,
    );

    const badgeVencida = screen.getByText('Vencida');
    expect(badgeVencida.closest('li')).toHaveClass('bg-red-50/70');
  });

  it('muestra la fecha de pago en las cuotas pagadas', () => {
    render(
      <CronogramaFees
        transaction={armarCronograma()}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        refreshTransaction={refreshTransaction}
      />,
    );

    expect(screen.getByText((content) => content.includes('05/07/2026'))).toBeInTheDocument();
  });

  it('solo ofrece el botón de cobrar en cuotas impagas', () => {
    render(
      <CronogramaFees
        transaction={armarCronograma()}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        refreshTransaction={refreshTransaction}
      />,
    );

    expect(screen.getAllByRole('button', { name: /^Cobrar$/ })).toHaveLength(3);
  });

  it('abre el modal de cobro al tocar Cobrar en una cuota impaga', () => {
    render(
      <CronogramaFees
        transaction={armarCronograma()}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        refreshTransaction={refreshTransaction}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /^Cobrar$/ })[0]);
    expect(screen.getByTestId('modal-pago')).toBeInTheDocument();
  });

  it('abre el modal de posponer al tocar el botón de una cuota', () => {
    render(
      <CronogramaFees
        transaction={armarCronograma()}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        refreshTransaction={refreshTransaction}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Posponer cuota 2' }));
    expect(screen.getByTestId('modal-posponer')).toBeInTheDocument();
  });

  it('no muestra nada si la transacción no tiene cuotas', () => {
    render(
      <CronogramaFees
        transaction={crearTransaccion({ fees: [] })}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        refreshTransaction={refreshTransaction}
      />,
    );

    expect(screen.queryByText('Cronograma de cuotas')).not.toBeInTheDocument();
  });
});
