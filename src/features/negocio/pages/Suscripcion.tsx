import { useEffect, useState } from 'react';
import { BadgeCheck, CalendarDays, CreditCard, Sparkles } from 'lucide-react';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import { businessService } from '@/features/negocio/services/businessService';
import { billingService, type SubscriptionStatus } from '@/features/negocio/services/billingService';
import type { BusinessMe } from '@/shared/types/business';
import { getLocalDateString } from '@/shared/utils/formatDate';
import { tones, neutral } from '@/shared/theme';

interface SuscripcionProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const hoyISO = () => getLocalDateString();

const diasRestantes = (fecha?: string | null): number | null => {
  if (!fecha) return null;
  const fin = new Date(`${fecha}T00:00:00`);
  const hoy = new Date(`${hoyISO()}T00:00:00`);
  const diff = Math.round((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  return Number.isFinite(diff) ? diff : null;
};

const formatearFecha = (iso?: string | null) =>
  iso ? iso.split('-').reverse().join('/') : '—';

const Suscripcion: React.FC<SuscripcionProps> = ({ user, onLogout }) => {
  const [negocio, setNegocio] = useState<BusinessMe | null>(null);
  const [suscripcion, setSuscripcion] = useState<SubscriptionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [activando, setActivando] = useState(false);
  const [gestionando, setGestionando] = useState(false);
  const [confirmando, setConfirmando] = useState<'cancelar' | 'pausar' | null>(null);

  const cargar = () => {
    setCargando(true);
    setError(null);
    Promise.all([
      businessService.getMyBusiness(),
      billingService.getStatus(),
    ])
      .then(([biz, sub]) => {
        setNegocio(biz);
        setSuscripcion(sub);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error al cargar la suscripcion');
      })
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  const activarSuscripcion = async () => {
    setActivando(true);
    setError(null);
    try {
      const result = await billingService.subscribe();
      if (result.initPoint) {
        window.location.href = result.initPoint;
      } else {
        setError('No se recibio el enlace de pago. Intente nuevamente.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al activar la suscripcion');
    } finally {
      setActivando(false);
    }
  };

  const gestionarSuscripcion = async (accion: 'cancel' | 'pause' | 'resume') => {
    setGestionando(true);
    setError(null);
    try {
      const actualizada =
        accion === 'cancel'
          ? await billingService.cancel()
          : accion === 'pause'
            ? await billingService.pause()
            : await billingService.resume();
      setSuscripcion(actualizada);
      setConfirmando(null);
      // Refrescar el negocio: planStatus y subscriptionUntil cambiaron
      const biz = await businessService.getMyBusiness().catch(() => null);
      if (biz) setNegocio(biz);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la suscripcion');
    } finally {
      setGestionando(false);
    }
  };

  const estado = suscripcion?.status ?? negocio?.planStatus ?? 'TRIALING';
  const enTrial = estado === 'TRIALING' || estado === 'TRIAL';
  const activa = estado === 'ACTIVE';
  const pausada = estado === 'PAUSED';
  const cancelada = estado === 'CANCELLED';
  // El aviso de cobro rechazado lo limpia un cobro aprobado o una accion
  // manual; si persiste con la suscripcion cancelada, MP la cancelo sola
  const avisoCobroRechazado = Boolean(suscripcion?.lastPaymentFailedAt) && !cancelada;
  const canceladaPorRechazo = cancelada && Boolean(suscripcion?.lastPaymentFailedAt);
  const accesoHasta = negocio?.subscriptionUntil ?? suscripcion?.currentPeriodEnd ?? null;
  const restante = diasRestantes(
    activa
      ? suscripcion?.currentPeriodEnd
      : pausada || cancelada
        ? accesoHasta
        : negocio?.trialEndsAt,
  );
  const etiquetaFecha = activa
    ? 'Renovacion'
    : pausada || cancelada
      ? 'Acceso hasta'
      : 'La prueba termina';
  const fechaReferencia = activa
    ? suscripcion?.currentPeriodEnd
    : pausada || cancelada
      ? accesoHasta
      : negocio?.trialEndsAt;

  return (
    <DashboardLayout title="Suscripcion" user={user} onLogout={onLogout}>
      <PageHeader
        eyebrow="Configuracion"
        title="Suscripcion"
        subtitle="El estado del plan de tu negocio"
        icon={<BadgeCheck className={`w-6 h-6 ${tones.brand.icon}`} />}
      />

      {error && (
        <Card className={`mb-4 ${tones.danger.bg} ${tones.danger.border} p-4 text-sm font-medium ${tones.danger.text}`}>
          {error}
        </Card>
      )}

      {!cargando && avisoCobroRechazado && (
        <Card className={`mb-4 ${tones.warning.bg} ${tones.warning.border} p-4 text-sm`}>
          <p className={`font-semibold ${tones.warning.text}`}>Cobro de renovacion rechazado</p>
          <p className={`mt-1 leading-relaxed ${neutral.secondary}`}>
            Mercado Pago reintenta el cobro automaticamente. Revisa tu medio de pago para
            no perder el acceso al vencer el periodo.
          </p>
          <a
            href="https://www.mercadopago.com.ar/subscriptions"
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-2 inline-flex text-sm font-semibold ${tones.warning.text} underline`}
          >
            Revisar medio de pago en MercadoPago
          </a>
        </Card>
      )}

      {cargando ? (
        <Card className={`p-10 text-center text-sm ${neutral.muted}`}>Cargando estado del plan…</Card>
      ) : (
        <>
          {suscripcion?.plan && (
            <Card className="mb-6 overflow-hidden">
              <div className="bg-brand-950 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">Plan actual</p>
                <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-white">
                  {suscripcion.plan.name}
                </p>
              </div>
              <div className="px-6 pt-4 pb-2">
                <p className={`text-lg font-bold tabular-nums ${neutral.body}`}>
                  ${Number(suscripcion.plan.price).toLocaleString('es-AR')}
                  <span className={`text-xs font-normal ml-1 ${neutral.subtle}`}>
                    /mes
                  </span>
                </p>
                {suscripcion.plan.description && (
                  <p className={`mt-1 text-sm ${neutral.secondary}`}>{suscripcion.plan.description}</p>
                )}
              </div>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="overflow-hidden">
              <div className="bg-brand-950 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-300">Estado</p>
              </div>
              <dl className="divide-y divide-dashed divide-gray-100 px-6">
                <div className="flex items-center justify-between py-4">
                  <dt className={`text-sm ${neutral.muted}`}>Estado</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        activa
                          ? `${tones.success.bg} ${tones.success.text} ${tones.success.border}`
                          : enTrial
                            ? `${tones.warning.bg} ${tones.warning.text} ${tones.warning.border}`
                            : `${tones.danger.bg} ${tones.danger.text} ${tones.danger.border}`
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {activa
                        ? 'Activo'
                        : pausada
                          ? 'Pausada'
                          : cancelada
                            ? 'Cancelada'
                            : enTrial
                              ? 'Prueba gratuita'
                              : 'Suspendido'}
                    </span>
                  </dd>
                </div>

                {restante != null && (
                  <div className="flex items-center justify-between py-4">
                    <dt className={`text-sm ${neutral.muted}`}>{etiquetaFecha}</dt>
                    <dd className="text-sm font-semibold text-heading tabular-nums">
                      {formatearFecha(fechaReferencia)}
                      <span className={`ml-2 font-normal ${neutral.subtle}`}>
                        ({restante >= 0 ? `${restante} días restantes` : 'vencida'})
                      </span>
                    </dd>
                  </div>
                )}

                {activa && suscripcion?.currentPeriodStart && (
                  <div className="flex items-center justify-between py-4">
                    <dt className={`text-sm ${neutral.muted}`}>Inicio del periodo</dt>
                    <dd className="text-sm font-semibold text-heading tabular-nums">
                      {formatearFecha(suscripcion.currentPeriodStart)}
                    </dd>
                  </div>
                )}

                {negocio && (
                  <div className="flex items-center justify-between py-4">
                    <dt className={`text-sm ${neutral.muted}`}>Negocio</dt>
                    <dd className="text-sm font-semibold text-heading">{negocio.name}</dd>
                  </div>
                )}
              </dl>
            </Card>

            {activa || pausada ? (
              <Card className="p-6 h-fit">
                <div
                  className={`w-10 h-10 rounded-xl ${activa ? tones.success.bg : tones.warning.bg} border ${activa ? tones.success.border : tones.warning.border} flex items-center justify-center mb-3`}
                >
                  {activa ? (
                    <BadgeCheck className={`w-5 h-5 ${tones.success.icon}`} />
                  ) : (
                    <CalendarDays className={`w-5 h-5 ${tones.warning.icon}`} />
                  )}
                </div>
                <h2 className="font-display text-base font-bold tracking-tight text-heading">
                  {activa ? 'Suscripcion activa' : 'Suscripcion pausada'}
                </h2>
                <p className={`mt-2 text-sm leading-relaxed ${neutral.secondary}`}>
                  {activa
                    ? 'Tu plan esta activo. El proximo cobro se procesara automaticamente.'
                    : 'No se realizaran cobros mientras este pausada. Puedes reactivarla cuando quieras.'}
                </p>
                {suscripcion?.mpPreapprovalId && (
                  <p className={`mt-3 text-xs ${neutral.subtle}`}>
                    ID de referencia: {suscripcion.mpPreapprovalId}
                  </p>
                )}
                {confirmando ? (
                  <div className="mt-5">
                    <p className="text-sm font-semibold text-heading">
                      {confirmando === 'cancelar'
                        ? '¿Cancelar la suscripcion?'
                        : '¿Pausar la suscripcion?'}
                    </p>
                    <p className={`mt-2 text-sm leading-relaxed ${neutral.secondary}`}>
                      {confirmando === 'cancelar'
                        ? `Seguiras teniendo acceso hasta el ${formatearFecha(accesoHasta)}. No se realizaran mas cobros. Si te volves a suscribir, se genera un nuevo cobro inmediato y se pierden los dias ya pagados.`
                        : 'No se realizaran cobros mientras este pausada. Tu plan estara disponible cuando decidas reactivarlo.'}
                    </p>
                    <Button
                      variant="danger"
                      className="mt-4 w-full"
                      disabled={gestionando}
                      onClick={() =>
                        gestionarSuscripcion(confirmando === 'cancelar' ? 'cancel' : 'pause')
                      }
                    >
                      {gestionando
                        ? 'Procesando…'
                        : confirmando === 'cancelar'
                          ? 'Si, cancelar'
                          : 'Si, pausar'}
                    </Button>
                    <Button
                      variant="secondary"
                      className="mt-2 w-full"
                      disabled={gestionando}
                      onClick={() => setConfirmando(null)}
                    >
                      Volver
                    </Button>
                  </div>
                ) : pausada ? (
                  <>
                    <Button
                      variant="primary"
                      className="mt-5 w-full"
                      disabled={gestionando}
                      onClick={() => gestionarSuscripcion('resume')}
                    >
                      {gestionando ? 'Procesando…' : 'Reactivar suscripcion'}
                    </Button>
                    <Button
                      variant="danger"
                      className="mt-2 w-full"
                      disabled={gestionando}
                      onClick={() => setConfirmando('cancelar')}
                    >
                      Cancelar suscripcion
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      className="mt-5 w-full"
                      disabled={gestionando}
                      onClick={() => setConfirmando('pausar')}
                    >
                      Pausar suscripcion
                    </Button>
                    <Button
                      variant="dangerOutline"
                      className="mt-2 w-full"
                      disabled={gestionando}
                      onClick={() => setConfirmando('cancelar')}
                    >
                      Cancelar suscripcion
                    </Button>
                  </>
                )}
              </Card>
            ) : (
              <Card className="p-6 h-fit">
                <div className={`w-10 h-10 rounded-xl ${tones.brand.bg} border ${tones.brand.border} flex items-center justify-center mb-3`}>
                  <CreditCard className={`w-5 h-5 ${tones.brand.icon}`} />
                </div>
                <h2 className="font-display text-base font-bold tracking-tight text-heading">
                  Activar suscripcion
                </h2>
                <p className={`mt-2 text-sm leading-relaxed ${neutral.secondary}`}>
                  Activa tu suscripcion mensual con debito automatico via MercadoPago.
                  {enTrial && restante && restante > 0 && (
                    <> Te quedan <strong>{restante} dias</strong> de prueba gratuita.</>
                  )}
                </p>
                {cancelada && (
                  <p className={`mt-2 text-sm leading-relaxed ${neutral.secondary}`}>
                    {canceladaPorRechazo
                      ? 'Tu suscripcion se cancelo automaticamente tras cobros rechazados. Al activar se crea una nueva suscripcion y se genera un nuevo cobro por el mes en curso.'
                      : 'Tu suscripcion anterior fue cancelada. Al activar se crea una nueva suscripcion y se genera un nuevo cobro por el mes en curso.'}
                  </p>
                )}
                <ul className={`mt-4 space-y-2 text-sm ${neutral.secondary}`}>
                  <li className="flex items-start gap-2">
                    <Sparkles className={`w-4 h-4 mt-0.5 ${tones.brand.accent} flex-shrink-0`} />
                    Renovacion automatica mes a mes
                  </li>
                  <li className="flex items-start gap-2">
                    <CalendarDays className={`w-4 h-4 mt-0.5 ${tones.brand.accent} flex-shrink-0`} />
                    Factura y comprobante en tu correo
                  </li>
                </ul>
                <Button
                  variant="primary"
                  className="mt-5 w-full"
                  disabled={activando}
                  onClick={activarSuscripcion}
                >
                  {activando ? 'Conectando con MercadoPago…' : 'Activar suscripcion'}
                </Button>
                <p className={`mt-3 text-center text-xs ${neutral.subtle}`}>
                  Al activar seras redirigido a MercadoPago para completar el pago.
                </p>
              </Card>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Suscripcion;