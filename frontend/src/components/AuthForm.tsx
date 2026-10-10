import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Phone, User, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

type AuthMode = 'login' | 'register';

type AuthFormProps = {
  mode: AuthMode;
  onSuccess: () => void;
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
      if (currentMode === 'login') {
        await api.login({
          email: form.email ? form.email.trim() : undefined,
          phone: form.phone ? form.phone.trim() : undefined,
          password: form.password,
        });
      } else {
        await api.register({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        });
      }

      onSuccess();
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
          <span className="text-2xl font-extrabold tracking-tight text-indigo-600">StayMate</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          {currentMode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">
          {currentMode === 'login'
            ? 'Sign in to access your roommate matches and chats.'
            : 'Join StayMate to find compatible roommates in your city.'}
        </p>
      </div>

      {/* Main Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
        {/* Unified Tab Switcher */}
        <div className="mb-5 flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 rounded-lg py-2 text-center transition-all duration-150 ${
              currentMode === 'login'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 rounded-lg py-2 text-center transition-all duration-150 ${
              currentMode === 'register'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm font-medium text-rose-700"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-rose-400 hover:text-rose-600"
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {/* Full Name */}
          {currentMode === 'register' && (
            <div>
              <label
                htmlFor="auth-name"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User size={18} />
                </div>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-11 sm:h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  placeholder="Alex Morgan"
                  required
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail size={18} />
              </div>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-11 sm:h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {/* Phone Number */}
          {currentMode === 'register' && (
            <div>
              <label
                htmlFor="auth-phone"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Phone Number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Phone size={18} />
                </div>
                <input
                  id="auth-phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-11 sm:h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Password
              </label>
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
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={currentMode === 'login' ? 'current-password' : 'new-password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                className="h-11 sm:h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                placeholder={currentMode === 'login' ? '••••••••' : 'Min. 8 characters'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {currentMode === 'register' && (
              <p className="mt-1 text-[11px] text-slate-400">Must be at least 8 characters long</p>
            )}
          </div>

          {/* Unified Primary Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-3 flex h-12 sm:h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span>Please wait...</span>
            ) : (
              <>
                <span>{currentMode === 'login' ? 'Sign in' : 'Create account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer switcher note */}
        <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          {currentMode === 'login' ? (
            <p>
              New to StayMate?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline inline-block"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline inline-block"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
