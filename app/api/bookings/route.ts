// POST /api/bookings — Create a booking
// GET  /api/bookings — Get user's bookings
export const runtime = 'nodejs';

import { authenticateRequest, generateCode, generateBookingId } from '@/lib/auth';
import { bookingStore, menuStore, auditStore, seedIfNeeded } from '@/lib/store';
import type { Booking, BookingCreateRequest, BookingCreateResponse, ApiResponse, AuditEntry } from '@/lib/types';

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

    const body = (await request.json()) as BookingCreateRequest;

    // Validate required fields
    if (!body.item_type || !body.booking_date || !body.booking_time) {
      return Response.json(
        { success: false, error: 'item_type, booking_date, and booking_time are required' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // Validate item type
    if (body.item_type !== 'veg' && body.item_type !== 'nonveg') {
      return Response.json(
        { success: false, error: 'item_type must be "veg" or "nonveg"' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // Validate date — same-day booking only
    const serverNow = new Date();
    const todayStr = `${serverNow.getFullYear()}-${String(serverNow.getMonth() + 1).padStart(2, '0')}-${String(serverNow.getDate()).padStart(2, '0')}`;
    if (body.booking_date < todayStr) {
      return Response.json(
        { success: false, error: 'Cannot book for past dates' } satisfies ApiResponse,
        { status: 400 }
      );
    }

    // Check for duplicate booking
    if (bookingStore.checkDuplicate(user.id, body.booking_date, body.booking_time)) {
      return Response.json(
        { success: false, error: 'You already have a booking for this slot' } satisfies ApiResponse,
        { status: 409 }
      );
    }

    // Generate codes (with collision avoidance)
    let userCode = generateCode();
    let retries = 0;
    while (bookingStore.checkCodeCollision(userCode, body.booking_date) && retries < 10) {
      userCode = generateCode();
      retries++;
    }
    const adminCode = generateCode();

    // Get price from menu
    const menuItems = menuStore.getByType(body.item_type);
    const selectedItem = body.item_name
      ? menuItems.find((m) => m.name === body.item_name)
      : menuItems[0];
    const price = selectedItem?.price || (body.item_type === 'veg' ? 150 : 180);

    // Create booking
    const bookingId = generateBookingId();
    const createdAt = new Date().toISOString();

    const booking: Booking = {
      booking_id: bookingId,
      user_id: user.id,
      user_name: user.name,
      item_type: body.item_type,
      item_name: selectedItem?.name || (body.item_type === 'veg' ? 'Veg Meal' : 'Non-Veg Meal'),
      booking_date: body.booking_date,
      booking_time: body.booking_time,
      amount: price,
      status: 'pending',
      user_code: userCode,
      admin_code: adminCode,
      qr_token: JSON.stringify({ booking_id: bookingId, user_code: userCode, ts: createdAt }),
      created_at: createdAt,
      served_at: null,
      metadata: {
        verified_by: null,
        verified_at: null,
        counter: null,
      },
    };

    bookingStore.set(bookingId, booking);

    // Audit log
    const auditEntry: AuditEntry = {
      id: `audit-${Date.now()}`,
      booking_id: bookingId,
      action: 'booking_created',
      actor_id: user.id,
      details: { item_type: body.item_type, date: body.booking_date, time: body.booking_time },
      timestamp: createdAt,
    };
    auditStore.add(auditEntry);

    const response: ApiResponse<BookingCreateResponse> = {
      success: true,
      data: {
        booking_id: bookingId,
        user_code: userCode,
        admin_code: user.role === 'admin' ? adminCode : null,
        qr_data: { booking_id: bookingId, user_code: userCode, timestamp: createdAt },
        amount: price,
        status: 'pending',
      },
    };

    return Response.json(response, { status: 201 });
  } catch {
    return Response.json(
      { success: false, error: 'Internal server error' } satisfies ApiResponse,
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await seedIfNeeded();
    const user = authenticateRequest(request);
    if (!user) {
      return Response.json(
        { success: false, error: 'Unauthorized' } satisfies ApiResponse,
        { status: 401 }
      );
    }

    let bookings: Booking[];
    if (user.role === 'admin') {
      bookings = bookingStore.getAll();
    } else {
      bookings = bookingStore.getByUserId(user.id);
    }

    // Sort by date descending
    bookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Remove admin_code for non-admins
    if (user.role !== 'admin') {
      bookings = bookings.map((b) => ({ ...b, admin_code: 0 }));
    }

    return Response.json({ success: true, data: bookings } satisfies ApiResponse);
  } catch {
    return Response.json(
      { success: false, error: 'Internal server error' } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
