import { useEffect, useState } from 'react';
import { BadgeCheck, CalendarDays, CreditCard, Sparkles } from 'lucide-react';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import { businessService } from '@/features/negocio/services/businessService';
import { billingService, type SubscriptionStatus } from '@/features/negocio/services/billingService';
import type { BusinessMe } from '@/shared/types/business';
import { tones, neutral } from '@/shared/theme';

interface SuscripcionProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const hoyISO = () => new Date().toISOString().slice(0, 10);

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

  const estado = suscripcion?.status ?? negocio?.planStatus ?? 'TRIALING';
  const enTrial = estado === 'TRIALING' || estado === 'TRIAL';
  const activa = estado === 'ACTIVE';
  const restante = diasRestantes(
    activa ? suscripcion?.currentPeriodEnd : negocio?.trialEndsAt,
  );

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
                      {activa ? 'Activo' : enTrial ? 'Prueba gratuita' : 'Suspendido'}
                    </span>
                  </dd>
                </div>

                {restante != null && (
                  <div className="flex items-center justify-between py-4">
                    <dt className={`text-sm ${neutral.muted}`}>
                      {activa ? 'Renovacion' : 'La prueba termina'}
                    </dt>
                    <dd className="text-sm font-semibold text-brand-950 tabular-nums">
                      {formatearFecha(activa ? suscripcion?.currentPeriodEnd : negocio?.trialEndsAt)}
                      <span className={`ml-2 font-normal ${neutral.subtle}`}>
                        ({restante >= 0 ? `${restante} días restantes` : 'vencida'})
                      </span>
                    </dd>
                  </div>
                )}

                {activa && suscripcion?.currentPeriodStart && (
                  <div className="flex items-center justify-between py-4">
                    <dt className={`text-sm ${neutral.muted}`}>Inicio del periodo</dt>
                    <dd className="text-sm font-semibold text-brand-950 tabular-nums">
                      {formatearFecha(suscripcion.currentPeriodStart)}
                    </dd>
                  </div>
                )}

                {negocio && (
                  <div className="flex items-center justify-between py-4">
                    <dt className={`text-sm ${neutral.muted}`}>Negocio</dt>
                    <dd className="text-sm font-semibold text-brand-950">{negocio.name}</dd>
                  </div>
                )}
              </dl>
            </Card>

            {!activa ? (
              <Card className="p-6 h-fit">
                <div className={`w-10 h-10 rounded-xl ${tones.brand.bg} border ${tones.brand.border} flex items-center justify-center mb-3`}>
                  <CreditCard className={`w-5 h-5 ${tones.brand.icon}`} />
                </div>
                <h2 className="font-display text-base font-bold tracking-tight text-brand-950">
                  Activar suscripcion
                </h2>
                <p className={`mt-2 text-sm leading-relaxed ${neutral.secondary}`}>
                  Activa tu suscripcion mensual con debito automatico via MercadoPago.
                  {enTrial && restante && restante > 0 && (
                    <> Te quedan <strong>{restante} dias</strong> de prueba gratuita.</>
                  )}
                </p>
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
            ) : (
              <Card className="p-6 h-fit">
                <div className={`w-10 h-10 rounded-xl ${tones.success.bg} border ${tones.success.border} flex items-center justify-center mb-3`}>
                  <BadgeCheck className={`w-5 h-5 ${tones.success.icon}`} />
                </div>
                <h2 className="font-display text-base font-bold tracking-tight text-brand-950">
                  Suscripcion activa
                </h2>
                <p className={`mt-2 text-sm leading-relaxed ${neutral.secondary}`}>
                  Tu plan esta activo. El proximo cobro se procesara automaticamente.
                </p>
                {suscripcion?.mpPreapprovalId && (
                  <p className={`mt-3 text-xs ${neutral.subtle}`}>
                    ID de referencia: {suscripcion.mpPreapprovalId}
                  </p>
                )}
                <Button variant="secondary" disabled className="mt-5 w-full">
                  Gestionar en MercadoPago
                </Button>
              </Card>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Suscripcion;