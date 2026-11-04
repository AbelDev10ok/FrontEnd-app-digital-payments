import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle2, XCircle } from 'lucide-react';
import useNoIndex from '@hooks/useNoIndex';
import { verifyEmail } from '@features/auth/services/authServices';
import { Alert, Button, ButtonLink } from '@/shared/components/ui';

// Página pública que confirma la cuenta al hacer click en el link del mail de
// registro. El token viene en la URL (?token=...) y se consume una sola vez.
const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // El token se consume en el backend: se manda UNA sola petición aunque
  // React vuelva a correr el efecto (StrictMode) o el usuario reabra la página.
  const requestedRef = useRef(false);
  useNoIndex();

  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Verificar Correo · Gestión de Cobros y Ventas';
  }, []);

  useEffect(() => {
    if (!token || requestedRef.current) {
      return;
    }
    requestedRef.current = true;
    (async () => {
      try {
        const message = await verifyEmail(token);
        setSuccessMessage(
          message || '¡Correo verificado con éxito! Ya puedes iniciar sesión.',
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'No se pudo verificar el correo.',
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-surface to-brand-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-surface rounded-card shadow-xl p-8 border border-gray-100">
            <XCircle
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              El enlace no es válido
            </h1>
            <p className="text-gray-600 mb-6">
              Este enlace de verificación está incompleto o fue cortado. Si ya
              creaste una cuenta, iniciá sesión con tu correo.
            </p>
            <ButtonLink
              to="/login"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Iniciá sesión
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-surface to-brand-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-surface rounded-card shadow-xl p-8 border border-gray-100">
            <CheckCircle2
              className="w-16 h-16 text-emerald-600 mx-auto mb-4"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Correo verificado!
            </h1>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate('/login')}
            >
              Ir a iniciar sesión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-surface to-brand-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-action rounded-2xl mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-heading mb-2">
            {isLoading ? 'Verificando tu correo...' : 'No se pudo verificar el correo'}
          </h1>
        </div>

        <div className="bg-surface rounded-card shadow-xl p-8 border border-gray-100">
          {isLoading && (
            <p className="text-gray-600 text-center">
              Un segundo, estamos confirmando tu cuenta.
            </p>
          )}

          {!isLoading && (
            <>
              {error && <Alert tone="danger">{error}</Alert>}
              <p className="text-gray-600 mt-4">
                Si ya verificaste tu correo, simplemente iniciá sesión.
              </p>
              <div className="text-center mt-6 text-sm text-gray-500">
                <Link
                  to="/login"
                  className="text-brand-600 hover:text-brand-500 font-medium"
                >
                  Iniciá sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
