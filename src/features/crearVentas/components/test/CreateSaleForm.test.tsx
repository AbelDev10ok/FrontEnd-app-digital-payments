import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CreateSaleForm from '../CreateSaleForm';
import { formatCurrency } from '@/shared/utils/formatCurrency';

vi.mock('@/shared/components/AutocompleteSeller', () => ({
  default: () => <div>Vendedor</div>,
}));

vi.mock('@/features/crearVentas/components/AutocompleteClient', () => ({
  default: () => <div>Cliente</div>,
}));

vi.mock('@/features/crearVentas/components/SubmitBar', () => ({
  default: () => <button type="submit">Guardar</button>,
}));

/**
 * Texto tal como queda en el DOM: Intl separa el símbolo del número con un
 * espacio fino (U+00A0) y la búsqueda por texto no lo normaliza sola.
 */
const textoEnPantalla = (monto: number, moneda: string) =>
  formatCurrency(monto, moneda).replace(/\u00a0/g, ' ');

/** Símbolo que precede al número en un campo de dinero. */
const simboloDe = (label: RegExp) => {
  const input = screen.getByLabelText(label);
  return input.parentElement?.querySelector('span')?.textContent ?? '';
};

const baseFormData = {
  tipo: 'PRESTAMO',
  fecha: '2026-10-03',
  firstFeeDate: '2026-10-03',
  payFirstFee: false,
  firstFeeAmount: '',
  payments: 'SEMANAL',
  quantityFees: 4,
  amountFee: 100,
  cost: 300,
  interestRate: 10,
  cliente: 0,
  sellerId: '',
};

