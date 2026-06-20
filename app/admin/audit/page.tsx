'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AuditEntry } from '@/lib/types';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login: { label: '🔑 Login', color: 'text-blue-500' },
  booking_created: { label: '📝 Booking Created', color: 'text-emerald-500' },
  verified: { label: '✓ Verified', color: 'text-green-600' },
  verification_failed: { label: '✕ Verification Failed', color: 'text-red-500' },
  rejected: { label: '🚫 Rejected', color: 'text-red-600' },
  served: { label: '🍽 Served', color: 'text-indigo-500' },
  cancelled: { label: '✕ Cancelled', color: 'text-gray-500' },
  auto_cleanup: { label: '🗑 Auto Cleanup', color: 'text-gray-400' },
};

export default function AuditLogPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchAudit = async () => {
      try {
        const url = filterAction === 'all'
          ? '/api/admin/audit'
          : `/api/admin/audit?action=${filterAction}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setEntries(data.data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [router, filterAction]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const filteredEntries = filterAction === 'all'
    ? entries
    : entries.filter((e) => e.action === filterAction);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg text-white font-bold">
              📋
            </div>
            <div>
              <h1 className="font-bold text-lg" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Audit Log
              </h1>
              <p className="text-[var(--text-tertiary)] text-xs">{filteredEntries.length} entries</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/portal" className="btn btn-ghost btn-sm">
              ← Dashboard
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm text-red-500">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'booking_created', 'verified', 'verification_failed', 'served', 'cancelled'].map((action) => (
            <button
              key={action}
              onClick={() => setFilterAction(action)}
              className={`btn btn-sm flex-shrink-0 ${
                filterAction === action ? 'btn-primary' : 'btn-ghost border border-[var(--border)]'
              }`}
            >
              {action === 'all' ? 'All' : ACTION_LABELS[action]?.label || action}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card-flat p-4">
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-[var(--text-secondary)] font-medium">No audit entries</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Time</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Action</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Booking</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Actor</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Details</th>
                </tr>
              </thead>
              <tbody className="stagger">
                {filteredEntries.map((entry) => {
                  const actionInfo = ACTION_LABELS[entry.action] || { label: entry.action, color: 'text-gray-500' };
                  const time = new Date(entry.timestamp);
                  return (
                    <tr key={entry.id} className="border-b border-[var(--border-light)] hover:bg-[var(--border-light)] transition-colors">
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium">{time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-xs text-[var(--text-tertiary)]">{time.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium text-sm ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                          {entry.booking_id}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                        {entry.actor_id}
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--text-tertiary)] max-w-xs truncate">
                        {entry.details ? JSON.stringify(entry.details) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
