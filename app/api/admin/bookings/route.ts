// GET /api/admin/bookings — Admin: get all bookings
// PATCH /api/admin/bookings — Admin: update booking status
export const runtime = 'nodejs';

import { authenticateRequest } from '@/lib/auth';
import { bookingStore, auditStore, seedIfNeeded } from '@/lib/store';
import type { ApiResponse, AuditEntry } from '@/lib/types';

export async function GET(request: Request) {
  try {
    await seedIfNeeded();
    const user = authenticateRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return Response.json(
        { success: false, error: 'Forbidden' } satisfies ApiResponse,
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const date = url.searchParams.get('date');

    let bookings = bookingStore.getAll();

    if (status) {
      bookings = bookings.filter((b) => b.status === status);
    }
    if (date) {
      bookings = bookings.filter((b) => b.booking_date === date);
    }

    // Sort by created_at descending
    bookings.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return Response.json({ success: true, data: bookings } satisfies ApiResponse);
  } catch {
    return Response.json(
      { success: false, error: 'Internal server error' } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await seedIfNeeded();
    const user = authenticateRequest(request);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return Response.json(
        { success: false, error: 'Forbidden' } satisfies ApiResponse,
        { status: 403 }
      );
    }

    const body = await request.json();
    const { booking_id, status: newStatus } = body;

    if (!booking_id || !newStatus) {
      return Response.json(
        { success: false, error: 'booking_id and status are required' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    const booking = bookingStore.get(booking_id);
    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found' } satisfies ApiResponse,
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const updates: Record<string, unknown> = { status: newStatus };

    if (newStatus === 'served') {
      updates.served_at = now;
    }

    bookingStore.update(booking_id, updates as Partial<typeof booking>);

    // Audit log
    const auditEntry: AuditEntry = {
      id: `audit-${Date.now()}`,
      booking_id,
      action: newStatus === 'cancelled' ? 'cancelled' : newStatus === 'served' ? 'served' : 'verified',
      actor_id: user.id,
      details: { old_status: booking.status, new_status: newStatus },
      timestamp: now,
    };
    auditStore.add(auditEntry);

    return Response.json({
      success: true,
      data: { booking_id, new_status: newStatus },
    } satisfies ApiResponse);
  } catch {
    return Response.json(
      { success: false, error: 'Internal server error' } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
