'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function GuestPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (name.trim().length < 2) {
      setError('Please enter a valid name');
      setLoading(false);
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      // Authenticate via backend to get a real token for guest
      const loginRes = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'guest', pin: 'guest' }),
      });
      const loginData = await loginRes.json();

      if (!loginData.success) {
        setError(loginData.error || 'Guest session initialization failed');
        setLoading(false);
        return;
      }

      // Store authentic guest details
      const guestUser = {
        id: `GUEST-${Date.now()}`,
        name: name.trim(),
        role: 'student' as const,
        phone: phone.trim(),
        email: email.trim(),
      };

      localStorage.setItem('user', JSON.stringify(guestUser));
      localStorage.setItem('token', loginData.data.token);
      localStorage.setItem('isGuest', 'true');

      router.push('/booking');
    } catch {
      setError('Failed to connect to authentication server. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl mx-auto mb-6">
            👋
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Guest Booking
          </h1>
          <p className="text-[var(--text-secondary)]">
            Enter your details to book a meal without an account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-scale-in">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="guest-name" className="input-label">Full Name</label>
            <input
              id="guest-name"
              type="text"
              className="input"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="guest-phone" className="input-label">Phone Number</label>
            <input
              id="guest-phone"
              type="tel"
              className="input"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d+\-\s]/g, ''))}
              required
              inputMode="tel"
            />
          </div>

          <div>
            <label htmlFor="guest-email" className="input-label">Email Address</label>
            <input
              id="guest-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading || name.length < 2 || phone.replace(/\D/g, '').length < 10 || !email.includes('@')}
            id="guest-submit"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Processing...
              </div>
            ) : (
              'Continue to Booking →'
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-[var(--text-tertiary)] text-sm">
            Already have an account?
          </p>
          <Link href="/login" className="text-amber-500 font-medium text-sm hover:underline">
            Sign in instead
          </Link>
          <Link href="/" className="text-[var(--text-tertiary)] text-sm block hover:text-[var(--text-secondary)] transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
