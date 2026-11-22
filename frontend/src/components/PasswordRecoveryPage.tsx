import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, FormLabel, Heading, InlineText, Paragraph, Surface, TextInput } from './ui';

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
  const [resetUrl, setResetUrl] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setResetUrl('');

    try {
      if (isReset) {
        if (!isResetToken) {
          setError('This password reset link is invalid. Request a new one.');
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        const response = await api.resetPassword(token, password);
        setMessage(response.message ?? 'Password updated successfully! You can now sign in.');
      } else {
        const trimmed = email.trim();
        if (!trimmed) {
          setError('Please enter your email address.');
          return;
        }
        const response = await api.requestPasswordReset(trimmed);
        setMessage(response.message ?? 'If an account exists for that email, a password reset link has been sent.');
        setResetUrl(response.data?.resetUrl ?? '');
      }
    } catch (submitError) {
      if (submitError instanceof Error && submitError.name === 'AbortError') {
        setError('The password reset request timed out. Please try again later.');
      } else {
        setError(submitError instanceof Error ? submitError.message : 'Could not complete this request.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Front-end guard: the reset link must be at least 32 chars and URL-safe hex,
  // matching the backend `min(32)` on the reset token. This prevents the reset
  // form from being submitted with a malformed/expired token.
  const isResetToken = token.length >= 32 && /^[a-fA-F0-9]+$/.test(token);

  return (
    <div className="w-full max-w-md mx-auto py-2 sm:py-6">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Sparkles size={20} />
          </div>
          <InlineText className="text-2xl font-extrabold tracking-tight text-indigo-600">StayMate</InlineText>
        </Link>
        <Heading level={1} className="text-xl sm:text-2xl font-bold text-slate-900">
          {isReset ? 'Create new password' : 'Reset your password'}
        </Heading>
        <Paragraph className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">
          {isReset
            ? 'Enter a secure new password for your StayMate account.'
            : 'Enter your email address and we will send a password reset link.'}
        </Paragraph>
      </div>

      <Surface variant="authForm">
        {message ? (
          <div className="space-y-4 text-center py-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
            <Paragraph className="text-sm font-medium text-slate-700 leading-relaxed">{message}</Paragraph>
            {resetUrl && (
              <a
                href={resetUrl}
                className="inline-flex text-sm font-semibold text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
              >
                Open your development reset link
              </a>
            )}
            <Link
              to="/login"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700"
            >
              <InlineText>Back to sign in</InlineText>
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

            {isReset && (
              <Paragraph className="text-[11px] text-slate-400">
                Choose a password with at least 8 characters.
              </Paragraph>
            )}

            {isReset ? (
              <>
                <div>
                  <FormLabel variant="auth">
                    New Password
                  </FormLabel>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock size={18} />
                    </div>
                    <TextInput
                      variant="auth"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      required
                      className="pl-10"
                      placeholder="Min. 8 characters"
                    />
                  </div>
                </div>

                <div>
                  <FormLabel variant="auth">
                    Confirm New Password
                  </FormLabel>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Lock size={18} />
                    </div>
                    <TextInput
                      variant="auth"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      required
                      className="pl-10"
                      placeholder="Repeat password"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <FormLabel variant="auth">
                  Email Address
                </FormLabel>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Mail size={18} />
                  </div>
                  <TextInput
                    variant="auth"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            )}

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
                  <InlineText>{isReset ? 'Update password' : 'Send reset link'}</InlineText>
                  <ArrowRight size={16} />
                </>
              )}
            </Button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                <ArrowLeft size={13} />
                <InlineText>Return to sign in</InlineText>
              </Link>
            </div>
          </form>
        )}
      </Surface>
    </div>
  );
}