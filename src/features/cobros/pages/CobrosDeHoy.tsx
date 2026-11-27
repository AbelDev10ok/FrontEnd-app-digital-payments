import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  HandCoins,
  Handshake,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Route,
} from 'lucide-react';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import { Input, Select } from '@/shared/components/ui';
import { formatCurrency, formatMoneyByCurrency } from '@/shared/utils/formatCurrency';
import { buildMapsDestinationUrl, buildMapsRouteUrl } from '@/shared/utils/mapsRoute';
import { buildTelHref, formatearTelefono } from '@/shared/utils/telefono';
import { collectionsService } from '@/features/cobros/services/collectionsService';
import PayFeeModal from '@/features/cobros/components/PayFeeModal';
import PayClientModal from '@/features/cobros/components/PayClientModal';
import PaymentPromiseModal from '@/features/cobros/components/PaymentPromiseModal';
import CuotaEstadoBadge from '@/features/cobros/components/CuotaEstadoBadge';
import RecordatorioRondaModal from '@/features/cobros/components/RecordatorioRondaModal';
import { montoCobrableDeCuota } from '@/features/cobros/utils/montoCobrable';
import { groupByClientAndCurrency } from '@/features/cobros/utils/clientGroups';
import type { ClientGroup } from '@/features/cobros/utils/clientGroups';
import { esRecordadoHoy, recordatorioHrefDeCuota } from '@/features/cobros/utils/recordatorio';
import { sufijoTotalCuotas } from '@/features/cobros/utils/numeroCuota';
import { salesService } from '@/features/ventas/services/salesServices';
import type { Client } from '@/shared/types/client';
import type { CobrosHoyResponse, CuotaItem, PaymentPromise } from '@/shared/types/business';
import type { MontosPorMoneda } from '@/shared/types/money';

interface CobrosDeHoyProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const formatearFecha = (iso: string) => iso.split('-').reverse().join('/');

const ResumenLinea = ({
  titulo,
  cantidad,
  monto,
}: {
  titulo: string;
  cantidad: number;
  monto: MontosPorMoneda;
}) => (
  <div className="flex-1 min-w-[200px] px-5 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">{titulo}</p>
    <p className="mt-1 flex items-baseline gap-2">
      <span className="font-display text-xl font-extrabold tracking-tight text-heading tabular-nums">
        {formatMoneyByCurrency(monto) || formatCurrency(0)}
      </span>
      <span className="text-xs text-gray-500">
        {cantidad} {cantidad === 1 ? 'cuota' : 'cuotas'}
      </span>
    </p>
  </div>
);

