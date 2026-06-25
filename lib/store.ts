// ============================================
// In-Memory Store — Development fallback
// ============================================
// When Firebase is not configured, the app uses this
// in-memory store. Data resets on server restart.

import { createHash } from 'crypto';
import type { User, Booking, MenuItem, AuditEntry } from './types';
import { hashPin } from './auth';

/**
 * Compute SHA-256 hex of a string (Node.js side).
 * The client sends sha256(rawPin) so we must seed bcrypt(sha256(rawPin)).
 */
function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}


// ---- Storage Collections ----
const users: Map<string, User> = new Map();
const bookings: Map<string, Booking> = new Map();
const menuItems: Map<string, MenuItem> = new Map();
const auditLog: AuditEntry[] = [];

// ---- Seed flag ----
let seeded = false;

// ---- Seed Default Data ----
export async function seedIfNeeded() {
  if (seeded) return;
  seeded = true;

  // Default admin user
  const adminHash = await hashPin(sha256('0000'));
  users.set('ADMIN', {
    id: 'ADMIN',
    pin_hash: adminHash,
    role: 'admin',
    name: 'Admin User',
    email: 'admin@iist.ac.in',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
    login_attempts: 0,
    locked_until: null,
  });

  // Default guest user
  const guestHash = await hashPin(sha256('guest'));
  users.set('GUEST', {
    id: 'GUEST',
    pin_hash: guestHash,
    role: 'student',
    name: 'guest',
    email: 'guest@iist.ac.in',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
    login_attempts: 0,
    locked_until: null,
  });

  // Default test student
  const studentHash = await hashPin(sha256('SC25M147'));
  users.set('SC25M147', {
    id: 'SC25M147',
    pin_hash: studentHash,
    role: 'student',
    name: 'Arjun Pandey',
    email: 'sc25m147@iist.ac.in',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
    login_attempts: 0,
    locked_until: null,
  });

  // Default test staff
  const staffHash = await hashPin(sha256('5678'));
  users.set('STAFF001', {
    id: 'STAFF001',
    pin_hash: staffHash,
    role: 'staff',
    name: 'Counter Staff',
    email: 'staff@iist.ac.in',
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
    login_attempts: 0,
    locked_until: null,
  });

  // Real IIST Cafeteria menu
  const vegItems = [
    { name: 'Paneer Rice',          desc: 'Fragrant rice cooked with paneer and spices',             price: 90 },
    { name: 'Paneer Noodles',       desc: 'Wok-tossed noodles with paneer and vegetables',           price: 85 },
    { name: 'Gobi Rice',            desc: 'Spiced cauliflower fried rice',                           price: 80 },
    { name: 'Jeera Rice',           desc: 'Basmati rice tempered with cumin',                        price: 55 },
    { name: 'Tomato Rice',          desc: 'Tangy south-Indian style tomato rice',                    price: 55 },
    { name: 'Veg Noodles',          desc: 'Stir-fried noodles with garden vegetables',               price: 50 },
    { name: 'Veg Rice',             desc: 'Simple steamed rice with mixed veg stir-fry',             price: 50 },
    { name: 'Paneer Kothuparota',   desc: 'Shredded parota chopped with paneer and masala',          price: 90 },
    { name: 'Dal Kichadi',          desc: 'Comforting lentil and rice porridge with ghee',           price: 70 },
    { name: 'Dal Fry',              desc: 'Yellow lentils tempered with garlic and cumin',           price: 65 },
    { name: 'Dal Tadka',            desc: 'Creamy lentils finished with a smoky tadka',              price: 70 },
    { name: 'Parota',               desc: 'Flaky layered flatbread (per piece)',                     price: 8  },
    { name: 'Paneer Butter Masala', desc: 'Paneer in rich tomato-butter gravy',                     price: 90 },
    { name: 'Chilly Paneer',        desc: 'Indo-Chinese crispy paneer in chilli sauce',              price: 90 },
    { name: 'Kadai Paneer',         desc: 'Paneer cooked with bell peppers in kadai masala',         price: 85 },
    { name: 'Gobi Manchurian',      desc: 'Crispy cauliflower florets in Manchurian sauce',          price: 80 },
    { name: 'Tomato Fry',           desc: 'Tangy dry-fried tomato side dish',                        price: 60 },
    { name: 'Veg Momos',            desc: 'Steamed vegetable dumplings with spicy dip',              price: 90 },
  ];

  const nonvegItems = [
    { name: 'Chicken Rice',                  desc: 'Flavourful rice cooked with tender chicken pieces',       price: 90  },
    { name: 'Egg Rice',                      desc: 'Fried rice scrambled with eggs and spices',               price: 60  },
    { name: 'Chicken Noodles',               desc: 'Stir-fried noodles with shredded chicken',                price: 80  },
    { name: 'Egg Noodles',                   desc: 'Noodles tossed with egg and soy sauce',                   price: 60  },
    { name: 'Kothuparota',                   desc: 'Shredded parota chopped with egg, chicken and masala',    price: 90  },
    { name: 'Egg Burji',                     desc: 'Spiced scrambled eggs with onion and tomato',             price: 50  },
    { name: 'Double Omlet',                  desc: 'Two-egg omelette with masala filling',                    price: 30  },
    { name: 'Bread Omlet',                   desc: 'Fluffy omelette served with toasted bread',               price: 35  },
    { name: 'Chicken Pasta',                 desc: 'Pasta tossed with chicken in a spiced sauce',             price: 90  },
    { name: 'Chicken 65',                    desc: 'Deep-fried spicy chicken 65 — classic Hyderabadi style',  price: 90  },
    { name: 'Chicken Curry',                 desc: 'Home-style chicken in a thick onion-tomato gravy',        price: 90  },
    { name: 'Garlic Chicken',               desc: 'Sautéed chicken with garlic and black pepper',            price: 90  },
    { name: 'Pepper Chicken',               desc: 'Dry-roasted chicken with cracked black pepper',           price: 90  },
    { name: 'Butter Chicken',               desc: 'Creamy tomato-butter chicken curry',                      price: 90  },
    { name: 'Kadai Chicken',                desc: 'Chicken with bell peppers in kadai masala',               price: 90  },
    { name: 'Chilly Chicken',               desc: 'Indo-Chinese crispy chicken in chilli sauce',             price: 80  },
    { name: 'Chicken Cheese Garlic Fingers', desc: 'Cheesy garlic chicken fingers — house special',           price: 100 },
  ];

  vegItems.forEach((item, i) => {
    const id = `veg-${i + 1}`;
    menuItems.set(id, {
      id,
      name: item.name,
      type: 'veg',
      price: item.price,
      available: true,
      description: item.desc,
      slot_time: '08:00-23:00',
    });
  });

  nonvegItems.forEach((item, i) => {
    const id = `nonveg-${i + 1}`;
    menuItems.set(id, {
      id,
      name: item.name,
      type: 'nonveg',
      price: item.price,
      available: true,
      description: item.desc,
      slot_time: '08:00-23:00',
    });
  });
}


