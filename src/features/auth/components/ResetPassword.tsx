import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import useNoIndex from '@hooks/useNoIndex';
import { resetPassword } from '@features/auth/services/authServices';
import {
  Alert,
  Button,
  ButtonLink,
  Field,
  fieldErrorId,
} from '@/shared/components/ui';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useNoIndex();

  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Nueva Contraseña · Gestión de Cobros y Ventas';
  }, []);

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('La contraseña es requerida');
      return false;
    }
    if (value.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirm = (value: string) => {
    if (value !== password) {
      setConfirmError('Las contraseñas no coinciden');
      return false;
    }
    setConfirmError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirm(confirmPassword);

    if (!isPasswordValid || !isConfirmValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      const message = await resetPassword(token, password);
      setSuccessMessage(message || 'Contraseña restablecida con éxito.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo restablecer la contraseña.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-surface to-brand-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-surface rounded-card shadow-xl p-8 border border-gray-100">
            <KeyRound
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              El enlace no es válido
            </h1>
            <p className="text-gray-600 mb-6">
              Este enlace de restablecimiento es inválido o ya fue usado.
              Solicitá uno nuevo para crear tu contraseña.
            </p>
            <ButtonLink
              to="/forgot-password"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Solicitá un enlace nuevo
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
              ¡Contraseña actualizada!
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
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-heading mb-2">
            Creá tu nueva contraseña
          </h1>
          <p className="text-gray-600">
            Elegí una contraseña nueva para tu cuenta
          </p>
        </div>

        <div className="bg-surface rounded-card shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <Field
              htmlFor="password"
              label="Nueva contraseña"
              error={passwordError || undefined}
            >
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onBlur={() => validatePassword(password)}
                  aria-invalid={passwordError ? true : undefined}
                  aria-describedby={
                    passwordError ? fieldErrorId('password') : undefined
                  }
                  className={`w-full pl-12 pr-12 py-3 border rounded-input focus:outline-none focus:ring-2 transition-[border-color,box-shadow] duration-150 ease-out ${
                    passwordError
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'
                  }`}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </Field>

            <Field
              htmlFor="confirmPassword"
              label="Confirmar contraseña"
              error={confirmError || undefined}
            >
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmError) validateConfirm(e.target.value);
                  }}
                  onBlur={() => validateConfirm(confirmPassword)}
                  aria-invalid={confirmError ? true : undefined}
                  aria-describedby={
                    confirmError ? fieldErrorId('confirmPassword') : undefined
                  }
                  className={`w-full pl-12 pr-4 py-3 border rounded-input focus:outline-none focus:ring-2 transition-[border-color,box-shadow] duration-150 ease-out ${
                    confirmError
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'
                  }`}
                  placeholder="Repetí tu contraseña"
                />
              </div>
            </Field>

            {error && <Alert tone="danger">{error}</Alert>}

            <Button
              type="submit"
              isLoading={isSubmitting}
              size="lg"
              className="w-full"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar contraseña'}
            </Button>
          </form>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          ¿El enlace no funciona?{' '}
          <Link
            to="/forgot-password"
            className="text-brand-600 hover:text-brand-500 font-medium"
          >
            Solicitá un enlace nuevo
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