describe('CreateSaleForm', () => {
  it('muestra por defecto la fecha de primera cuota y el checkbox desmarcado', () => {
    render(
      <CreateSaleForm
        formData={baseFormData}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{}}
        visibleErrors={{}}
        isSubmittingDisabled={false}
        products={[]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Fecha del primer pago')).toHaveValue('2026-10-03');
    expect(screen.getByRole('checkbox', { name: /Pagar primera cuota ahora/i })).not.toBeChecked();
  });

  it('marca los obligatorios con aria-required y no con el required nativo', () => {
    render(
      <CreateSaleForm
        formData={baseFormData}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{}}
        visibleErrors={{}}
        isSubmittingDisabled={false}
        products={[]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
      />,
    );

    const fecha = screen.getByLabelText(/^Fecha \*/);
    expect(fecha).toHaveAttribute('aria-required', 'true');
    // El globo nativo del navegador frenaría el envío antes de que el formulario
    // pueda anunciar sus errores en línea y llevar el foco al primer campo.
    expect(fecha).not.toHaveAttribute('required');
    expect(screen.getByLabelText(/^Tipo de pago \*/)).toHaveAttribute('aria-required', 'true');
    expect(screen.getByLabelText(/^Monto entregado \*/)).toHaveAttribute('aria-required', 'true');
  });

  it('muestra el error de envío y le da foco', () => {
    render(
      <CreateSaleForm
        formData={baseFormData}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{}}
        visibleErrors={{}}
        isSubmittingDisabled={false}
        products={[]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
        submitError="No se pudo guardar la transacción. Intentá nuevamente."
      />,
    );

    const mensaje = screen.getByText('No se pudo guardar la transacción. Intentá nuevamente.');
    const foco = mensaje.closest('[tabindex="-1"]');
    expect(foco).not.toBeNull();
    expect(foco).toHaveFocus();
  });

  it('anuncia los errores de validación tras un envío fallido', () => {
    const { container } = render(
      <CreateSaleForm
        formData={baseFormData}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{ cliente: 'Selecciona un cliente' }}
        visibleErrors={{ cliente: 'Selecciona un cliente' }}
        isSubmittingDisabled
        products={[]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.submit(container.querySelector('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('Hay 1 error en el formulario: Selecciona un cliente.');
  });

  it('no pinta los errores hasta que el intento de envío los revela', () => {
    const props = {
      formData: baseFormData,
      setFormData: vi.fn(),
      handleInputChange: vi.fn(),
      errors: { cost: 'Ingresa un costo válido' },
      isSubmittingDisabled: false,
      products: [],
      sellers: [],
      displayedClients: [],
      onSubmit: vi.fn(),
    };

    const { rerender } = render(<CreateSaleForm {...props} visibleErrors={{}} />);
    expect(screen.queryByText('Ingresa un costo válido')).not.toBeInTheDocument();

    rerender(<CreateSaleForm {...props} visibleErrors={{ cost: 'Ingresa un costo válido' }} />);
    expect(screen.getByText('Ingresa un costo válido')).toBeInTheDocument();
  });

  it('en una venta el aviso de total vs costo va junto a los campos editables', () => {
    render(
      <CreateSaleForm
        formData={{
          ...baseFormData,
          tipo: 'VENTA',
          productId: '1',
          productTypeId: '1',
          cost: '100',
          amountFee: '10',
          quantityFees: 4,
        }}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{}}
        visibleErrors={{ cost: 'El total a cobrar debe ser mayor al costo del producto' }}
        isSubmittingDisabled={false}
        products={[]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
      />,
    );

    const aviso = screen.getByText('El total a cobrar debe ser mayor al costo del producto');
    // En la venta el costo es de sólo lectura: el aviso no puede colgar de él.
    expect(screen.getByText('Costo del producto').parentElement?.contains(aviso)).toBe(false);
    // Y sirve de destino del foco cuando ningún control queda marcado como inválido.
    expect(aviso).toHaveAttribute('data-error-message');
    expect(aviso).toHaveAttribute('tabindex', '-1');
  });

  it('muestra el costo en la moneda del producto y no en la del negocio', () => {
    render(
      <CreateSaleForm
        formData={{
          ...baseFormData,
          tipo: 'VENTA',
          productId: '1',
          productTypeId: '1',
          cantidad: '1',
          cost: '500',
          amountFee: '600',
          quantityFees: 1,
        }}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{}}
        visibleErrors={{}}
        isSubmittingDisabled={false}
        products={[
          { id: 1, variantId: 1, name: 'Heladera', cost: 500, price: 700, currency: 'USD', productTypeId: 1, productTypeName: 'TV' },
        ]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
      />,
    );

    // El negocio está en pesos (moneda global), pero el precio del producto es en
    // dólares: los montos de la operación se muestran en la moneda del producto.
    expect(screen.getByText(`Costo ${textoEnPantalla(500, 'USD')}`)).toBeInTheDocument();
    // La ganancia sale del total a cobrar (600) menos el costo (500)
    expect(screen.getByText(`Ganancia ${textoEnPantalla(100, 'USD')}`)).toBeInTheDocument();
    expect(screen.queryByText(`Costo ${textoEnPantalla(500, 'ARS')}`)).not.toBeInTheDocument();
  });

  it('al contado muestra el total calculado del catálogo en vez del campo de cuota', () => {
    render(
      <CreateSaleForm
        formData={{
          ...baseFormData,
          tipo: 'VENTA',
          productId: '1',
          productTypeId: '1',
          cantidad: '2',
          payments: 'CONTADO',
          quantityFees: 1,
          amountFee: '',
          cost: '800',
        }}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{}}
        visibleErrors={{}}
        isSubmittingDisabled={false}
        products={[
          { id: 1, variantId: 1, name: 'Heladera', cost: 400, price: 500, currency: 'ARS', productTypeId: 1, productTypeName: 'TV' },
        ]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
      />,
    );

    // No se edita el monto al contado: manda el precio de venta del catálogo
    expect(screen.queryByLabelText(/Valor de la cuota/)).not.toBeInTheDocument();
    expect(screen.getByText('Total de la venta (contado)')).toBeInTheDocument();
    // 1000 = 500 × 2: aparece como total y como "Total a cobrar"
    expect(screen.getAllByText(textoEnPantalla(1000, 'ARS')).length).toBeGreaterThan(0);
    // El costo del badge es el de la venta completa (400 × 2) y la ganancia 200
    expect(screen.getByText(`Costo ${textoEnPantalla(800, 'ARS')}`)).toBeInTheDocument();
    expect(screen.getByText(`Ganancia ${textoEnPantalla(200, 'ARS')}`)).toBeInTheDocument();
  });

  it('en un préstamo deja elegir la moneda y resume los montos en ella', () => {
    render(
      <CreateSaleForm
        formData={{ ...baseFormData, currency: 'USD' }}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{}}
        visibleErrors={{}}
        isSubmittingDisabled={false}
        products={[]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Moneda')).toHaveValue('USD');
    expect(screen.getByText(textoEnPantalla(300, 'USD'))).toBeInTheDocument();
  });

  it('muestra el símbolo US$ en el valor de la cuota cuando el producto está en dólares', () => {
    render(
      <CreateSaleForm
        formData={{
          ...baseFormData,
          tipo: 'VENTA',
          productId: '1',
          productTypeId: '1',
          cantidad: '1',
          cost: '350',
          amountFee: '100',
          quantityFees: 1,
        }}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{}}
        visibleErrors={{}}
        isSubmittingDisabled={false}
        products={[
          { id: 1, name: 'a17', price: 350, currency: 'USD', productTypeId: 1, productTypeName: 'TV' },
        ]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
      />,
    );

    // El campo de la cuota sigue la moneda de la operación, no la del negocio.
    expect(simboloDe(/Valor de la cuota/)).toBe('US$');
  });

  it('mantiene $ en el valor de la cuota cuando el producto está en pesos', () => {
    render(
      <CreateSaleForm
        formData={{
          ...baseFormData,
          tipo: 'VENTA',
          productId: '1',
          productTypeId: '1',
          cantidad: '1',
          cost: '120000',
          amountFee: '30000',
          quantityFees: 4,
        }}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{}}
        visibleErrors={{}}
        isSubmittingDisabled={false}
        products={[
          { id: 1, name: 'A16', price: 120000, currency: 'ARS', productTypeId: 1, productTypeName: 'TV' },
        ]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
      />,
    );

    expect(simboloDe(/Valor de la cuota/)).toBe('$');
  });

  it('en un préstamo el símbolo del monto entregado sigue la moneda elegida', () => {
    render(
      <CreateSaleForm
        formData={{ ...baseFormData, currency: 'USD' }}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{}}
        visibleErrors={{}}
        isSubmittingDisabled={false}
        products={[]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
      />,
    );

    expect(simboloDe(/Monto entregado/)).toBe('US$');
  });

  it('el monto de la primera cuota también usa el símbolo de la operación', () => {
    render(
      <CreateSaleForm
        formData={{
          ...baseFormData,
          tipo: 'VENTA',
          productId: '1',
          productTypeId: '1',
          cantidad: '1',
          cost: '350',
          amountFee: '100',
          quantityFees: 1,
          payFirstFee: true,
          firstFeeAmount: '100',
        }}
        setFormData={vi.fn()}
        handleInputChange={vi.fn()}
        errors={{}}
        visibleErrors={{}}
        isSubmittingDisabled={false}
        products={[
          { id: 1, name: 'a17', price: 350, currency: 'USD', productTypeId: 1, productTypeName: 'TV' },
        ]}
        sellers={[]}
        displayedClients={[]}
        onSubmit={vi.fn()}
      />,
    );

    expect(simboloDe(/Monto primera cuota/)).toBe('US$');
  });
});
