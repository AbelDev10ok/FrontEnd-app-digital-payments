import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CobrosDeHoy from '../pages/CobrosDeHoy';
import { collectionsService } from '@/features/cobros/services/collectionsService';
import { salesService } from '@/features/ventas/services/salesServices';
import type { Client } from '@/shared/types/client';
import type { CobrosHoyResponse, PaymentPromise } from '@/shared/types/business';

vi.mock('@/features/ventas/services/salesServices', () => ({
  salesService: {
    getSellers: vi.fn(),
    getProductTypes: vi.fn().mockResolvedValue([]),
    getSalesCounts: vi.fn().mockResolvedValue({
      total: 0,
      active: 0,
      completed: 0,
      canceled: 0,
      aCobrar: 0,
    }),
    markFeeAsPaid: vi.fn(),
    getFeePayments: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/features/cobros/services/collectionsService', () => ({
  collectionsService: {
    getCobrosHoy: vi.fn(),
    getCuotas: vi.fn(),
    marcarRecordatorio: vi.fn(),
    payClient: vi.fn(),
    createPromise: vi.fn(),
    cancelPromise: vi.fn(),
    fulfillPromise: vi.fn(),
    getPromises: vi.fn(),
  },
}));

const cobroVencido: CobrosHoyResponse = {
  fecha: '2026-08-25',
  hoy: { cantidad: 1, monto: { ARS: 15000 } },
  vencidas: { cantidad: 1, monto: { ARS: 20000 } },
  items: [
    {
      id: 10,
      saleId: 2,
      clientId: 3,
      clientName: 'Maria Lopez',
      clientPhone: '+5491155551234',
      saleDescription: 'Televisor 32 pulgadas',
      saleKind: 'VENTA',
      numeroCuota: 1,
      totalCuotas: 12,
      monto: 15000,
      fechaVencimiento: '2026-08-25',
      pagada: false,
      diasAtraso: 0,
      estado: 'TODAY',
    },
    {
      id: 11,
      saleId: 5,
      clientId: 4,
      clientName: 'Juan Perez',
      saleDescription: null,
      saleKind: 'PRESTAMO',
      numeroCuota: 2,
      totalCuotas: 6,
      monto: 20000,
      fechaVencimiento: '2026-08-20',
      pagada: false,
      diasAtraso: 5,
      estado: 'DELAYED',
    },
  ],
};

const vendedora: Client = {
  id: 5,
  name: 'Ana Vendedora',
  telefono: '',
  email: '',
  direccion: '',
  seller: true,
};

const renderPagina = () =>
  render(
    <MemoryRouter>
      <CobrosDeHoy user={null} onLogout={vi.fn()} />
    </MemoryRouter>,
  );

describe('CobrosDeHoy', () => {
  beforeEach(() => {
    vi.mocked(collectionsService.getCobrosHoy).mockReset();
    vi.mocked(collectionsService.payClient).mockReset();
    vi.mocked(collectionsService.createPromise).mockReset();
    vi.mocked(collectionsService.fulfillPromise).mockReset();
    vi.mocked(collectionsService.cancelPromise).mockReset();
    vi.mocked(salesService.getSellers).mockReset();
    vi.mocked(salesService.getSellers).mockResolvedValue([vendedora]);
  });

  it('muestra el resumen del día y la agenda de cobros', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(cobroVencido);

    renderPagina();

    expect(await screen.findByText('Maria Lopez')).toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    // Chips con montos y cantidades
    expect(screen.getByText('Vencen hoy')).toBeInTheDocument();
    expect(screen.getByText('Vencidas')).toBeInTheDocument();
    expect(screen.getAllByText('$ 15.000').length).toBeGreaterThan(0);
    expect(screen.getByText('Vencida · 5 días')).toBeInTheDocument();
    // Botones de cobro: uno por cuota y uno por grupo
    expect(screen.getAllByRole('button', { name: 'Cobrar' }).length).toBe(2);
    expect(screen.getAllByRole('button', { name: /Cobrar todo/ }).length).toBe(2);
  });

  it('muestra el estado vacío cuando no hay cobros pendientes', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 0, monto: {} },
      vencidas: { cantidad: 0, monto: {} },
      items: [],
    });

    renderPagina();

    expect(await screen.findByText('No hay cuotas por cobrar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cobrar/ })).not.toBeInTheDocument();
  });

  it('muestra el total del plan en una cuota acordada', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(cobroVencido);

    renderPagina();

    const fila = (await screen.findByText('Maria Lopez')).closest('li')!;
    expect(fila).toHaveTextContent('Cuota 1 de 12');
  });

  it('ofrece recordar la cuota por WhatsApp con el mensaje armado', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(cobroVencido);

    renderPagina();

    const recordatorio = await screen.findByRole('link', { name: 'Recordar a Maria Lopez por WhatsApp' });
    const href = recordatorio.getAttribute('href') ?? '';
    expect(href).toContain('https://wa.me/5491155551234?text=');
    const mensaje = decodeURIComponent(href.split('text=')[1]).replace(/\u00a0/g, ' ');
    expect(mensaje).toContain('Hola Maria Lopez');
    expect(mensaje).toContain('la cuota 1/12');
    expect(mensaje).toContain('$ 15.000');
    expect(mensaje).toContain('vence hoy');

    // Juan no tiene teléfono cargado: no se puede recordar por WhatsApp.
    expect(screen.queryByRole('link', { name: /Recordar a Juan Perez/ })).not.toBeInTheDocument();
  });

  it('oculta el total del plan en una cuota extra generada por un pago parcial', async () => {
    // Los pagos parciales reparten la deuda en más cuotas que las acordadas: la 7
    // existe, pero el "de 6" ya no la describe
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 1, monto: { ARS: 15000 } },
      vencidas: { cantidad: 0, monto: {} },
      items: [{ ...cobroVencido.items[0], numeroCuota: 7, totalCuotas: 6 }],
    });

    renderPagina();

    const fila = (await screen.findByText('Maria Lopez')).closest('li')!;
    expect(fila).toHaveTextContent('Cuota 7');
    expect(fila).not.toHaveTextContent('de 6');
  });

  it('muestra el error del backend', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockRejectedValue(new Error('sin conexión'));

    renderPagina();

    expect(await screen.findByText('sin conexión')).toBeInTheDocument();
  });

  it('muestra el monto cobrable cuando la deuda de la venta es menor que la cuota', async () => {
    // Cuota de 25.000 en una venta que sólo debe 10.000: la fila no puede
    // prometer más de lo que se puede cobrar
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 1, monto: { ARS: 40000 } },
      vencidas: { cantidad: 0, monto: {} },
      items: [{ ...cobroVencido.items[0], monto: 25000, deudaVenta: 10000 }],
    });

    renderPagina();

    expect(await screen.findByText('Maria Lopez')).toBeInTheDocument();
    expect(screen.getByText('$ 10.000')).toBeInTheDocument();
    expect(screen.queryByText('$ 25.000')).not.toBeInTheDocument();
  });

  it('precarga el cobro con el monto cobrable de la cuota', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 1, monto: { ARS: 40000 } },
      vencidas: { cantidad: 0, monto: {} },
      items: [{ ...cobroVencido.items[0], monto: 25000, deudaVenta: 10000 }],
    });

    renderPagina();

    await user.click(await screen.findByRole('button', { name: 'Cobrar' }));

    expect(screen.getByLabelText(/Monto cobrado/i)).toHaveValue(10000);
  });

  it('precarga el cobro con el monto de la cuota cuando la deuda es mayor', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 1, monto: { ARS: 40000 } },
      vencidas: { cantidad: 0, monto: {} },
      items: [{ ...cobroVencido.items[0], monto: 25000, deudaVenta: 60000 }],
    });

    renderPagina();

    await user.click(await screen.findByRole('button', { name: 'Cobrar' }));

    expect(screen.getByLabelText(/Monto cobrado/i)).toHaveValue(25000);
  });

  it('filtra la agenda por el vendedor de la cartera', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(cobroVencido);

    renderPagina();
    await screen.findByText('Maria Lopez');

    await user.selectOptions(screen.getByLabelText('Vendedor'), '5');

    await waitFor(() =>
      expect(collectionsService.getCobrosHoy).toHaveBeenLastCalledWith({
        fecha: undefined,
        sellerId: 5,
      }),
    );
  });

  it('permite cobrar hasta otra fecha', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(cobroVencido);

    renderPagina();
    await screen.findByText('Maria Lopez');

    fireEvent.change(screen.getByLabelText('Cobrar hasta'), {
      target: { value: '2026-08-20' },
    });

    await waitFor(() =>
      expect(collectionsService.getCobrosHoy).toHaveBeenLastCalledWith({
        fecha: '2026-08-20',
        sellerId: undefined,
      }),
    );
  });

  it('muestra la dirección y arma la ruta en Maps con las paradas únicas', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 2, monto: { ARS: 20000 } },
      vencidas: { cantidad: 0, monto: {} },
      items: [
        { ...cobroVencido.items[0], clientAddress: 'Av. Siempre Viva 123' },
        { ...cobroVencido.items[1], clientAddress: 'Av. Siempre Viva 123' },
      ],
    });

    renderPagina();

    expect((await screen.findAllByText('Av. Siempre Viva 123')).length).toBe(2);

    await user.click(screen.getByRole('button', { name: /ruta en maps/i }));

    expect(openSpy).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/Av.%20Siempre%20Viva%20123',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('abre la dirección de un cliente en Google Maps', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 1, monto: { ARS: 15000 } },
      vencidas: { cantidad: 0, monto: {} },
      items: [{ ...cobroVencido.items[0], clientAddress: 'Av. Siempre Viva 123' }],
    });

    renderPagina();

    const enlace = await screen.findByRole('link', { name: /Av\. Siempre Viva 123/ });
    expect(enlace).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=Av.%20Siempre%20Viva%20123',
    );
    expect(enlace).toHaveAttribute('target', '_blank');
    expect(enlace.getAttribute('rel')).toContain('noopener');
  });

  it('llama al cliente desde el teléfono de la fila', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(cobroVencido);

    renderPagina();

    const enlace = await screen.findByRole('link', { name: /Llamar a Maria Lopez/ });
    expect(enlace).toHaveAttribute('href', 'tel:+5491155551234');
    expect(enlace).toHaveTextContent('1155551234');
  });

  it('no ofrece la ruta cuando ningún cliente tiene dirección', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(cobroVencido);

    renderPagina();
    await screen.findByText('Maria Lopez');

    expect(screen.queryByRole('button', { name: /ruta en maps/i })).not.toBeInTheDocument();
  });

  // Con teléfono en los dos clientes: la agenda puede recordarles a ambos
  const agendaConTelefonos: CobrosHoyResponse = {
    fecha: '2026-08-25',
    hoy: { cantidad: 2, monto: { ARS: 35000 } },
    vencidas: { cantidad: 0, monto: {} },
    items: [
      cobroVencido.items[0],
      { ...cobroVencido.items[1], clientPhone: '+5491155559999' },
    ],
  };

  it('permite seleccionar clientes y recordarles en una ronda', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(agendaConTelefonos);
    vi.mocked(collectionsService.marcarRecordatorio).mockResolvedValue({
      feeId: 10,
      ultimoRecordatorio: '2026-08-25T14:30:00',
      recordatorios: 1,
    });

    renderPagina();
    await screen.findByText('Maria Lopez');

    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar a Maria Lopez' }));
    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar a Juan Perez' }));

    expect(screen.getByText('2 seleccionados')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Recordar por WhatsApp' }));

    expect(await screen.findByText('1 de 2')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Recordatorios por WhatsApp' })).toBeInTheDocument();
  });

  it('selecciona todos los clientes recordables de una vez', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(agendaConTelefonos);

    renderPagina();
    await screen.findByText('Maria Lopez');

    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar todos' }));

    expect(screen.getByText('2 seleccionados')).toBeInTheDocument();
  });

  it('permite recordarle a todos los pendientes sin seleccionar fila por fila', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(agendaConTelefonos);

    renderPagina();
    await screen.findByText('Maria Lopez');

    await user.click(screen.getByRole('button', { name: 'Recordar a todos (2)' }));

    expect(await screen.findByText('1 de 2')).toBeInTheDocument();
  });

  it('no ofrece recordatorios masivos cuando ningún cliente tiene celular', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(cobroVencido);

    renderPagina();
    await screen.findByText('Maria Lopez');

    // Sólo Maria tiene celular: la acción masiva queda acotada a ella
    expect(screen.getByRole('button', { name: 'Recordar a todos (1)' })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Seleccionar a Juan Perez/ })).not.toBeInTheDocument();
  });

  it('marca en la fila los clientes ya recordados hoy', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      ...agendaConTelefonos,
      items: [
        {
          ...agendaConTelefonos.items[0],
          ultimoRecordatorio: '2026-08-25T14:30:00',
          recordatorios: 2,
        },
        agendaConTelefonos.items[1],
      ],
    });

    renderPagina();

    expect(await screen.findByText('Recordado 2×')).toBeInTheDocument();
  });

  it('oculta los ya recordados hoy para retomar la agenda al día siguiente', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      ...agendaConTelefonos,
      items: [
        {
          ...agendaConTelefonos.items[0],
          ultimoRecordatorio: '2026-08-25T14:30:00',
          recordatorios: 1,
        },
        agendaConTelefonos.items[1],
      ],
    });

    renderPagina();
    await screen.findByText('Maria Lopez');

    await user.click(screen.getByRole('checkbox', { name: 'Ocultar recordados hoy' }));

    expect(screen.queryByText('Maria Lopez')).not.toBeInTheDocument();
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
  });

  it('refresca la agenda al cerrar la ronda', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(agendaConTelefonos);

    renderPagina();
    await screen.findByText('Maria Lopez');
    expect(collectionsService.getCobrosHoy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Recordar a todos (2)' }));
    await screen.findByText('1 de 2');
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));

    await waitFor(() => expect(collectionsService.getCobrosHoy).toHaveBeenCalledTimes(2));
  });

  // ── Cobro por cliente: agenda agrupada + "Cobrar todo" ─────────────────────

  // Un cliente con tres cuotas en la misma moneda: un solo grupo y un subtotal.
  const agendaAgrupada: CobrosHoyResponse = {
    fecha: '2026-08-25',
    hoy: { cantidad: 3, monto: { ARS: 40000 } },
    vencidas: { cantidad: 0, monto: {} },
    items: [
      {
        ...cobroVencido.items[0],
        id: 20,
        clientId: 9,
        clientName: 'Rosa Diaz',
        currency: 'ARS',
        monto: 15000,
        deudaVenta: 60000,
      },
      {
        ...cobroVencido.items[0],
        id: 21,
        saleId: 3,
        clientId: 9,
        clientName: 'Rosa Diaz',
        currency: 'ARS',
        monto: 15000,
        deudaVenta: 60000,
      },
      {
        ...cobroVencido.items[0],
        id: 22,
        saleId: 4,
        clientId: 9,
        clientName: 'Rosa Diaz',
        currency: 'ARS',
        monto: 10000,
        deudaVenta: 60000,
      },
    ],
  };

  it('agrupa las cuotas de un cliente con un solo subtotal', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(agendaAgrupada);

    renderPagina();

    expect(await screen.findAllByText('Rosa Diaz')).toHaveLength(1);
    expect(screen.getAllByText(/Cobrable hoy:/)).toHaveLength(1);
    expect(screen.getByText('Cobrable hoy: $ 40.000')).toBeInTheDocument();
    // Las cuotas siguen visibles como filas con su cobro individual
    expect(screen.getAllByRole('button', { name: 'Cobrar' })).toHaveLength(3);
  });

  it('separa en dos grupos la deuda del mismo cliente en dos monedas', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 2, monto: { ARS: 15000, USD: 20 } },
      vencidas: { cantidad: 0, monto: {} },
      items: [
        { ...cobroVencido.items[0], id: 30, currency: 'ARS', monto: 15000, deudaVenta: 15000 },
        { ...cobroVencido.items[0], id: 31, saleId: 3, currency: 'USD', monto: 20, deudaVenta: 20 },
      ],
    });

    renderPagina();

    expect(await screen.findAllByText('Maria Lopez')).toHaveLength(2);
    expect(screen.getAllByText(/Cobrable hoy:/)).toHaveLength(2);
    expect(screen.getByText('Cobrable hoy: $ 15.000')).toBeInTheDocument();
    expect(screen.getByText('Cobrable hoy: US$ 20')).toBeInTheDocument();
    // Las monedas nunca se suman entre sí
    expect(screen.queryByText('$ 15.020')).not.toBeInTheDocument();
  });

  it('acota el subtotal del grupo a la deuda de la venta', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue({
      fecha: '2026-08-25',
      hoy: { cantidad: 2, monto: { ARS: 50000 } },
      vencidas: { cantidad: 0, monto: {} },
      items: [
        { ...cobroVencido.items[0], id: 40, currency: 'ARS', monto: 25000, deudaVenta: 20000 },
        { ...cobroVencido.items[0], id: 41, currency: 'ARS', monto: 25000, deudaVenta: 20000 },
      ],
    });

    renderPagina();

    expect(await screen.findByText('Cobrable hoy: $ 20.000')).toBeInTheDocument();
    expect(screen.queryByText('Cobrable hoy: $ 50.000')).not.toBeInTheDocument();
  });

  it('abre el cobro por cliente con el subtotal del grupo precargado', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(agendaAgrupada);

    renderPagina();

    await user.click(await screen.findByRole('button', { name: 'Cobrar todo a Rosa Diaz' }));

    expect(screen.getByRole('dialog', { name: 'Cobrar todo · Rosa Diaz' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Monto cobrado/i)).toHaveValue(40000);
  });

  it('recarga la agenda al registrar el cobro por cliente', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(agendaAgrupada);
    vi.mocked(collectionsService.payClient).mockResolvedValue({
      clientId: 9,
      clientName: 'Rosa Diaz',
      currency: 'ARS',
      appliedAmount: 40000,
      remainingDebt: 0,
      applications: [],
    });

    renderPagina();
    await screen.findByText('Rosa Diaz');
    expect(collectionsService.getCobrosHoy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Cobrar todo a Rosa Diaz' }));
    await user.click(screen.getByRole('button', { name: /Registrar cobro/i }));

    await waitFor(() => expect(collectionsService.getCobrosHoy).toHaveBeenCalledTimes(2));
  });

  it('mantiene el cobro individual de cada cuota dentro del grupo', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(agendaAgrupada);

    renderPagina();
    await screen.findByText('Rosa Diaz');

    await user.click(screen.getAllByRole('button', { name: 'Cobrar' })[0]);

    expect(screen.getByText('Cobrar cuota 1 · Rosa Diaz')).toBeInTheDocument();
    expect(screen.getByLabelText(/Monto cobrado/i)).toHaveValue(15000);
  });

  // ── Promesas de pago: badge en la cabecera del grupo ────────────────────────

  const promesa = (overrides: Partial<PaymentPromise> = {}): PaymentPromise => ({
    id: 70,
    clientId: 9,
    clientName: 'Rosa Diaz',
    currency: 'ARS',
    amount: 40000,
    promisedDate: '2026-09-05',
    status: 'PENDING',
    vencida: false,
    diasAtraso: null,
    note: null,
    ...overrides,
  });

  // El grupo se arma por cliente + moneda: las cuotas necesitan su moneda para
  // que la promesa (que siempre trae una) se encuentre en el índice.
  const agendaConPromesa = (p: PaymentPromise): CobrosHoyResponse => ({
    ...agendaAgrupada,
    items: agendaAgrupada.items.map((item) => ({ ...item, currency: 'ARS' })),
    promesas: [p],
  });

  it('muestra el badge de la promesa con la fecha comprometida', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(agendaConPromesa(promesa()));

    renderPagina();

    expect(await screen.findByText('Prometió pagar el 05/09/2026')).toBeInTheDocument();
    // Con una promesa vigente no se ofrece cargar otra
    expect(screen.queryByRole('button', { name: 'Promesa' })).not.toBeInTheDocument();
  });

  it('marca en rojo la promesa vencida', async () => {
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(
      agendaConPromesa(promesa({ vencida: true, diasAtraso: 4, promisedDate: '2026-09-01' })),
    );

    renderPagina();

    const badge = await screen.findByRole('button', { name: /Promesa vencida/ });
    expect(badge).toHaveTextContent('Promesa vencida · 01/09/2026');
    expect(badge.className).toContain('text-red-700');
  });

  it('abre la gestión de la promesa desde el badge', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(agendaConPromesa(promesa()));

    renderPagina();

    await user.click(await screen.findByRole('button', { name: 'Prometió pagar el 05/09/2026' }));

    expect(screen.getByRole('dialog', { name: 'Promesa de pago · Rosa Diaz' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Marcar cumplida/i })).toBeInTheDocument();
  });

  it('abre el alta de la promesa desde el botón Promesa', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(agendaAgrupada);

    renderPagina();

    await user.click(await screen.findByRole('button', { name: 'Promesa' }));

    expect(screen.getByRole('dialog', { name: 'Promesa de pago · Rosa Diaz' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Registrar promesa/i })).toBeInTheDocument();
  });

  it('recarga la agenda al registrar la promesa', async () => {
    const user = userEvent.setup();
    vi.mocked(collectionsService.getCobrosHoy).mockResolvedValue(agendaAgrupada);
    vi.mocked(collectionsService.createPromise).mockResolvedValue(promesa());

    renderPagina();
    await screen.findByText('Rosa Diaz');
    expect(collectionsService.getCobrosHoy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Promesa' }));
    await user.click(screen.getByRole('button', { name: /Registrar promesa/i }));

    await waitFor(() => expect(collectionsService.getCobrosHoy).toHaveBeenCalledTimes(2));
  });
});
