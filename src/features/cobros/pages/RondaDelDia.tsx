import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  HandCoins,
  Handshake,
  MapPin,
  Phone,
  RefreshCw,
  Route,
  Undo2,
} from 'lucide-react';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import { formatCurrency, formatMoneyByCurrency } from '@/shared/utils/formatCurrency';
import { buildMapsDestinationUrl, buildMapsRouteUrl } from '@/shared/utils/mapsRoute';
import { buildTelHref, formatearTelefono } from '@/shared/utils/telefono';
import { collectionsService } from '@/features/cobros/services/collectionsService';
import PayClientModal from '@/features/cobros/components/PayClientModal';
import type { ClientGroup } from '@/features/cobros/utils/clientGroups';
import type { RoundItem, RoundResponse } from '@/shared/types/business';
import type { MontosPorMoneda } from '@/shared/types/money';

interface RondaDelDiaProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const formatearFecha = (iso: string) => iso.split('-').reverse().join('/');

/** Suma montos por moneda: nunca se mezclan monedas distintas. */
const sumarPorMoneda = (items: RoundItem[], campo: 'amount' | 'pendingAmount'): MontosPorMoneda => {
  const totales: MontosPorMoneda = {};
  for (const item of items) {
    const monto = campo === 'amount' ? item.amount : item.pendingAmount;
    if (monto == null) continue;
    totales[item.currency] = (totales[item.currency] ?? 0) + monto;
  }
  return totales;
};

const EstadoBadge = ({ estado }: { estado: RoundItem['estado'] }) => {
  if (estado === 'COBRADO') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        Cobrado
      </span>
    );
  }
  if (estado === 'NO_ESTABA') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        No estaba
      </span>
    );
  }
  return null;
};

/**
 * Ronda del día: la hoja de ruta que arma el backend una vez por día, ordenada
 * por riesgo. No se reordena acá: el plan es el plan y el cobrador lo trabaja
 * en el orden en que se armó.
 */
