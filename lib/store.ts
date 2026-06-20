// ============================================
// In-Memory Store — Development fallback
// ============================================
// When Firebase is not configured, the app uses this
// in-memory store. Data resets on server restart.

import type { User, Booking, MenuItem, AuditEntry } from './types';
import { hashPin } from './auth';

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
  const adminHash = await hashPin('0000');
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
  const guestHash = await hashPin('guest');
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
  const studentHash = await hashPin('1234');
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
  const staffHash = await hashPin('5678');
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

  // Default menu items
  const vegItems = [
    { name: 'Paneer Biryani', desc: 'Aromatic basmati rice with paneer tikka', price: 150 },
    { name: 'Chole Bhature', desc: 'Spicy chickpea curry with fluffy fried bread', price: 150 },
    { name: 'Mixed Veg Curry', desc: 'Seasonal vegetables in rich gravy', price: 120 },
    { name: 'Veg Roll', desc: 'Flaky flatbread wrapped with spiced vegetables', price: 60 },
    { name: 'Veg Fried Rice', desc: 'Basmati rice tossed with fresh garden vegetables', price: 100 },
    { name: 'Dal Khichdi', desc: 'Comforting lentil and rice porridge served with ghee', price: 90 },
    { name: 'Medu Vada (2 pcs)', desc: 'Crispy fried lentil donuts served with sambar & chutney', price: 40 },
    { name: 'Masala Dosa', desc: 'Crispy rice crepe filled with potato masala', price: 70 },
    { name: 'Samosa (2 pcs)', desc: 'Crispy pastry shells filled with spiced potatoes', price: 30 },
  ];
  const nonvegItems = [
    { name: 'Chicken Biryani', desc: 'Hyderabadi-style dum biryani with tender chicken', price: 180 },
    { name: 'Mutton Keema', desc: 'Minced mutton with aromatic spices', price: 180 },
    { name: 'Fish Curry', desc: 'Kerala-style fish in coconut gravy', price: 160 },
    { name: 'Egg Chicken Roll', desc: 'Spiced chicken and egg wrapped in a flaky roll', price: 90 },
    { name: 'Chicken Fried Rice', desc: 'Wok-tossed rice with shredded chicken and egg', price: 130 },
    { name: 'Chicken Shawarma', desc: 'Slow-roasted chicken wrap with garlic mayo', price: 120 },
    { name: 'Chicken Kothu Parotta', desc: 'Shredded parotta chopped with chicken, egg and curry sauce', price: 140 },
    { name: 'Egg Kothu Parotta', desc: 'Shredded parotta chopped with egg and spices', price: 110 },
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
      slot_time: '07:30-21:30',
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
      slot_time: '07:30-21:30',
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
