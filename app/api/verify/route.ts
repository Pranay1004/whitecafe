// POST /api/verify — Admin verifies booking with 2FA codes
export const runtime = 'nodejs';

import { authenticateRequest } from '@/lib/auth';
import { bookingStore, auditStore, seedIfNeeded } from '@/lib/store';
import type { VerifyRequest, ApiResponse, AuditEntry } from '@/lib/types';

// Track verification attempts per booking
const verifyAttempts = new Map<string, number>();

export async function POST(request: Request) {
  try {
    await seedIfNeeded();
    const user = authenticateRequest(request);
    if (!user) {
      return Response.json(
        { success: false, error: 'Unauthorized' } satisfies ApiResponse,
        { status: 401 }
      );
    }

    // Only admin and staff can verify
    if (user.role !== 'admin' && user.role !== 'staff') {
      return Response.json(
        { success: false, error: 'Forbidden — admin or staff only' } satisfies ApiResponse,
        { status: 403 }
      );
    }

    const body = (await request.json()) as VerifyRequest;

    if (!body.booking_id || body.admin_code === undefined) {
      return Response.json(
        { success: false, error: 'booking_id and admin_code are required' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // Check attempt limit
    const attempts = verifyAttempts.get(body.booking_id) || 0;
    if (attempts >= 3) {
      return Response.json(
        { success: false, error: 'Too many failed attempts — booking rejected' } satisfies ApiResponse,
        { status: 429 }
      );
    }

    // Find booking
    const booking = bookingStore.get(body.booking_id);
    if (!booking) {
      return Response.json(
        { success: false, error: 'Booking not found' } satisfies ApiResponse,
        { status: 404 }
      );
    }

    // Check booking status
    if (booking.status !== 'pending') {
      return Response.json(
        { success: false, error: `Booking is already ${booking.status}` } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // Verify admin code
    if (booking.admin_code !== body.admin_code) {
      verifyAttempts.set(body.booking_id, attempts + 1);

      // Log failed attempt
      const auditEntry: AuditEntry = {
        id: `audit-${Date.now()}`,
        booking_id: body.booking_id,
        action: 'verification_failed',
        actor_id: user.id,
        details: { attempts: attempts + 1, remaining: 3 - (attempts + 1) },
        timestamp: new Date().toISOString(),
      };
      auditStore.add(auditEntry);

      // Auto-reject after 3 failed attempts
      if (attempts + 1 >= 3) {
        bookingStore.update(body.booking_id, {
          status: 'cancelled',
          metadata: {
            ...booking.metadata,
            rejection_reason: 'Too many failed verification attempts',
          },
        });

        return Response.json(
          { success: false, error: 'Booking rejected — too many failed attempts' } satisfies ApiResponse,
          { status: 429 }
        );
      }

      return Response.json(
        {
          success: false,
          error: `Wrong admin code (${3 - (attempts + 1)} attempts remaining)`,
        } satisfies ApiResponse,
        { status: 403 }
      );
    }

    // Success — update booking
    const now = new Date().toISOString();
    bookingStore.update(body.booking_id, {
      status: 'confirmed',
      metadata: {
        ...booking.metadata,
        verified_by: user.id,
        verified_at: now,
        counter: booking.item_type,
      },
    });

    // Clear attempt counter
    verifyAttempts.delete(body.booking_id);

    // Log verification
    const auditEntry: AuditEntry = {
      id: `audit-${Date.now()}`,
      booking_id: body.booking_id,
      action: 'verified',
      actor_id: user.id,
      details: { old_status: 'pending', new_status: 'confirmed' },
      timestamp: now,
    };
    auditStore.add(auditEntry);

    return Response.json({
      success: true,
      data: { booking_id: body.booking_id, new_status: 'confirmed' },
    } satisfies ApiResponse);
  } catch {
    return Response.json(
      { success: false, error: 'Internal server error' } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
