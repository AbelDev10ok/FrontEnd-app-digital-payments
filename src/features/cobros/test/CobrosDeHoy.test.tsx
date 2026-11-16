import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CobrosDeHoy from '../pages/CobrosDeHoy';
import { collectionsService } from '@/features/cobros/services/collectionsService';
import { salesService } from '@/features/ventas/services/salesServices';
import type { Client } from '@/shared/types/client';
import type { CobrosHoyResponse } from '@/shared/types/business';

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
    // Botones de cobro
    expect(screen.getAllByRole('button', { name: /Cobrar/ }).length).toBe(2);
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

    await user.click(await screen.findByRole('button', { name: /Cobrar/ }));

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

    await user.click(await screen.findByRole('button', { name: /Cobrar/ }));

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
});
