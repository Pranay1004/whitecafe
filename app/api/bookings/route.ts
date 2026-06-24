// POST /api/bookings — Create a booking
// GET  /api/bookings — Get user's bookings
export const runtime = 'nodejs';

import { authenticateRequest, generateCode, generateBookingId } from '@/lib/auth';
import { bookingStore, menuStore, auditStore, seedIfNeeded } from '@/lib/store';
import type { Booking, BookingCreateRequest, BookingCreateResponse, ApiResponse, AuditEntry } from '@/lib/types';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

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

    const body = (await request.json());

    // Validate required fields
    if (!body.booking_date || !body.booking_time) {
      return Response.json(
        { success: false, error: 'booking_date and booking_time are required' } satisfies ApiResponse,
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

    let items = body.items;
    let finalAmount = 0;
    let finalItemName = '';
    let finalItemType: 'veg' | 'nonveg' = 'veg';

    if (items && Array.isArray(items) && items.length > 0) {
      // Multi-item cart booking
      finalItemType = items.some((item) => item.type === 'nonveg') ? 'nonveg' : 'veg';
      
      const itemSummaries = items.map((item) => {
        const itemCost = (item.price + (item.is_parcel ? 5 : 0)) * item.quantity;
        finalAmount += itemCost;
        return `${item.name} x${item.quantity}${item.is_parcel ? ' (📦)' : ''}`;
      });
      finalItemName = itemSummaries.join(', ');
    } else {
      // Fallback to single item booking
      if (!body.item_type) {
        return Response.json(
          { success: false, error: 'item_type is required for single item booking' } satisfies ApiResponse,
          { status: 400 }
        );
      }
      finalItemType = body.item_type;
      const menuItems = menuStore.getByType(body.item_type);
      const selectedItem = body.item_name
        ? menuItems.find((m) => m.name === body.item_name)
        : menuItems[0];
      const basePrice = selectedItem?.price || (body.item_type === 'veg' ? 150 : 180);
      finalAmount = basePrice + (body.is_parcel ? 5 : 0);
      finalItemName = (selectedItem?.name || (body.item_type === 'veg' ? 'Veg Meal' : 'Non-Veg Meal')) + (body.is_parcel ? ' (📦)' : '');
      
      items = [{
        id: selectedItem?.id || 'default',
        name: selectedItem?.name || (body.item_type === 'veg' ? 'Veg Meal' : 'Non-Veg Meal'),
        price: basePrice,
        type: body.item_type,
        quantity: 1,
        is_parcel: !!body.is_parcel
      }];
    }

    // Create booking
    const bookingId = generateBookingId();
    const createdAt = new Date().toISOString();

    const booking: Booking = {
      booking_id: bookingId,
      user_id: user.id,
      user_name: user.name,
      item_type: finalItemType,
      item_name: finalItemName,
      booking_date: body.booking_date,
      booking_time: body.booking_time,
      amount: finalAmount,
      status: 'pending',
      user_code: userCode,
      admin_code: adminCode,
      qr_token: JSON.stringify({ booking_id: bookingId, user_code: userCode, ts: createdAt }),
      created_at: createdAt,
      served_at: null,
      items: items,
      metadata: {
        verified_by: null,
        verified_at: null,
        counter: null,
        payment_method: body.payment_method || 'Pay at Counter',
        payment_status: body.payment_status || 'Pending',
        payment_utr: body.payment_utr || '',
      },
    };

    // Compose receipt details for notification
    const itemsText = items.map((item: any) => 
      `• ${item.name} x${item.quantity}${item.is_parcel ? ' (Parcel)' : ''} — ₹${(item.price + (item.is_parcel ? 5 : 0)) * item.quantity}`
    ).join('\n');

    const receiptText = 
      `🍽️ *IIST Cafeteria Order Receipt*\n` +
      `-----------------------------------\n` +
      `*Order ID:* ${bookingId}\n` +
      `*Verification Code:* ${userCode}\n` +
      `*Customer:* ${user.name || 'Guest'} (${user.id})\n` +
      `*Items Ordered:*\n${itemsText}\n` +
      `*Time Slot:* ${booking.booking_time}\n` +
      `*Amount:* ₹${booking.amount}\n` +
      `*Payment:* ${booking.metadata.payment_method} (${booking.metadata.payment_status})\n` +
      `*UTR No:* ${booking.metadata.payment_utr || 'N/A'}\n` +
      `-----------------------------------\n` +
      `Please show this message at the counter to collect your meal.`;

    // 1. Notify Staff Automatically
    const staffPhone = process.env.STAFF_WHATSAPP_NUMBER || '+919876543210';
    await sendWhatsAppMessage(staffPhone, `🔔 *New Order Received!*\n\n${receiptText}`);

    // 2. Notify Customer Automatically
    const customerPhone = body.phone || '';
    if (customerPhone) {
      await sendWhatsAppMessage(customerPhone, `Hello! Here is your cafeteria order confirmation:\n\n${receiptText}`);
    }

    const userEmail = body.email || (user.id.startsWith('GUEST') ? 'guest@iist.ac.in' : `${user.id.toLowerCase()}@iist.ac.in`);
    console.log(`[NOTIFY] Order confirmation email sent to ${userEmail} for order ${bookingId}`);

    bookingStore.set(bookingId, booking);

    // Audit log
    const auditEntry: AuditEntry = {
      id: `audit-${Date.now()}`,
      booking_id: bookingId,
      action: 'booking_created',
      actor_id: user.id,
      details: { item_type: finalItemType, date: body.booking_date, time: body.booking_time },
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
        amount: finalAmount,
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
