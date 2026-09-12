import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import api from '../api/client';
import { ForgotPasswordResponse } from '../types';
import { KeyRound, ArrowLeft, CheckCircle2, Copy, ExternalLink } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const { login, signup } = useAuth();

  useEffect(() => {
    // Check if resetToken is present in URL search query
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('resetToken') || params.get('token');
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
      setViewMode('reset');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setDevResetLink(null);
    setSubmitting(true);

    try {
      if (viewMode === 'login') {
        await login(email, password);
      } else if (viewMode === 'signup') {
        await signup(email, password);
      } else if (viewMode === 'forgot') {
        const res = await api.post<ForgotPasswordResponse>('/auth/forgot-password', { email });
        setSuccessMsg(res.data.message);
        if (res.data.devResetLink) {
          setDevResetLink(res.data.devResetLink);
        }
      } else if (viewMode === 'reset') {
        await api.post('/auth/reset-password', { token: resetToken, newPassword });
        setSuccessMsg('Password successfully reset! You can now log in with your new password.');
        setTimeout(() => {
          setViewMode('login');
          setPassword('');
          setError(null);
          // Clean token from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }, 2000);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        (viewMode === 'login' ? 'Failed to log in. Please check your credentials.' :
         viewMode === 'signup' ? 'Failed to sign up.' :
         viewMode === 'forgot' ? 'Failed to send reset link.' :
         'Failed to reset password. The link may be invalid or expired.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyResetLink = () => {
    if (devResetLink) {
      navigator.clipboard.writeText(devResetLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark text-ink-primary dark:text-ink-darkPrimary">
      <Header />

      <main className="w-full max-w-md mx-auto px-4 pt-8 pb-12">
        <div className="bg-canvas-light dark:bg-canvas-dark border border-hairline-light dark:border-hairline-dark rounded-xl p-8 transition-all">
          
          {/* Header titles based on viewMode */}
          <div className="mb-6 text-center">
            {viewMode === 'forgot' && (
              <button
                onClick={() => { setViewMode('login'); setError(null); setSuccessMsg(null); }}
                className="inline-flex items-center font-sans text-xs font-medium text-ink-secondary dark:text-ink-darkSecondary hover:text-ink-primary dark:hover:text-ink-darkPrimary mb-3 transition-colors"
              >
                <ArrowLeft size={14} className="mr-1" /> Back to sign in
              </button>
            )}

            <h2 className="font-serif text-2xl font-normal tracking-tight text-ink-primary dark:text-ink-darkPrimary">
              {viewMode === 'login' && 'Welcome back'}
              {viewMode === 'signup' && 'Create an account'}
              {viewMode === 'forgot' && 'Reset your password'}
              {viewMode === 'reset' && 'Set new password'}
            </h2>
            <p className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary mt-1">
              {viewMode === 'login' && 'Sign in to access your personal runway'}
              {viewMode === 'signup' && 'Get started with personal runway control'}
              {viewMode === 'forgot' && "Enter your email to receive a recovery link"}
              {viewMode === 'reset' && 'Create a strong new password for your account'}
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 font-sans text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-sans text-xs text-emerald-700 dark:text-emerald-400 flex items-start space-x-2">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Dev SMTP / Console Reset Banner for local testability */}
          {devResetLink && (
            <div className="mb-5 p-3.5 rounded-lg border border-hairline-light dark:border-hairline-dark bg-stone-200/40 dark:bg-neutral-800/40 font-mono text-xs text-ink-secondary dark:text-ink-darkSecondary space-y-2">
              <div className="flex items-center justify-between text-clay-600 dark:text-clay-500 font-mono text-[11px]">
                <span>[DEV SMTP SIMULATOR]</span>
                <span className="border border-clay-600/30 dark:border-clay-500/30 px-1.5 py-0.5 rounded text-[10px]">1-Click Test</span>
              </div>
              <p className="text-[11px] font-sans">
                Click below or open link to simulate clicking emailed reset token:
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <a
                  href={devResetLink}
                  onClick={(e) => {
                    e.preventDefault();
                    const token = devResetLink.split('resetToken=')[1];
                    setResetToken(token);
                    setViewMode('reset');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="flex-1 bg-clay-600 hover:bg-clay-700 text-white px-3 py-1.5 rounded-lg font-mono text-xs text-center transition-colors inline-flex items-center justify-center space-x-1"
                >
                  <span>Open Reset Link</span>
                  <ExternalLink size={12} />
                </a>
                <button
                  type="button"
                  onClick={copyResetLink}
                  className="p-1.5 rounded-lg border border-hairline-light dark:border-hairline-dark hover:border-stone-400 text-ink-secondary dark:text-ink-darkSecondary transition-colors"
                  title="Copy link"
                >
                  <Copy size={14} />
                </button>
              </div>
              {copiedLink && <p className="text-[10px] text-clay-600 dark:text-clay-500 font-mono">Copied to clipboard!</p>}
            </div>
          )}

          {/* Forms */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {(viewMode === 'login' || viewMode === 'signup' || viewMode === 'forgot') && (
              <div>
                <label className="block font-sans text-xs font-medium text-ink-primary dark:text-ink-darkPrimary mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-hairline-light dark:border-hairline-dark bg-transparent font-sans text-sm text-ink-primary dark:text-ink-darkPrimary focus:outline-none focus:border-clay-600 dark:focus:border-clay-500 transition-colors"
                />
              </div>
            )}

            {(viewMode === 'login' || viewMode === 'signup') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-sans text-xs font-medium text-ink-primary dark:text-ink-darkPrimary">
                    Password
                  </label>
                  {viewMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setViewMode('forgot'); setError(null); setSuccessMsg(null); }}
                      className="font-sans text-xs font-medium text-clay-600 dark:text-clay-500 hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-hairline-light dark:border-hairline-dark bg-transparent font-sans text-sm text-ink-primary dark:text-ink-darkPrimary focus:outline-none focus:border-clay-600 dark:focus:border-clay-500 transition-colors"
                />
              </div>
            )}

            {viewMode === 'reset' && (
              <>
                <div>
                  <label className="block font-sans text-xs font-medium text-ink-primary dark:text-ink-darkPrimary mb-1">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Token string"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-hairline-light dark:border-hairline-dark bg-transparent font-mono text-xs text-ink-primary dark:text-ink-darkPrimary focus:outline-none focus:border-clay-600 dark:focus:border-clay-500"
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs font-medium text-ink-primary dark:text-ink-darkPrimary mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-hairline-light dark:border-hairline-dark bg-transparent font-sans text-sm text-ink-primary dark:text-ink-darkPrimary focus:outline-none focus:border-clay-600 dark:focus:border-clay-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-clay-600 hover:bg-clay-700 text-white font-sans font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>
                {submitting ? 'Processing...' :
                 viewMode === 'login' ? 'Sign In' :
                 viewMode === 'signup' ? 'Create Account' :
                 viewMode === 'forgot' ? 'Send Reset Link' :
                 'Update Password'}
              </span>
            </button>
          </form>

          {/* Toggle between Sign In / Sign Up */}
          {(viewMode === 'login' || viewMode === 'signup') && (
            <div className="mt-6 text-center pt-4 border-t border-hairline-light dark:border-hairline-dark">
              <button
                type="button"
                onClick={() => {
                  setViewMode(viewMode === 'login' ? 'signup' : 'login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-sans text-xs text-ink-secondary dark:text-ink-darkSecondary hover:text-ink-primary dark:hover:text-ink-darkPrimary font-medium transition-colors"
              >
                {viewMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