// ---- User Operations ----
export const userStore = {
  get: (id: string) => users.get(id) || null,
  set: (id: string, user: User) => users.set(id, user),
  update: (id: string, updates: Partial<User>) => {
    const existing = users.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    users.set(id, updated);
    return updated;
  },
};

// ---- Booking Operations ----
export const bookingStore = {
  get: (id: string) => bookings.get(id) || null,
  set: (id: string, booking: Booking) => bookings.set(id, booking),
  getByUserId: (userId: string) =>
    Array.from(bookings.values()).filter((b) => b.user_id === userId),
  getAll: () => Array.from(bookings.values()),
  getByStatus: (status: string) =>
    Array.from(bookings.values()).filter((b) => b.status === status),
  getByDate: (date: string) =>
    Array.from(bookings.values()).filter((b) => b.booking_date === date),
  update: (id: string, updates: Partial<Booking>) => {
    const existing = bookings.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    bookings.set(id, updated);
    return updated;
  },
  checkDuplicate: (userId: string, date: string, time: string) =>
    Array.from(bookings.values()).some(
      (b) =>
        b.user_id === userId &&
        b.booking_date === date &&
        b.booking_time === time &&
        b.status !== 'cancelled'
    ),
  checkCodeCollision: (code: number, date: string) =>
    Array.from(bookings.values()).some(
      (b) => b.user_code === code && b.booking_date === date
    ),
};

// ---- Menu Operations ----
export const menuStore = {
  getAll: () => Array.from(menuItems.values()),
  getByType: (type: string) =>
    Array.from(menuItems.values()).filter((m) => m.type === type),
  get: (id: string) => menuItems.get(id) || null,
  set: (id: string, item: MenuItem) => menuItems.set(id, item),
};

// ---- Audit Operations ----
export const auditStore = {
  add: (entry: AuditEntry) => auditLog.push(entry),
  getAll: () => [...auditLog].reverse(),
  getByBookingId: (bookingId: string) =>
    auditLog.filter((e) => e.booking_id === bookingId),
  getByDateRange: (start: string, end: string) =>
    auditLog.filter((e) => e.timestamp >= start && e.timestamp <= end),
};
