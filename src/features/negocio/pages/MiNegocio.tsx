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
import { useAuthStore } from '@features/auth/store/authStore';
import { applyCurrency } from '@/shared/utils/formatCurrency';
import { etiquetaMoneda, opcionesMonedaNegocio } from '@/shared/utils/currencies';
import { FRECUENCIAS_DE_CUOTA, esFrecuenciaDeCuota } from '@/shared/utils/payments';
import type { BusinessMe } from '@/shared/types/business';

interface MiNegocioProps {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}

// Un préstamo nunca es al contado: `CONTADO` no se ofrece como default.
const FRECUENCIAS = [
  { value: '', label: 'Sin valor por defecto' },
  ...FRECUENCIAS_DE_CUOTA.map((frecuencia) => ({
    value: frecuencia,
    label: frecuencia.charAt(0) + frecuencia.slice(1).toLowerCase(),
  })),
];

type Feedback = { tipo: 'ok' | 'error'; mensaje: string } | null;

// Aviso inline de envío: los errores se anuncian al instante (role="alert"),
// los éxitos de forma cortés (role="status").
const FeedbackMsg = ({ feedback }: { feedback: NonNullable<Feedback> }) => (
  <p
    className={`mt-4 text-sm font-medium ${
      feedback.tipo === 'ok' ? 'text-emerald-700' : 'text-red-600'
    }`}
    role={feedback.tipo === 'ok' ? 'status' : 'alert'}
  >
    {feedback.mensaje}
  </p>
);

const TituloCard = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-base font-bold tracking-tight text-heading mb-4">{children}</h2>
);

