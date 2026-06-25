'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sha256Hex } from '@/lib/clientAuth';

export default function LoginPage() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Hash the PIN client-side before sending over the wire
      const pinHash = await sha256Hex(pin.trim());

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id.trim(), pin: pinHash }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Clear any previous session's cart before storing new session
      localStorage.removeItem('cart');

      // Store auth
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Route based on role
      if (data.data.user.role === 'admin') {
        router.push('/admin/portal');
      } else if (data.data.user.role === 'staff') {
        router.push('/admin/counter');
      } else {
        router.push('/booking');
      }
    } catch {
      setError('Connection failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left Panel — Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] items-center justify-center p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-md animate-slide-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl mb-8">
            🍽
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            IIST Cafeteria
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Book your meals in advance, get a unique code, and skip the queue. Fast, simple, paperless.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">✓</div>
              <div>
                <p className="text-white font-medium">Pre-book your meals</p>
                <p className="text-slate-500 text-sm">Choose veg or non-veg, pick your time slot</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">✓</div>
              <div>
                <p className="text-white font-medium">QR code verification</p>
                <p className="text-slate-500 text-sm">Unique code prevents duplicate orders</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">✓</div>
              <div>
                <p className="text-white font-medium">Zero wait time</p>
                <p className="text-slate-500 text-sm">Walk straight to the counter with your code</p>
              </div>
            </div>
          </div>

          {/* Sign-in instructions — no credentials exposed */}
          <div className="mt-10 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">How to sign in</p>
            <div className="space-y-1 text-sm text-slate-400">
              <p>• <span className="text-slate-300">Students:</span> Use your Roll Number as both your ID and PIN (e.g., SC25M147)</p>
              <p>• <span className="text-slate-300">Staff / Admin:</span> Contact the system administrator for your credentials</p>
              <p>• <span className="text-slate-300">Visitors:</span> Use the <Link href="/guest" className="text-amber-400 hover:underline">Guest Booking</Link> option — no account required</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-[var(--background)]">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-lg">🍽</div>
            <div>
              <h1 className="font-bold text-lg" style={{ fontFamily: 'var(--font-space-grotesk)' }}>IIST Cafeteria</h1>
              <p className="text-[var(--text-tertiary)] text-xs">Trivandrum</p>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Welcome back
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Sign in with your User ID and PIN
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-scale-in">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User ID */}
            <div>
              <label htmlFor="login-id" className="input-label">User ID / Roll Number</label>
              <input
                id="login-id"
                type="text"
                className="input"
                placeholder="e.g. SC25M147"
                value={id}
                onChange={(e) => setId(e.target.value.toUpperCase())}
                required
                autoComplete="username"
                autoFocus
                style={{ fontFamily: 'var(--font-space-grotesk)', letterSpacing: '0.05em' }}
              />
            </div>

            {/* PIN */}
            <div>
              <label htmlFor="login-pin" className="input-label">PIN / Password</label>
              <div className="relative">
                <input
                  id="login-pin"
                  type={showPin ? 'text' : 'password'}
                  className="input pr-12"
                  placeholder="Enter PIN or Password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                  }}
                  required
                  autoComplete="current-password"
                  style={{ fontFamily: 'var(--font-space-grotesk)', letterSpacing: pin.length > 4 ? '0.1em' : '0.3em', fontSize: '1.25rem' }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors p-1"
                  onClick={() => setShowPin(!showPin)}
                  tabIndex={-1}
                >
                  {showPin ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {/* PIN dots */}
              <div className="flex gap-2 mt-3 justify-center">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      pin.length > i
                        ? 'bg-amber-500 scale-110'
                        : 'bg-[var(--border)]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading || id.length === 0 || pin.length === 0}
              id="login-submit"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-3">
            <Link href="/guest" className="text-[var(--text-secondary)] text-sm hover:text-amber-500 transition-colors block">
              Continue as guest →
            </Link>
            <Link href="/" className="text-[var(--text-tertiary)] text-sm hover:text-[var(--text-secondary)] transition-colors block">
              ← Back to home
            </Link>
          </div>

          {/* Mobile sign-in hint — no credentials */}
          <div className="lg:hidden mt-8 p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
            <p className="text-[var(--text-tertiary)] text-xs font-medium uppercase tracking-wider mb-2">How to sign in</p>
            <div className="space-y-1 text-xs text-[var(--text-secondary)]">
              <p>• <span className="font-medium">Students:</span> Use your Roll Number as both ID and PIN</p>
              <p>• <span className="font-medium">No account?</span> Tap <span className="text-amber-500">Continue as guest</span> above</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
