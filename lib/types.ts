// ============================================
// IIST Cafeteria Booking System — Type Definitions
// ============================================

export type UserRole = 'student' | 'staff' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'served' | 'cancelled';
export type MealType = 'veg' | 'nonveg';
export type AuditAction =
  | 'login'
  | 'booking_created'
  | 'verified'
  | 'verification_failed'
  | 'rejected'
  | 'served'
  | 'cancelled'
  | 'auto_cleanup';

// ---- User ----
export interface User {
  id: string;
  pin_hash: string;
  role: UserRole;
  name: string;
  email: string;
  created_at: string;
  last_login: string;
  login_attempts?: number;
  locked_until?: string | null;
}

export interface UserPayload {
  id: string;
  role: UserRole;
  name: string;
}

// ---- Booking ----
export interface Booking {
  booking_id: string;
  user_id: string;
  user_name?: string;
  item_type: MealType;
  item_name?: string;
  booking_date: string;
  booking_time: string;
  amount: number;
  status: BookingStatus;
  user_code: number;
  admin_code: number;
  qr_token: string;
  created_at: string;
  served_at: string | null;
  metadata: {
    verified_by: string | null;
    verified_at: string | null;
    counter: MealType | null;
    rejection_reason?: string;
  };
}

export interface BookingCreateRequest {
  item_type: MealType;
  item_name?: string;
  booking_date: string;
  booking_time: string;
}

export interface BookingCreateResponse {
  booking_id: string;
  user_code: number;
  admin_code?: number | null;
  qr_data: {
    booking_id: string;
    user_code: number;
    timestamp: string;
  };
  amount: number;
  status: BookingStatus;
}

// ---- Menu ----
export interface MenuItem {
  id: string;
  name: string;
  type: MealType;
  price: number;
  available: boolean;
  description?: string;
  slot_time: string;
}

// ---- Audit ----
export interface AuditEntry {
  id: string;
  booking_id: string;
  action: AuditAction;
  actor_id: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// ---- Auth ----
export interface LoginRequest {
  id: string;
  pin: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    role: UserRole;
    name: string;
  };
  expires_in: number;
}

export interface VerifyRequest {
  booking_id: string;
  admin_code: number;
}

export interface GuestBookingRequest {
  name: string;
  phone: string;
  item_type: MealType;
  item_name?: string;
  booking_date: string;
  booking_time: string;
}

// ---- API Response Wrapper ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ---- Time Slots ----
export const TIME_SLOTS = [
  { value: '12:00', label: '12:00 PM', period: 'lunch' },
  { value: '12:30', label: '12:30 PM', period: 'lunch' },
  { value: '13:00', label: '1:00 PM', period: 'lunch' },
  { value: '18:30', label: '6:30 PM', period: 'dinner' },
  { value: '19:00', label: '7:00 PM', period: 'dinner' },
] as const;

// ---- Menu Data (static for MVP) ----
export const MENU_ITEMS: Omit<MenuItem, 'id'>[] = [
  { name: 'Paneer Biryani', type: 'veg', price: 150, available: true, description: 'Aromatic basmati rice with paneer tikka', slot_time: '12:00-13:00' },
  { name: 'Chole Bhature', type: 'veg', price: 150, available: true, description: 'Spicy chickpea curry with fluffy fried bread', slot_time: '12:00-13:00' },
  { name: 'Mixed Veg Curry', type: 'veg', price: 150, available: true, description: 'Seasonal vegetables in rich gravy', slot_time: '12:00-13:00' },
  { name: 'Chicken Biryani', type: 'nonveg', price: 180, available: true, description: 'Hyderabadi-style dum biryani with tender chicken', slot_time: '12:00-13:00' },
  { name: 'Mutton Keema', type: 'nonveg', price: 180, available: true, description: 'Minced mutton with aromatic spices', slot_time: '12:00-13:00' },
  { name: 'Fish Curry', type: 'nonveg', price: 180, available: true, description: 'Kerala-style fish in coconut gravy', slot_time: '12:00-13:00' },
];
