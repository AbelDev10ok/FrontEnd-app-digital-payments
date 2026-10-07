import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Store, CheckCircle2 } from 'lucide-react';
import useNoIndex from '@hooks/useNoIndex';
import { register } from '@features/auth/services/authServices';
import { Alert, Button, Field } from '@/shared/components/ui';

const Register: React.FC = () => {
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useNoIndex();

  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Crear Cuenta · Gestión de Cobros y Ventas';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsSubmitting(true);
    try {
      const message = await register(email, password, nombreNegocio.trim() || undefined);
      setSuccessMessage(message || 'Registro exitoso. Revisa tu correo para verificar tu cuenta.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo completar el registro. Intente nuevamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-card shadow-xl p-8 border border-gray-100">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Cuenta creada!</h1>
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
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-brand-950 mb-2">Creá tu cuenta</h1>
          <p className="text-gray-600">Empezá a gestionar tus cobros en minutos</p>
        </div>

        <div className="bg-white rounded-card shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <Field htmlFor="negocio" label="Nombre de tu negocio (opcional)">
              <div className="relative">
                <Store className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="negocio"
                  type="text"
                  value={nombreNegocio}
                  onChange={(e) => setNombreNegocio(e.target.value)}
                  maxLength={50}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-input focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200"
                  placeholder="Ej: Casa Rodríguez"
                />
              </div>
            </Field>

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
                  className={`w-full pl-12 pr-4 py-3 border rounded-input focus:outline-none focus:ring-2 transition-all duration-200 ${
                    emailError
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'
                  }`}
                  placeholder="tu@email.com"
                />
              </div>
            </Field>

            <Field htmlFor="password" label="Contraseña" error={passwordError || undefined}>
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
                  className={`w-full pl-12 pr-12 py-3 border rounded-input focus:outline-none focus:ring-2 transition-all duration-200 ${
                    passwordError
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:ring-brand-500 focus:border-brand-500'
                  }`}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </Field>

            {error && <Alert tone="danger">{error}</Alert>}

            <Button type="submit" isLoading={isSubmitting} size="lg" className="w-full">
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          ¿Ya tenés una cuenta?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-500 font-medium">
            Iniciá sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
