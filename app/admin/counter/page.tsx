'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Booking } from '@/lib/types';

export default function CounterPortal() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [foundBooking, setFoundBooking] = useState<Booking | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'admin' && parsed.role !== 'staff') {
      router.push('/');
      return;
    }
    setUser(parsed);
  }, [router]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setError('');
    setSuccessMsg('');
    setSearching(true);
    setFoundBooking(null);

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        const query = searchQuery.trim().toUpperCase();
        const match = data.data.find(
          (b: Booking) =>
            b.booking_id.toUpperCase() === query ||
            String(b.user_code) === query
        );

        if (match) {
          setFoundBooking(match);
        } else {
          setError('No booking found with that ID or code');
        }
      }
    } catch {
      setError('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleServe = async () => {
    if (!foundBooking) return;
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: foundBooking.booking_id,
          status: 'served',
        }),
      });
      setSuccessMsg(`Booking ${foundBooking.booking_id} marked as served!`);
      setFoundBooking(null);
      setSearchQuery('');
    } catch {
      setError('Failed to update status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-lg text-white font-bold">
              C
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Counter Portal
              </h1>
              <p className="text-[var(--text-tertiary)] text-xs">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/portal" className="btn btn-ghost btn-sm">
              Admin
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm text-red-500">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Search */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Verify Booking
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Enter booking ID or user code to find the order
          </p>

          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="text"
              className="input text-center text-xl"
              placeholder="BK-XXXXX or code"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              autoFocus
              style={{ fontFamily: 'var(--font-space-grotesk)', letterSpacing: '0.1em' }}
              id="counter-search"
            />
            <button
              onClick={handleSearch}
              className="btn btn-primary px-6"
              disabled={searching || !searchQuery.trim()}
            >
              {searching ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center animate-scale-in max-w-md mx-auto">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center animate-scale-in max-w-md mx-auto">
            <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">✓ {successMsg}</p>
          </div>
        )}

        {/* Found Booking Display */}
        {foundBooking && (
          <div className="max-w-md mx-auto animate-scale-in">
            <div className={`card p-8 text-center ${
              foundBooking.item_type === 'veg'
                ? 'border-emerald-300 dark:border-emerald-700'
                : 'border-red-300 dark:border-red-700'
            }`}>
              {/* Large User Code */}
              <div className="mb-6">
                <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider mb-2">User Code</p>
                <p className={`text-7xl font-extrabold ${
                  foundBooking.item_type === 'veg'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`} style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  {foundBooking.user_code}
                </p>
              </div>

              {/* Booking Details */}
              <div className="space-y-3 mb-6 text-left">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)] text-sm">Booking</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{foundBooking.booking_id}</span>
                </div>
                {foundBooking.metadata?.payment_method && (
                  <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)] text-sm">Payment Method</span>
                    <span className="font-medium capitalize">{foundBooking.metadata.payment_method}</span>
                  </div>
                )}
                {foundBooking.metadata?.payment_utr && (
                  <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-secondary)] text-sm">UPI UTR No.</span>
                    <span className="font-mono font-bold text-amber-500">{foundBooking.metadata.payment_utr}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)] text-sm">Student</span>
                  <span className="font-medium">{foundBooking.user_name || foundBooking.user_id}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)] text-sm">Meal</span>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${foundBooking.item_type === 'veg' ? 'badge-veg' : 'badge-nonveg'}`}>
                      {foundBooking.item_type === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                    </span>
                    <span className="font-medium text-sm">{foundBooking.item_name}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)] text-sm">Time</span>
                  <span className="font-medium">{foundBooking.booking_time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] text-sm">Status</span>
                  <span className={`badge ${
                    foundBooking.status === 'pending' ? 'badge-pending' :
                    foundBooking.status === 'confirmed' ? 'badge-confirmed' :
                    foundBooking.status === 'served' ? 'badge-served' : 'badge-cancelled'
                  }`}>
                    {foundBooking.status.charAt(0).toUpperCase() + foundBooking.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {(foundBooking.status === 'confirmed' || foundBooking.status === 'pending') && (
                <button
                  onClick={handleServe}
                  className="btn btn-primary btn-lg w-full animate-pulse-glow"
                  id="counter-serve"
                >
                  🍽 Mark as Served
                </button>
              )}
              {foundBooking.status === 'served' && (
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                  <p className="text-indigo-600 dark:text-indigo-400 font-medium">Already served ✓</p>
                </div>
              )}
              {foundBooking.status === 'cancelled' && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-red-600 dark:text-red-400 font-medium">This booking was cancelled</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