const CobrosDeHoy: React.FC<CobrosDeHoyProps> = ({ user, onLogout }) => {
  const [data, setData] = useState<CobrosHoyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cuotaACobrar, setCuotaACobrar] = useState<CuotaItem | null>(null);
  const [grupoACobrar, setGrupoACobrar] = useState<ClientGroup | null>(null);
  const [grupoPromesa, setGrupoPromesa] = useState<ClientGroup | null>(null);
  const [fecha, setFecha] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [sellerOptions, setSellerOptions] = useState<Client[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [ocultarRecordados, setOcultarRecordados] = useState(false);
  const [rondaCuotas, setRondaCuotas] = useState<CuotaItem[] | null>(null);

  // Opciones del filtro por vendedor (se piden una vez)
  useEffect(() => {
    salesService
      .getSellers()
      .then(setSellerOptions)
      .catch(() => setSellerOptions([]));
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(
        await collectionsService.getCobrosHoy({
          fecha: fecha || undefined,
          sellerId: sellerId ? Number(sellerId) : undefined,
        }),
      );
      // La selección es efímera: al recargar la agenda se arranca limpio
      setSeleccionados(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los cobros del día');
    } finally {
      setLoading(false);
    }
  }, [fecha, sellerId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const items = useMemo(() => data?.items ?? [], [data]);

  // Sólo se puede recordar por WhatsApp una cuota impaga de un cliente con
  // celular interpretable: el mensaje y el enlace salen de una única fuente.
  const esRecordable = useCallback(
    (cuota: CuotaItem) => !cuota.pagada && recordatorioHrefDeCuota(cuota) !== null,
    [],
  );

  const recordables = useMemo(() => items.filter(esRecordable), [items, esRecordable]);

  const visibles = useMemo(
    () =>
      ocultarRecordados
        ? items.filter((cuota) => !esRecordadoHoy(cuota.ultimoRecordatorio, data?.fecha ?? ''))
        : items,
    [items, ocultarRecordados, data?.fecha],
  );

  // La agenda se lee por cliente y moneda: cada grupo tiene su encabezado con
  // el cobrable de hoy (con tope en la deuda de cada venta) y su acción
  // "Cobrar todo", sin perder el cobro individual de cada cuota.
  const grupos = useMemo(() => groupByClientAndCurrency(visibles), [visibles]);

  // Las promesas de pago viajan en la misma respuesta: se indexan por el mismo
  // par cliente + moneda con el que se agrupa la agenda.
  const promesasPorGrupo = useMemo(() => {
    const index = new Map<string, PaymentPromise>();
    for (const promesa of data?.promesas ?? []) {
      index.set(`${promesa.clientId}:${promesa.currency}`, promesa);
    }
    return index;
  }, [data]);

  const seleccionadas = useMemo(
    () => recordables.filter((cuota) => seleccionados.has(cuota.id)),
    [recordables, seleccionados],
  );

  const todosSeleccionados =
    recordables.length > 0 && recordables.every((cuota) => seleccionados.has(cuota.id));

  const alternarSeleccion = (id: number) => {
    setSeleccionados((previos) => {
      const siguientes = new Set(previos);
      if (siguientes.has(id)) {
        siguientes.delete(id);
      } else {
        siguientes.add(id);
      }
      return siguientes;
    });
  };

  const alternarTodos = () => {
    setSeleccionados(todosSeleccionados ? new Set() : new Set(recordables.map((cuota) => cuota.id)));
  };

  // El recordatorio de la fila ya abrió el chat: la marca se actualiza en la
  // agenda para que el cliente no vuelva a aparecer como pendiente.
  const registrarRecordatorio = async (cuota: CuotaItem) => {
    try {
      const marca = await collectionsService.marcarRecordatorio(cuota.id);
      setData((previo) =>
        previo
          ? {
              ...previo,
              items: previo.items.map((item) =>
                item.id === cuota.id
                  ? {
                      ...item,
                      ultimoRecordatorio: marca.ultimoRecordatorio,
                      recordatorios: marca.recordatorios,
                    }
                  : item,
              ),
            }
          : previo,
      );
    } catch {
      // Abrir WhatsApp ya es útil: no se bloquea al usuario porque falle la marca.
    }
  };

  const cerrarRonda = () => {
    setRondaCuotas(null);
    setSeleccionados(new Set());
    // La ronda registró recordatorios en el servidor: la agenda se refresca.
    cargar();
  };

  // Ruta de cobro del listado actual (respeta los filtros): paradas únicas en
  // el orden de la agenda, del vencimiento más viejo al más nuevo.
  const urlRuta = useMemo(
    () => buildMapsRouteUrl((data?.items ?? []).map((cuota) => cuota.clientAddress ?? '')),
    [data],
  );

  return (
    <DashboardLayout title="Cobros de hoy" user={user} onLogout={onLogout}>
      <PageHeader
        eyebrow="Operación · Agenda"
        title="Cobros de hoy"
        subtitle={
          data
            ? `Cuotas que vencen hoy y las ya vencidas · ${formatearFecha(data.fecha)}`
            : 'Cuotas que vencen hoy y las ya vencidas'
        }
        icon={<CalendarClock className="w-6 h-6 text-brand-600" />}
        actions={
          <div className="flex items-center gap-2">
            {urlRuta && (
              <Button
                variant="secondary"
                onClick={() => window.open(urlRuta, '_blank', 'noopener,noreferrer')}
                leftIcon={<Route className="w-4 h-4" />}
              >
                Abrir ruta en Maps
              </Button>
            )}
            <Button variant="secondary" onClick={cargar} isLoading={loading} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Actualizar
            </Button>
          </div>
        }
      />

      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-56">
            <label htmlFor="agenda-vendedor" className="block text-sm font-medium text-gray-700 mb-2">
              Vendedor
            </label>
            <Select
              id="agenda-vendedor"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
            >
              <option value="">Todos</option>
              {sellerOptions.map((vendedor) => (
                <option key={vendedor.id} value={String(vendedor.id)}>
                  {vendedor.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="agenda-hasta" className="block text-sm font-medium text-gray-700 mb-2">
              Cobrar hasta
            </label>
            <Input
              id="agenda-hasta"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 pb-2.5 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={ocultarRecordados}
              onChange={(e) => setOcultarRecordados(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            />
            Ocultar recordados hoy
          </label>
          {(fecha || sellerId) && (
            <Button
              variant="ghost"
              onClick={() => {
                setFecha('');
                setSellerId('');
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</Card>
      )}

      {data && (
        <>
          <div className="flex flex-wrap gap-0 divide-y divide-gray-100 sm:divide-y-0 sm:divide-x sm:divide-gray-100 mb-6 rounded-card bg-surface shadow-card">
            <ResumenLinea titulo="Vencen hoy" cantidad={data.hoy.cantidad} monto={data.hoy.monto} />
            <ResumenLinea titulo="Vencidas" cantidad={data.vencidas.cantidad} monto={data.vencidas.monto} />
          </div>

          <Card>
            {data.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                <h2 className="font-display text-lg font-bold text-heading">No hay cuotas por cobrar</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {fecha || sellerId
                    ? 'Ninguna cuota coincide con los filtros elegidos.'
                    : 'No tenés cuotas vencidas ni con vencimiento en el día de la fecha.'}
                </p>
              </div>
            ) : visibles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                <h2 className="font-display text-lg font-bold text-heading">Agenda al día</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Todas las cuotas de la agenda ya tienen recordatorio hoy.
                </p>
              </div>
            ) : (
              <>
                {recordables.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        onChange={alternarTodos}
                        aria-label="Seleccionar todos"
                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                      />
                      Seleccionar todos
                    </label>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setRondaCuotas(recordables)}
                      leftIcon={<MessageCircle className="w-4 h-4" />}
                    >
                      Recordar a todos ({recordables.length})
                    </Button>
                  </div>
                )}
                <ul className="divide-y divide-gray-100">
                  {grupos.map((grupo) => {
                    const urlMapaGrupo = grupo.clientAddress
                      ? buildMapsDestinationUrl(grupo.clientAddress)
                      : null;
                    const telHrefGrupo = buildTelHref(grupo.clientPhone);
                    const telefonoGrupo = formatearTelefono(grupo.clientPhone);
                    const promesaGrupo = promesasPorGrupo.get(grupo.key);
                    return (
                      <li key={grupo.key} className="divide-y divide-dashed divide-gray-100">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 bg-gray-50/70 px-5 py-4">
                          <div className="min-w-[180px] flex-1">
                            <p className="font-semibold text-heading">{grupo.clientName}</p>
                            {promesaGrupo && (
                              <button
                                type="button"
                                onClick={() => setGrupoPromesa(grupo)}
                                title={
                                  promesaGrupo.vencida
                                    ? 'Promesa vencida: abrir para gestionar'
                                    : 'Ver la promesa de pago'
                                }
                                className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                                  promesaGrupo.vencida
                                    ? 'bg-red-50 text-red-700 hover:bg-red-100 focus-visible:outline-red-600'
                                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 focus-visible:outline-amber-600'
                                }`}
                              >
                                <Handshake className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                {promesaGrupo.vencida
                                  ? `Promesa vencida · ${formatearFecha(promesaGrupo.promisedDate)}`
                                  : `Prometió pagar el ${formatearFecha(promesaGrupo.promisedDate)}`}
                              </button>
                            )}
                            <div className="mt-1.5 flex max-w-[300px] flex-col items-start gap-1">
                              {grupo.clientPhone && (
                                telHrefGrupo ? (
                                  <a
                                    href={telHrefGrupo}
                                    aria-label={`Llamar a ${grupo.clientName} al ${telefonoGrupo}`}
                                    className="-mx-1 inline-flex max-w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-xs font-medium text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                                  >
                                    <Phone className="w-3.5 h-3.5 shrink-0" />
                                    <span className="min-w-0 truncate">{telefonoGrupo}</span>
                                  </a>
                                ) : (
                                  <p className="inline-flex max-w-full items-center gap-1.5 text-xs text-gray-500">
                                    <Phone className="w-3.5 h-3.5 shrink-0" />
                                    <span className="min-w-0 truncate">{telefonoGrupo}</span>
                                  </p>
                                )
                              )}
                              {urlMapaGrupo && (
                                <a
                                  href={urlMapaGrupo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Abrir ${grupo.clientAddress} en Google Maps`}
                                  className="-mx-1 inline-flex max-w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                                >
                                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                                  <span className="min-w-0 truncate">{grupo.clientAddress}</span>
                                </a>
                              )}
                            </div>
                          </div>

                          <p className="text-sm font-medium text-gray-700">
                            {`Cobrable hoy: ${formatCurrency(grupo.subtotal, grupo.currency || undefined)}`}
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            {!promesaGrupo && (
                              <Button
                                size="sm"
                                variant="ghost"
                                leftIcon={<Handshake className="w-4 h-4" />}
                                onClick={() => setGrupoPromesa(grupo)}
                              >
                                Promesa
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="secondary"
                              leftIcon={<HandCoins className="w-4 h-4" />}
                              onClick={() => setGrupoACobrar(grupo)}
                            >
                              Cobrar todo a {grupo.clientName}
                            </Button>
                          </div>
                        </div>

                        <ul className="divide-y divide-dashed divide-gray-100">
                          {grupo.items.map((cuota) => {
                            const recordatorioHref = esRecordable(cuota) ? recordatorioHrefDeCuota(cuota) : null;
                            const recordadoHoy = esRecordadoHoy(cuota.ultimoRecordatorio, data.fecha);
                            return (
                              <li key={cuota.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
                                {recordatorioHref && (
                                  <input
                                    type="checkbox"
                                    checked={seleccionados.has(cuota.id)}
                                    onChange={() => alternarSeleccion(cuota.id)}
                                    aria-label={`Seleccionar a ${cuota.clientName}`}
                                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                                  />
                                )}
                                <div className="min-w-[180px] flex-1">
                                  <p className="text-xs text-gray-500 truncate max-w-[280px]">
                                    {cuota.saleDescription || 'Venta'}
                                  </p>
                                </div>

                                <div className="text-sm text-gray-600 whitespace-nowrap">
                                  Cuota <span className="font-semibold text-brand-800">{cuota.numeroCuota}</span>
                                  {sufijoTotalCuotas(cuota.numeroCuota, cuota.totalCuotas, 'de')}
                                  <span className="block text-xs text-gray-400 mt-0.5">
                                    Vencía el {formatearFecha(cuota.fechaVencimiento)}
                                  </span>
                                </div>

                                <CuotaEstadoBadge cuota={cuota} />

                                {recordadoHoy && (
                                  <span
                                    title="Último recordatorio de hoy"
                                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    {cuota.recordatorios && cuota.recordatorios > 1
                                      ? `Recordado ${cuota.recordatorios}×`
                                      : 'Recordado'}
                                  </span>
                                )}

                                <p className="font-mono text-base font-semibold tabular-nums text-heading min-w-[110px] text-right">
                                  {formatCurrency(montoCobrableDeCuota(cuota), cuota.currency ?? undefined)}
                                </p>

                                <div className="flex flex-wrap items-center gap-2 ml-auto">
                                  {recordatorioHref && (
                                    <a
                                      href={recordatorioHref}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => void registrarRecordatorio(cuota)}
                                      aria-label={`Recordar a ${cuota.clientName} por WhatsApp`}
                                      title="Abrir WhatsApp con el recordatorio ya escrito"
                                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                      Recordar
                                    </a>
                                  )}
                                  <Link
                                    to={`/dashboard/ventas/${cuota.saleId}`}
                                    aria-label={`Ver detalle de la venta de ${cuota.clientName}`}
                                    className="p-2 rounded-lg text-gray-400 hover:text-brand-700 hover:bg-brand-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                  <Button size="sm" leftIcon={<HandCoins className="w-4 h-4" />} onClick={() => setCuotaACobrar(cuota)}>
                                    Cobrar
                                  </Button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Card>

          {!loading && data.items.length > 0 && (
            <p className="mt-3 text-xs text-gray-400">
              Se muestran como máximo las 200 cuotas más antiguas pendientes de cobro.
            </p>
          )}
        </>
      )}

      {seleccionadas.length > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-gray-200 bg-surface px-4 py-2 shadow-xl">
          <span className="text-sm font-medium text-gray-700">
            {seleccionadas.length} {seleccionadas.length === 1 ? 'seleccionado' : 'seleccionados'}
          </span>
          <Button
            size="sm"
            onClick={() => setRondaCuotas(seleccionadas)}
            leftIcon={<MessageCircle className="w-4 h-4" />}
          >
            Recordar por WhatsApp
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSeleccionados(new Set())}>
            Limpiar
          </Button>
        </div>
      )}

      {rondaCuotas && (
        <RecordatorioRondaModal cuotas={rondaCuotas} onClose={cerrarRonda} />
      )}

      <PayFeeModal
        cuota={cuotaACobrar}
        onClose={() => setCuotaACobrar(null)}
        onPaid={cargar}
        deudaRestante={cuotaACobrar?.deudaVenta ?? undefined}
      />

      <PayClientModal
        group={grupoACobrar}
        onClose={() => setGrupoACobrar(null)}
        onPaid={cargar}
      />

      <PaymentPromiseModal
        group={grupoPromesa}
        promise={grupoPromesa ? promesasPorGrupo.get(grupoPromesa.key) ?? null : null}
        onClose={() => setGrupoPromesa(null)}
        onChanged={cargar}
      />
    </DashboardLayout>
  );
};

export default CobrosDeHoy;
