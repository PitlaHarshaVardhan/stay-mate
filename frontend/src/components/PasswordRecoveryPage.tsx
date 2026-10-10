import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function PasswordRecoveryPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const isReset = Boolean(token);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isReset) {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        const response = await api.resetPassword(token, password);
        setMessage(response.message ?? 'Password updated successfully! You can now sign in.');
      } else {
        const response = await api.requestPasswordReset(email.trim());
        setMessage(response.message ?? 'If an account exists for that email, password reset instructions will be sent shortly.');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not complete this request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-2 sm:py-6">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Sparkles size={20} />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-indigo-600">StayMate</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          {isReset ? 'Create new password' : 'Reset your password'}
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">
          {isReset
            ? 'Enter a secure new password for your StayMate account.'
            : 'Enter your email address and we will send a password reset link.'}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
        {message ? (
          <div className="space-y-4 text-center py-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">{message}</p>
            <Link
              to="/login"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700"
            >
              <span>Back to sign in</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm font-medium text-rose-700"
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

            {isReset ? (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      required
                      className="h-11 sm:h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      placeholder="Min. 8 characters"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      required
                      className="h-11 sm:h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                      placeholder="Repeat password"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="h-11 sm:h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-3 flex h-12 sm:h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span>Please wait...</span>
              ) : (
                <>
                  <span>{isReset ? 'Update password' : 'Send reset link'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <ArrowLeft size={13} />
                <span>Return to sign in</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}