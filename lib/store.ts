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
    { name: 'Mixed Veg Curry', desc: 'Seasonal vegetables in rich gravy', price: 150 },
  ];
  const nonvegItems = [
    { name: 'Chicken Biryani', desc: 'Hyderabadi-style dum biryani with tender chicken', price: 180 },
    { name: 'Mutton Keema', desc: 'Minced mutton with aromatic spices', price: 180 },
    { name: 'Fish Curry', desc: 'Kerala-style fish in coconut gravy', price: 180 },
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
      slot_time: '12:00-19:00',
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
      slot_time: '12:00-19:00',
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
