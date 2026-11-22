import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Phone, User, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { Button, FormLabel, Heading, InlineText, Paragraph, Surface, TextInput } from './ui';

type AuthMode = 'login' | 'register';

type AuthFormProps = {
  mode: AuthMode;
  onSuccess: (user: { id: string; name: string; email: string; phone?: string }) => void;
};

export default function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const navigate = useNavigate();
  const [currentMode, setCurrentMode] = useState<AuthMode>(mode);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCurrentMode(mode);
    setError('');
  }, [mode]);

  const switchMode = (newMode: AuthMode) => {
    setCurrentMode(newMode);
    setError('');
    navigate(newMode === 'login' ? '/login' : '/register', { replace: true });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      let authResponse;
      if (currentMode === 'login') {
        authResponse = await api.login({
          email: form.email ? form.email.trim() : undefined,
          phone: form.phone ? form.phone.trim() : undefined,
          password: form.password,
        });
      } else {
        authResponse = await api.register({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        });
      }

      if (!authResponse.data) {
        throw new Error('Login succeeded, but the user session could not be loaded.');
      }
      onSuccess(authResponse.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Sparkles size={20} />
          </div>
          <InlineText className="text-2xl font-extrabold tracking-tight text-indigo-600">StayMate</InlineText>
        </Link>
        <Heading level={1} className="text-xl sm:text-2xl font-bold text-slate-900">
          {currentMode === 'login' ? 'Welcome back' : 'Create your account'}
        </Heading>
        <Paragraph className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">
          {currentMode === 'login'
            ? 'Sign in to access your roommate matches and chats.'
            : 'Join StayMate to find compatible roommates in your city.'}
        </Paragraph>
      </div>

      {/* Main Form Card */}
      <Surface variant="authForm">
        {/* Unified Tab Switcher */}
        <div className="mb-5 flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          <Button
            type="button"
            onClick={() => switchMode('login')}
            variant="tab"
            selected={currentMode === 'login'}
          >
            Sign In
          </Button>
          <Button
            type="button"
            onClick={() => switchMode('register')}
            variant="tab"
            selected={currentMode === 'register'}
          >
            Create Account
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm font-medium text-rose-700"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
            <InlineText className="flex-1">{error}</InlineText>
            <Button
              type="button"
              onClick={() => setError('')}
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-none p-0 text-rose-400 hover:bg-transparent hover:text-rose-600"
              aria-label="Dismiss error"
            >
              &times;
            </Button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {/* Full Name */}
          {currentMode === 'register' && (
            <div>
              <FormLabel
                variant="auth"
                htmlFor="auth-name"
              >
                Full Name
              </FormLabel>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User size={18} />
                </div>
                <TextInput
                  variant="auth"
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="pl-10"
                  placeholder="Alex Morgan"
                  required
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <FormLabel
              variant="auth"
              htmlFor="auth-email"
            >
              Email Address
            </FormLabel>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail size={18} />
              </div>
              <TextInput
                variant="auth"
                id="auth-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="pl-10"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          {currentMode === 'register' && (
            <div>
              <FormLabel
                variant="auth"
                htmlFor="auth-phone"
              >
                Phone Number
              </FormLabel>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Phone size={18} />
                </div>
                <TextInput
                  variant="auth"
                  id="auth-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="pl-10"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <FormLabel
                variant="auth"
                htmlFor="auth-password"
              >
                Password
              </FormLabel>
              {currentMode === 'login' && (
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock size={18} />
              </div>
              <TextInput
                variant="auth"
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={currentMode === 'login' ? 'current-password' : 'new-password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                className="pl-10 pr-10"
                placeholder={currentMode === 'login' ? '••••••••' : 'Min. 8 characters'}
                required
              />
              <Button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                variant="ghost"
                size="icon"
                className="absolute inset-y-0 right-0 h-auto w-10 rounded-none bg-transparent p-0 pr-3 text-slate-400 hover:bg-transparent hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
            {currentMode === 'register' && (
              <Paragraph className="mt-1 text-[11px] text-slate-400">Must be at least 8 characters long</Paragraph>
            )}
          </div>

          {/* Unified Primary Button */}
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            size="md"
            className="mt-3 h-12 w-full sm:h-11"
          >
            {loading ? (
              <InlineText>Please wait...</InlineText>
            ) : (
              <>
                <InlineText>{currentMode === 'login' ? 'Sign in' : 'Create account'}</InlineText>
                <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>

        {/* Footer switcher note */}
        <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          {currentMode === 'login' ? (
            <Paragraph>
              New to StayMate?{' '}
              <Button
                type="button"
                onClick={() => switchMode('register')}
                variant="text"
                size="xs"
                className="inline-block"
              >
                Create an account
              </Button>
            </Paragraph>
          ) : (
            <Paragraph>
              Already have an account?{' '}
              <Button
                type="button"
                onClick={() => switchMode('login')}
                variant="text"
                size="xs"
                className="inline-block"
              >
                Sign in
              </Button>
            </Paragraph>
          )}
        </div>
      </Surface>
    </div>
  );
}
