import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, CheckCircle2 } from 'lucide-react';
import useNoIndex from '@hooks/useNoIndex';
import { forgotPassword } from '@features/auth/services/authServices';
import { Alert, Button, Field, fieldErrorId } from '@/shared/components/ui';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useNoIndex();

  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Restablecer Contraseña · Gestión de Cobros y Ventas';
  }, []);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('El email es requerido');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('Ingresa un email válido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const message = await forgotPassword(email);
      setSuccessMessage(
        message ||
          'Si el email está registrado, recibirás un enlace para restablecer tu contraseña.',
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar el enlace. Intentá nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
              ¡Revisá tu correo!
            </h1>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <Button size="lg" className="w-full" onClick={() => navigate('/login')}>
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
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-heading mb-2">
            Restablecé tu contraseña
          </h1>
          <p className="text-gray-600">
            Te enviamos un enlace a tu email para crear una nueva contraseña
          </p>
        </div>

        <div className="bg-surface rounded-card shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <Field htmlFor="email" label="Email" error={emailError || undefined}>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => validateEmail(email)}
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={
                    emailError ? fieldErrorId('email') : undefined
                  }
                  className={`w-full pl-12 pr-4 py-3 border rounded-input focus:outline-none focus:ring-2 transition-[border-color,box-shadow] duration-150 ease-out ${
                    emailError
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'
                  }`}
                  placeholder="tu@email.com"
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
              {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          </form>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          ¿Recordaste tu contraseña?{' '}
          <Link
            to="/login"
            className="text-brand-600 hover:text-brand-500 font-medium"
          >
            Iniciá sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
