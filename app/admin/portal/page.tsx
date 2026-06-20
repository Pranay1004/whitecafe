'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Booking, BookingStatus } from '@/lib/types';

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  served: 'badge-served',
  cancelled: 'badge-cancelled',
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: '⏳ Pending',
  confirmed: '✓ Confirmed',
  served: '🍽 Served',
  cancelled: '✕ Cancelled',
};

export default function AdminPortal() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchBookings = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const url = filter === 'all'
        ? '/api/admin/bookings'
        : `/api/admin/bookings?status=${filter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filter]);

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

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings, refreshKey]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (bookingId: string) => {
    setVerifyError('');
    setVerifySuccess('');

    const code = parseInt(adminCodeInput);
    if (isNaN(code) || code < 10 || code > 99) {
      setVerifyError('Enter a valid 2-digit code');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ booking_id: bookingId, admin_code: code }),
      });
      const data = await res.json();

      if (data.success) {
        setVerifySuccess(`Booking ${bookingId} verified!`);
        setVerifyingId(null);
        setAdminCodeInput('');
        setRefreshKey((k) => k + 1);
      } else {
        setVerifyError(data.error || 'Verification failed');
      }
    } catch {
      setVerifyError('Connection error');
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: BookingStatus) => {
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ booking_id: bookingId, status: newStatus }),
      });
      setRefreshKey((k) => k + 1);
    } catch {
      // silently fail
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    served: bookings.filter((b) => b.status === 'served').length,
  };

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter((b) => b.status === filter);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg text-white font-bold">
              A
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Admin Portal
              </h1>
              <p className="text-[var(--text-tertiary)] text-xs">
                {user?.name} • <span className="text-emerald-500">● Live</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/counter" className="btn btn-ghost btn-sm">
              Counter
            </Link>
            <Link href="/admin/audit" className="btn btn-ghost btn-sm">
              Audit Log
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm text-red-500">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 stagger">
          <div className="card-flat p-5">
            <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider mb-1">Total</p>
            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{stats.total}</p>
          </div>
          <div className="card-flat p-5 border-amber-200 dark:border-amber-800">
            <p className="text-amber-600 text-xs uppercase tracking-wider mb-1">Pending</p>
            <p className="text-3xl font-bold text-amber-600" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{stats.pending}</p>
          </div>
          <div className="card-flat p-5 border-emerald-200 dark:border-emerald-800">
            <p className="text-emerald-600 text-xs uppercase tracking-wider mb-1">Confirmed</p>
            <p className="text-3xl font-bold text-emerald-600" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{stats.confirmed}</p>
          </div>
          <div className="card-flat p-5 border-indigo-200 dark:border-indigo-800">
            <p className="text-indigo-600 text-xs uppercase tracking-wider mb-1">Served</p>
            <p className="text-3xl font-bold text-indigo-600" style={{ fontFamily: 'var(--font-space-grotesk)' }}>{stats.served}</p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {verifySuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 animate-scale-in">
            <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">✓ {verifySuccess}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'pending', 'confirmed', 'served', 'cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn btn-sm flex-shrink-0 ${
                filter === f
                  ? 'btn-primary'
                  : 'btn-ghost border border-[var(--border)]'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && stats.pending > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-flat p-6">
                <div className="skeleton h-4 w-1/4 mb-3" />
                <div className="skeleton h-3 w-1/2 mb-2" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📭</p>
            <p className="text-[var(--text-secondary)] font-medium">No bookings found</p>
            <p className="text-[var(--text-tertiary)] text-sm mt-1">
              {filter !== 'all' ? `No ${filter} bookings at the moment` : 'No bookings created yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 stagger">
            {filteredBookings.map((booking) => (
              <div
                key={booking.booking_id}
                className="card-flat p-5 hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold font-mono text-sm" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                        {booking.booking_id}
                      </span>
                      <span className={`badge ${STATUS_COLORS[booking.status]}`}>
                        {STATUS_LABELS[booking.status]}
                      </span>
                      <span className={`badge ${booking.item_type === 'veg' ? 'badge-veg' : 'badge-nonveg'}`}>
                        {booking.item_type === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--text-secondary)]">
                      <span>👤 {booking.user_name || booking.user_id}</span>
                      <span>🍽 {booking.item_name}</span>
                      <span>📅 {booking.booking_date}</span>
                      <span>⏰ {booking.booking_time}</span>
                      <span>💰 ₹{booking.amount}</span>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-[var(--text-tertiary)]">
                      <span>User Code: <strong className="text-[var(--text-primary)]">{booking.user_code}</strong></span>
                      {user?.role === 'admin' && (
                        <span>Admin Code: <strong className="text-amber-600">{booking.admin_code}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {booking.status === 'pending' && (
                      <>
                        {verifyingId === booking.booking_id ? (
                          <div className="flex items-center gap-2 animate-scale-in">
                            <input
                              type="text"
                              className="input w-24 text-center"
                              placeholder="Code"
                              maxLength={2}
                              value={adminCodeInput}
                              onChange={(e) => {
                                setAdminCodeInput(e.target.value.replace(/\D/g, ''));
                                setVerifyError('');
                              }}
                              autoFocus
                              style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '1.25rem' }}
                            />
                            <button
                              onClick={() => handleVerify(booking.booking_id)}
                              className="btn btn-primary btn-sm"
                              disabled={adminCodeInput.length !== 2}
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => { setVerifyingId(null); setAdminCodeInput(''); setVerifyError(''); }}
                              className="btn btn-ghost btn-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setVerifyingId(booking.booking_id)}
                              className="btn btn-primary btn-sm"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking.booking_id, 'cancelled')}
                              className="btn btn-danger btn-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate(booking.booking_id, 'served')}
                        className="btn btn-sm bg-indigo-500 text-white hover:bg-indigo-600"
                      >
                        Mark Served
                      </button>
                    )}
                  </div>
                </div>

                {/* Verify Error inline */}
                {verifyingId === booking.booking_id && verifyError && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-scale-in">
                    <p className="text-red-600 dark:text-red-400 text-sm">{verifyError}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Auto-refresh indicator */}
        <div className="mt-8 text-center">
          <p className="text-[var(--text-tertiary)] text-xs flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Auto-refreshing every 10 seconds
          </p>
        </div>
      </main>
    </div>
  );
}
