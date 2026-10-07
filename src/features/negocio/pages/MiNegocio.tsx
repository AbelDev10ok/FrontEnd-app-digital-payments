import { useEffect, useState } from 'react';
import { Building2, KeyRound, Save } from 'lucide-react';
import DashboardLayout from '@/shared/components/layout/DashboardLayout';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import Field from '@/shared/components/ui/Field';
import { businessService } from '@/features/negocio/services/businessService';
import { applyCurrency } from '@/shared/utils/formatCurrency';
import type { BusinessMe } from '@/shared/types/business';

interface MiNegocioProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

const FRECUENCIAS = [
  { value: '', label: 'Sin valor por defecto' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINCENAL', label: 'Quincenal' },
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'CONTADO', label: 'Contado' },
];

type Feedback = { tipo: 'ok' | 'error'; mensaje: string } | null;

const TituloCard = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-base font-bold tracking-tight text-brand-950 mb-4">{children}</h2>
);

const MiNegocio: React.FC<MiNegocioProps> = ({ user, onLogout }) => {
  const [negocio, setNegocio] = useState<BusinessMe | null>(null);
  const [nombre, setNombre] = useState('');
  const [moneda, setMoneda] = useState('ARS');
  const [tasa, setTasa] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [feedbackDatos, setFeedbackDatos] = useState<Feedback>(null);

  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [feedbackClave, setFeedbackClave] = useState<Feedback>(null);

  useEffect(() => {
    businessService
      .getMyBusiness()
      .then((b) => {
        setNegocio(b);
        setNombre(b.name);
        setMoneda(b.currency);
        setTasa(b.defaultInterestRate != null ? String(b.defaultInterestRate) : '');
        setFrecuencia(b.defaultPaymentFrequency ?? '');
      })
      .catch((err) =>
        setFeedbackDatos({
          tipo: 'error',
          mensaje: err instanceof Error ? err.message : 'Error al cargar los datos del negocio',
        }),
      )
      .finally(() => setCargando(false));
  }, []);

  const guardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoDatos(true);
    setFeedbackDatos(null);
    try {
      const actualizado = await businessService.updateMyBusiness({
        name: nombre.trim(),
        currency: moneda.trim().toUpperCase(),
        defaultInterestRate: tasa === '' ? null : Number(tasa),
        defaultPaymentFrequency: frecuencia || undefined,
      });
      setNegocio(actualizado);
      applyCurrency(actualizado.currency);
      setFeedbackDatos({ tipo: 'ok', mensaje: 'Cambios guardados correctamente.' });
    } catch (err) {
      setFeedbackDatos({
        tipo: 'error',
        mensaje: err instanceof Error ? err.message : 'Error al guardar los cambios',
      });
    } finally {
      setGuardandoDatos(false);
    }
  };

  const cambiarContrasena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (claveNueva.length < 8) {
      setFeedbackClave({ tipo: 'error', mensaje: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    setGuardandoClave(true);
    setFeedbackClave(null);
    try {
      const mensaje = await businessService.changePassword(claveActual, claveNueva);
      setClaveActual('');
      setClaveNueva('');
      setFeedbackClave({ tipo: 'ok', mensaje });
    } catch (err) {
      setFeedbackClave({
        tipo: 'error',
        mensaje: err instanceof Error ? err.message : 'Error al cambiar la contraseña',
      });
    } finally {
      setGuardandoClave(false);
    }
  };

  return (
    <DashboardLayout title="Mi Negocio" user={user} onLogout={onLogout}>
      <PageHeader
        eyebrow="Configuración"
        title="Mi Negocio"
        subtitle={
          negocio?.createdAt
            ? `Datos de tu cuenta y valores por defecto · cliente desde ${negocio.createdAt.split('-').reverse().join('/')}`
            : 'Datos de tu cuenta y valores por defecto'
        }
        icon={<Building2 className="w-6 h-6 text-brand-600" />}
      />

      {cargando ? (
        <Card className="p-10 text-center text-sm text-gray-500">Cargando datos del negocio…</Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <form onSubmit={guardarDatos}>
              <Card className="p-6">
                <TituloCard>Datos del negocio</TituloCard>
                <div className="space-y-4">
                  <Field label="Nombre del negocio" htmlFor="nombre-negocio" required>
                    <Input id="nombre-negocio" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                  </Field>
                  <Field
                    label="Moneda (ISO 4217)"
                    htmlFor="moneda-negocio"
                    hint="Ejemplo: ARS, USD, PYG"
                  >
                    <Input
                      id="moneda-negocio"
                      value={moneda}
                      onChange={(e) => setMoneda(e.target.value)}
                      maxLength={3}
                      className="uppercase w-32"
                    />
                  </Field>
                </div>
                {feedbackDatos && (
                  <p
                    className={`mt-4 text-sm font-medium ${
                      feedbackDatos.tipo === 'ok' ? 'text-emerald-700' : 'text-red-600'
                    }`}
                    role="status"
                  >
                    {feedbackDatos.mensaje}
                  </p>
                )}
                <div className="mt-5 flex justify-end">
                  <Button type="submit" isLoading={guardandoDatos} leftIcon={<Save className="w-4 h-4" />}>
                    Guardar cambios
                  </Button>
                </div>
              </Card>
            </form>

            <form onSubmit={guardarDatos}>
              <Card className="p-6">
                <TituloCard>Valores por defecto de préstamos</TituloCard>
                <p className="-mt-3 mb-4 text-sm text-gray-500">
                  Se sugieren automáticamente al crear un préstamo nuevo.
                </p>
                <div className="space-y-4">
                  <Field
                    label="Tasa de interés (%)"
                    htmlFor="tasa-interes"
                    hint="Dejalo vacío si no querés una tasa por defecto."
                  >
                    <Input
                      id="tasa-interes"
                      type="number"
                      step="0.01"
                      min="0"
                      max="500"
                      value={tasa}
                      onChange={(e) => setTasa(e.target.value)}
                      placeholder="Sin default"
                    />
                  </Field>
                  <Field label="Frecuencia de cuota" htmlFor="frecuencia-cuota">
                    <Select
                      id="frecuencia-cuota"
                      value={frecuencia}
                      onChange={(e) => setFrecuencia(e.target.value)}
                    >
                      {FRECUENCIAS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <div className="mt-5 flex justify-end">
                  <Button type="submit" variant="secondary" isLoading={guardandoDatos}>
                    Guardar defaults
                  </Button>
                </div>
              </Card>
            </form>
          </div>

          <form onSubmit={cambiarContrasena}>
            <Card className="p-6 h-fit">
              <TituloCard>Cambiar contraseña</TituloCard>
              <p className="-mt-3 mb-4 text-sm text-gray-500">
                Al cambiarla se cierran las demás sesiones abiertas con esta cuenta.
              </p>
              <div className="space-y-4">
                <Field label="Contraseña actual" htmlFor="clave-actual" required>
                  <Input
                    id="clave-actual"
                    type="password"
                    autoComplete="current-password"
                    value={claveActual}
                    onChange={(e) => setClaveActual(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Nueva contraseña" htmlFor="clave-nueva" required hint="Mínimo 8 caracteres.">
                  <Input
                    id="clave-nueva"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={claveNueva}
                    onChange={(e) => setClaveNueva(e.target.value)}
                    required
                  />
                </Field>
              </div>
              {feedbackClave && (
                <p
                  className={`mt-4 text-sm font-medium ${
                    feedbackClave.tipo === 'ok' ? 'text-emerald-700' : 'text-red-600'
                  }`}
                  role="status"
                >
                  {feedbackClave.mensaje}
                </p>
              )}
              <div className="mt-5 flex justify-end">
                <Button type="submit" variant="brandSoft" isLoading={guardandoClave} leftIcon={<KeyRound className="w-4 h-4" />}>
                  Actualizar contraseña
                </Button>
              </div>
            </Card>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MiNegocio;