const MiNegocio: React.FC<MiNegocioProps> = ({ user, onLogout }) => {
  const [negocio, setNegocio] = useState<BusinessMe | null>(null);
  const [nombre, setNombre] = useState('');
  const [cuit, setCuit] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [moneda, setMoneda] = useState('ARS');
  const [tasa, setTasa] = useState('');
  const [frecuencia, setFrecuencia] = useState('');
  const [cargando, setCargando] = useState(true);
  // Estado de envío por formulario: cada tarjeta muestra su propio spinner y su
  // propio feedback (antes ambos botones cargaban juntos y el aviso de "Guardar
  // defaults" aparecía en la tarjeta equivocada).
  const [guardando, setGuardando] = useState<'datos' | 'defaults' | null>(null);
  const [feedbackDatos, setFeedbackDatos] = useState<Feedback>(null);
  const [feedbackDefaults, setFeedbackDefaults] = useState<Feedback>(null);

  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [repetirClave, setRepetirClave] = useState('');
  const [guardandoClave, setGuardandoClave] = useState(false);
  const [feedbackClave, setFeedbackClave] = useState<Feedback>(null);

  useEffect(() => {
    businessService
      .getMyBusiness()
      .then((b) => {
        setNegocio(b);
        setNombre(b.name);
        setCuit(b.cuit ?? '');
        setDireccion(b.address ?? '');
        setTelefono(b.phone ?? '');
        setMoneda(b.currency);
        setTasa(b.defaultInterestRate != null ? String(b.defaultInterestRate) : '');
        // Un default legado de contado no aplica a préstamos: queda sin valor.
        setFrecuencia(esFrecuenciaDeCuota(b.defaultPaymentFrequency) ? b.defaultPaymentFrequency : '');
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
    await guardar('datos');
  };

  const guardarDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    await guardar('defaults');
  };

  const guardar = async (destino: 'datos' | 'defaults') => {
    const setFeedback = destino === 'datos' ? setFeedbackDatos : setFeedbackDefaults;
    // Validación básica del CUIT: vacío es válido (es opcional), pero si se
    // carga tiene que tener los 11 dígitos que se imprimen en el remito.
    if (destino === 'datos' && cuit !== '' && !/^\d{11}$/.test(cuit)) {
      setFeedback({ tipo: 'error', mensaje: 'El CUIT debe tener 11 dígitos, sin guiones.' });
      return;
    }
    setGuardando(destino);
    setFeedback(null);
    try {
      const actualizado = await businessService.updateMyBusiness({
        name: nombre.trim(),
        cuit: cuit.trim(),
        address: direccion.trim(),
        phone: telefono.trim(),
        currency: moneda.trim().toUpperCase(),
        defaultInterestRate: tasa === '' ? null : Number(tasa),
        // Vacío borra el default en el backend: "Sin valor por defecto" se guarda.
        defaultPaymentFrequency: frecuencia,
      });
      setNegocio(actualizado);
      applyCurrency(actualizado.currency);
      setFeedback({ tipo: 'ok', mensaje: 'Cambios guardados correctamente.' });
    } catch (err) {
      setFeedback({
        tipo: 'error',
        mensaje: err instanceof Error ? err.message : 'Error al guardar los cambios',
      });
    } finally {
      setGuardando(null);
    }
  };

  const cambiarContrasena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (claveNueva.length < 8) {
      setFeedbackClave({ tipo: 'error', mensaje: 'La nueva contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    if (claveNueva !== repetirClave) {
      setFeedbackClave({ tipo: 'error', mensaje: 'Las contraseñas no coinciden.' });
      return;
    }
    setGuardandoClave(true);
    setFeedbackClave(null);
    try {
      const { message, refreshToken } = await businessService.changePassword(claveActual, claveNueva);
      // El backend rotó el refresh: guardamos el nuevo para que esta sesión
      // siga abierta (las demás quedaron invalidadas).
      if (refreshToken) useAuthStore.getState().setRefreshToken(refreshToken);
      setClaveActual('');
      setClaveNueva('');
      setRepetirClave('');
      setFeedbackClave({ tipo: 'ok', mensaje: message });
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
                    label="CUIT"
                    htmlFor="cuit-negocio"
                    hint="11 dígitos, sin guiones. Es opcional y se imprime en los remitos."
                  >
                    <Input
                      id="cuit-negocio"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={11}
                      value={cuit}
                      onChange={(e) => setCuit(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="20123456789"
                    />
                  </Field>
                  <Field
                    label="Dirección"
                    htmlFor="direccion-negocio"
                    hint="Es opcional y se imprime en los remitos."
                  >
                    <Input
                      id="direccion-negocio"
                      maxLength={255}
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Av. Siempre Viva 123, Ciudad"
                    />
                  </Field>
                  <Field
                    label="Teléfono"
                    htmlFor="telefono-negocio"
                    hint="Es opcional y se imprime en los remitos."
                  >
                    <Input
                      id="telefono-negocio"
                      type="tel"
                      maxLength={50}
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="11 4444-5555"
                    />
                  </Field>
                  <Field
                    label="Moneda predeterminada"
                    htmlFor="moneda-negocio"
                    hint="Se preselecciona al crear productos y préstamos. Podés elegir otra en cada alta. No modifica las operaciones existentes."
                  >
                    <Select
                      id="moneda-negocio"
                      value={moneda}
                      onChange={(e) => setMoneda(e.target.value)}
                    >
                      {opcionesMonedaNegocio(moneda).map((m) => (
                        <option key={m} value={m}>
                          {etiquetaMoneda(m)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                {feedbackDatos && <FeedbackMsg feedback={feedbackDatos} />}
                <div className="mt-5 flex justify-end">
                  <Button type="submit" isLoading={guardando === 'datos'} leftIcon={<Save className="w-4 h-4" />}>
                    Guardar cambios
                  </Button>
                </div>
              </Card>
            </form>

            <form onSubmit={guardarDefaults}>
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
                {feedbackDefaults && <FeedbackMsg feedback={feedbackDefaults} />}
                <div className="mt-5 flex justify-end">
                  <Button type="submit" variant="secondary" isLoading={guardando === 'defaults'}>
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
                <Field label="Repetir nueva contraseña" htmlFor="clave-repetida" required>
                  <Input
                    id="clave-repetida"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={repetirClave}
                    onChange={(e) => setRepetirClave(e.target.value)}
                    required
                  />
                </Field>
              </div>
              {feedbackClave && <FeedbackMsg feedback={feedbackClave} />}
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
