// GET /api/admin/audit — Admin: get audit log
export const runtime = 'nodejs';

import { authenticateRequest } from '@/lib/auth';
import { auditStore, seedIfNeeded } from '@/lib/store';
import type { ApiResponse } from '@/lib/types';

export async function GET(request: Request) {
  try {
    await seedIfNeeded();
    const user = authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return Response.json(
        { success: false, error: 'Forbidden — admin only' } satisfies ApiResponse,
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const bookingId = url.searchParams.get('booking_id');
    const action = url.searchParams.get('action');

    let entries = auditStore.getAll();

    if (bookingId) {
      entries = entries.filter((e) => e.booking_id === bookingId);
    }
    if (action) {
      entries = entries.filter((e) => e.action === action);
    }

    return Response.json({ success: true, data: entries } satisfies ApiResponse);
  } catch {
    return Response.json(
      { success: false, error: 'Internal server error' } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
