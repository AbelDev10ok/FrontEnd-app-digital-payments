import { act, fireEvent, render, screen } from '@testing-library/react';
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
  default: ({
    cuota,
    onPaid,
  }: {
    cuota: { id: number } | null;
    onPaid: () => void;
  }) => (
    <div data-testid="modal-pago">
      {cuota && (
        <button type="button" onClick={onPaid}>
          simular cobro {cuota.id}
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/features/ventaDetalle/components/PosponedFeeModal', () => ({
  default: ({ hasLaterUnpaidFees }: { hasLaterUnpaidFees?: boolean }) => (
    <div data-testid="modal-posponer">
      {hasLaterUnpaidFees ? 'con-siguientes' : 'solo-esta'}
    </div>
  ),
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
    expect(screen.getByText('1 cuota cobrada')).toBeInTheDocument();
    const barra = screen.getByRole('progressbar', { name: 'Progreso de cobro' });
    expect(barra).toHaveAttribute('aria-valuenow', '25');
  });

  it('muestra como cobrado la suma de los cobros, no lo que reste el saldo', () => {
    // Venta con el saldo inconsistente (lo que dejaba el borrado de cuotas): la
    // barra no puede decir que se cobró plata que nunca entró.
    const transaction = crearTransaccion({
      priceTotal: 150000,
      remainingAmount: 50000,
      quantityFees: 6,
      amountFee: 25000,
      paidFeesCount: 1,
      totalFees: 2,
      fees: [
        crearCuota({
          id: 1,
          numberFee: 1,
          amount: 25000,
          paid: true,
          status: 'PAID',
          paidAmount: 25000,
          paymentDate: '2026-10-18',
        }),
        crearCuota({ id: 2, numberFee: 2, expirationDate: '2026-11-01' }),
      ],
    });

    render(
      <CronogramaFees
        transaction={transaction}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        refreshTransaction={refreshTransaction}
      />,
    );

    expect(screen.getByText('Cobrado $25.000 de $150.000')).toBeInTheDocument();
    const barra = screen.getByRole('progressbar', { name: 'Progreso de cobro' });
    expect(barra).toHaveAttribute('aria-valuenow', '17');
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

  it('solo ofrece el botón de cobrar en la primera cuota impaga del cronograma', () => {
    render(
      <CronogramaFees
        transaction={armarCronograma()}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        refreshTransaction={refreshTransaction}
      />,
    );

    // La 1 ya está pagada y la 2 es la impaga más antigua: sólo esa ofrece cobro
    const botones = screen.getAllByRole('button', { name: /^Cobrar$/ });
    expect(botones).toHaveLength(1);
    expect(botones[0].closest('li')).toHaveTextContent('Cuota 2');
    // El lápiz sigue disponible en todas las impagas no anuladas
    expect(screen.getByRole('button', { name: 'Posponer cuota 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Posponer cuota 4' })).toBeInTheDocument();
  });

  it('no ofrece cobrar ni editar cuotas de una venta anulada', () => {
    render(
      <CronogramaFees
        transaction={crearTransaccion({
          status: 'CANCELED',
          fees: [crearCuota({ id: 2 })],
        })}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        refreshTransaction={refreshTransaction}
      />,
    );

    // El cronograma queda como historial: sin cobro ni edición de cuotas
    expect(screen.queryByRole('button', { name: /^Cobrar$/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Posponer cuota 2' }),
    ).not.toBeInTheDocument();
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

  it('resalta todas las cuotas que la cascada dejó pagadas y las apaga al segundo y medio', async () => {
    const inicial = armarCronograma();
    // El cobro de la cuota 2 sobró y la cascada cerró también la 3
    const refrescada: SaleResponseDto = {
      ...inicial,
      paidFeesCount: 3,
      remainingAmount: 15000,
      fees: inicial.fees.map((fee) =>
        fee.id === 2 || fee.id === 3 ? { ...fee, paid: true, status: 'PAID' as const } : fee,
      ),
    };
    const refresh = vi.fn().mockImplementation(async () => {
      rerender(
        <CronogramaFees
          transaction={refrescada}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          refreshTransaction={refresh}
        />,
      );
    });
    const { rerender } = render(
      <CronogramaFees
        transaction={inicial}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        refreshTransaction={refresh}
      />,
    );

    // La primera cuota impaga es la 2: se cobra desde su botón.
    fireEvent.click(screen.getByRole('button', { name: /^Cobrar$/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'simular cobro 2' }));
    });

    expect(refresh).toHaveBeenCalledTimes(1);
    // La cascada resalta TODAS las que pasaron a pagadas con este cobro
    expect(screen.getByText('Cuota 2').closest('li')).toHaveClass('animate-paid-flash');
    expect(screen.getByText('Cuota 3').closest('li')).toHaveClass('animate-paid-flash');
    // La que ya estaba cobrada antes no se resalta de nuevo
    expect(screen.getByText('Cuota 1').closest('li')).not.toHaveClass('animate-paid-flash');

    act(() => {
      vi.advanceTimersByTime(1700);
    });
    expect(screen.getByText('Cuota 2').closest('li')).not.toHaveClass('animate-paid-flash');
    expect(screen.getByText('Cuota 3').closest('li')).not.toHaveClass('animate-paid-flash');
  });

  it('le dice al modal si hay impagas posteriores a la cuota editada', () => {
    render(
      <CronogramaFees
        transaction={armarCronograma()}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
        refreshTransaction={refreshTransaction}
      />,
    );

    // La 2 tiene impagas después (3 y 4)
    fireEvent.click(screen.getByRole('button', { name: 'Posponer cuota 2' }));
    expect(screen.getByTestId('modal-posponer')).toHaveTextContent('con-siguientes');

    // La 4 es la última impaga del cronograma
    fireEvent.click(screen.getByRole('button', { name: 'Posponer cuota 4' }));
    expect(screen.getByTestId('modal-posponer')).toHaveTextContent('solo-esta');
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
