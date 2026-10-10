import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
        setMessage(response.message ?? 'Password reset successfully. You can now log in.');
      } else {
        const response = await api.requestPasswordReset(email);
        setMessage(response.message ?? 'If an account exists for that email, reset instructions will be sent shortly.');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not complete this request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{isReset ? 'Choose a new password' : 'Reset your password'}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {isReset ? 'Choose a new password for your StayMate account.' : 'Enter your account email and we’ll send a password reset link if an account exists.'}
        </p>
      </div>

      {message ? (
        <div role="status" className="space-y-4">
          <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>
          <Link to="/login" className="inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {isReset ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                New password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Confirm new password
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} maxLength={128} autoComplete="new-password" required className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500" />
              </label>
            </>
          ) : (
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 outline-none focus:border-indigo-500" placeholder="you@example.com" />
            </label>
          )}

          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

          <button type="submit" disabled={loading} className="min-h-11 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60">
            {loading ? 'Please wait...' : isReset ? 'Update password' : 'Send reset link'}
          </button>
          <Link to="/login" className="block py-1 text-center text-sm font-medium text-slate-600 hover:text-indigo-700">Back to login</Link>
        </form>
      )}
    </div>
  );
}