const RondaDelDia: React.FC<RondaDelDiaProps> = ({ user, onLogout }) => {
  const [ronda, setRonda] = useState<RoundResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ocultarCobrados, setOcultarCobrados] = useState(false);
  const [grupoACobrar, setGrupoACobrar] = useState<ClientGroup | null>(null);
  const [marcando, setMarcando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRonda(await collectionsService.getRound());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la ronda del día');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const items = useMemo(() => ronda?.items ?? [], [ronda]);
  const visibles = useMemo(
    () => (ocultarCobrados ? items.filter((item) => item.estado !== 'COBRADO') : items),
    [items, ocultarCobrados],
  );

  const pendientes = items.filter((item) => item.estado === 'PENDIENTE');
  const cobrados = items.filter((item) => item.estado === 'COBRADO');
  const noEstaba = items.filter((item) => item.estado === 'NO_ESTABA');

  const urlRuta = useMemo(
    () =>
      buildMapsRouteUrl(
        items
          .filter((item) => item.estado === 'PENDIENTE')
          .map((item) => item.clientAddress ?? ''),
      ),
    [items],
  );

  const marcarVisita = async (item: RoundItem, noEstaba: boolean) => {
    setMarcando(item.id);
    setError(null);
    try {
      setRonda(await collectionsService.marcarVisitaRonda(item.id, { noEstaba }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar la visita');
    } finally {
      setMarcando(null);
    }
  };

  const grupoParaCobrar = (item: RoundItem): ClientGroup => ({
    key: `${item.clientId}:${item.currency}`,
    clientId: item.clientId,
    clientName: item.clientName,
    clientPhone: item.clientPhone ?? null,
    clientAddress: item.clientAddress ?? null,
    currency: item.currency,
    items: [],
    subtotal: item.pendingAmount ?? item.amount,
    debt: null,
  });

  return (
    <DashboardLayout title="Ronda del día" user={user} onLogout={onLogout}>
      <PageHeader
        eyebrow="Operación · Ruta"
        title="Ronda del día"
        subtitle={
          ronda
            ? `Plan del día ordenado por riesgo · ${formatearFecha(ronda.fecha)}`
            : 'Plan del día ordenado por riesgo'
        }
        icon={<Route className="w-6 h-6 text-brand-600" />}
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
            <Button
              variant="secondary"
              onClick={cargar}
              isLoading={loading}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Actualizar
            </Button>
          </div>
        }
      />

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</Card>
      )}

      {ronda && (
        <>
          <div className="mb-6 flex flex-wrap gap-0 divide-y divide-gray-100 rounded-card bg-surface shadow-card sm:divide-y-0 sm:divide-x sm:divide-gray-100">
            <div className="flex-1 min-w-[200px] px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Paradas</p>
              <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-heading tabular-nums">
                {items.length}
              </p>
              <p className="text-xs text-gray-500">
                {pendientes.length} pendientes · {cobrados.length} cobradas · {noEstaba.length} sin visita
              </p>
            </div>
            <div className="flex-1 min-w-[220px] px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Planificado</p>
              <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-heading tabular-nums">
                {formatMoneyByCurrency(sumarPorMoneda(items, 'amount')) || formatCurrency(0)}
              </p>
            </div>
            <div className="flex-1 min-w-[220px] px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Por cobrar</p>
              <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-heading tabular-nums">
                {formatMoneyByCurrency(sumarPorMoneda(items, 'pendingAmount')) || formatCurrency(0)}
              </p>
            </div>
          </div>

          <Card className="p-4 mb-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={ocultarCobrados}
                onChange={(event) => setOcultarCobrados(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              />
              Ocultar cobrados
            </label>
          </Card>

          <Card>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
                <h2 className="font-display text-lg font-bold text-heading">No hay paradas para hoy</h2>
                <p className="mt-1 text-sm text-gray-500">
                  No tenés clientes con deuda vencida ni con vencimiento en el día de la fecha.
                </p>
              </div>
            ) : visibles.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
                <h2 className="font-display text-lg font-bold text-heading">Ronda completa</h2>
                <p className="mt-1 text-sm text-gray-500">Todas las paradas de la ronda ya están cobradas.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {visibles.map((item) => {
                  const urlMapa = item.clientAddress ? buildMapsDestinationUrl(item.clientAddress) : null;
                  const telHref = buildTelHref(item.clientPhone);
                  const telefono = formatearTelefono(item.clientPhone);
                  const cobrado = item.estado === 'COBRADO';
                  return (
                    <li
                      key={item.id}
                      className={`flex flex-wrap items-center gap-4 px-5 py-4 ${cobrado ? 'opacity-60' : ''}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 tabular-nums">
                        {item.position}
                      </span>

                      <div className="min-w-[180px] flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-heading">{item.clientName}</p>
                          <EstadoBadge estado={item.estado} />
                          {item.promiseId && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                item.promiseOverdue
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                              title={
                                item.promiseOverdue
                                  ? 'El cliente prometió pagar y no lo hizo'
                                  : 'El cliente prometió pagar'
                              }
                            >
                              <Handshake className="h-3 w-3" aria-hidden="true" />
                              {item.promiseOverdue ? 'Promesa vencida' : 'Prometió'}
                              {item.promiseDate ? ` · ${formatearFecha(item.promiseDate)}` : ''}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-col items-start gap-1">
                          {item.clientPhone && (
                            <a
                              href={telHref ?? undefined}
                              aria-label={`Llamar a ${item.clientName} al ${telefono}`}
                              className="-mx-1 inline-flex max-w-full items-center gap-1 rounded-md px-1 text-xs font-medium text-brand-700 hover:text-brand-900"
                            >
                              <Phone className="h-3 w-3 shrink-0" />
                              <span className="truncate">{telefono}</span>
                            </a>
                          )}
                          {item.clientAddress && (
                            <a
                              href={urlMapa ?? undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Abrir ${item.clientAddress} en Google Maps`}
                              className="-mx-1 inline-flex max-w-full items-center gap-1 rounded-md px-1 text-xs font-medium text-brand-700 hover:text-brand-900"
                            >
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{item.clientAddress}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-display text-base font-bold text-heading tabular-nums">
                          {formatCurrency(item.pendingAmount ?? item.amount, item.currency || undefined)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.amount !== (item.pendingAmount ?? item.amount)
                            ? `Planificado ${formatCurrency(item.amount, item.currency || undefined)}`
                            : null}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.daysOverdue && item.daysOverdue > 0
                            ? `${item.daysOverdue} ${item.daysOverdue === 1 ? 'día' : 'días'} de atraso`
                            : 'Vence hoy'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {!cobrado && (
                          <Button
                            variant="ghost"
                            onClick={() => marcarVisita(item, item.estado !== 'NO_ESTABA')}
                            isLoading={marcando === item.id}
                            leftIcon={
                              item.estado === 'NO_ESTABA' ? (
                                <Undo2 className="h-4 w-4" />
                              ) : (
                                <MapPin className="h-4 w-4" />
                              )
                            }
                          >
                            {item.estado === 'NO_ESTABA' ? 'Deshacer' : 'No estaba'}
                          </Button>
                        )}
                        {!cobrado && (
                          <Button
                            variant="secondary"
                            onClick={() => setGrupoACobrar(grupoParaCobrar(item))}
                            leftIcon={<HandCoins className="h-4 w-4" />}
                          >
                            Cobrar
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <p className="mt-4 text-xs text-gray-500">
            ¿Necesitás ajustar algo?{' '}
            <Link to="/dashboard/cobros" className="font-medium text-brand-700 hover:text-brand-900">
              Abrí la agenda de cobros
            </Link>
            .
          </p>
        </>
      )}

      <PayClientModal
        group={grupoACobrar}
        onClose={() => setGrupoACobrar(null)}
        onPaid={cargar}
      />
    </DashboardLayout>
  );
};

export default RondaDelDia;
