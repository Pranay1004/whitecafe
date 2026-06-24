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

export interface BookingItem {
  id: string;
  name: string;
  price: number;
  type: MealType;
  quantity: number;
  is_parcel: boolean;
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
  items?: BookingItem[];
  metadata: {
    verified_by: string | null;
    verified_at: string | null;
    counter: MealType | null;
    rejection_reason?: string;
    payment_method?: string;
    payment_status?: string;
    payment_utr?: string;
  };
}

export interface BookingCreateRequest {
  item_type: MealType;
  item_name?: string;
  booking_date: string;
  booking_time: string;
  payment_method?: string;
  payment_status?: string;
  payment_utr?: string;
  phone?: string;
  email?: string;
  items?: BookingItem[];
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
  { name: 'Paneer Biryani', type: 'veg', price: 150, available: true, description: 'Aromatic basmati rice with paneer tikka', slot_time: '07:30-21:30' },
  { name: 'Chole Bhature', type: 'veg', price: 150, available: true, description: 'Spicy chickpea curry with fluffy fried bread', slot_time: '07:30-21:30' },
  { name: 'Mixed Veg Curry', type: 'veg', price: 120, available: true, description: 'Seasonal vegetables in rich gravy', slot_time: '07:30-21:30' },
  { name: 'Veg Roll', type: 'veg', price: 60, available: true, description: 'Flaky flatbread wrapped with spiced vegetables', slot_time: '07:30-21:30' },
  { name: 'Veg Fried Rice', type: 'veg', price: 100, available: true, description: 'Basmati rice tossed with fresh garden vegetables', slot_time: '07:30-21:30' },
  { name: 'Dal Khichdi', type: 'veg', price: 90, available: true, description: 'Comforting lentil and rice porridge served with ghee', slot_time: '07:30-21:30' },
  { name: 'Medu Vada (2 pcs)', type: 'veg', price: 40, available: true, description: 'Crispy fried lentil donuts served with sambar & chutney', slot_time: '07:30-21:30' },
  { name: 'Masala Dosa', type: 'veg', price: 70, available: true, description: 'Crispy rice crepe filled with potato masala', slot_time: '07:30-21:30' },
  { name: 'Samosa (2 pcs)', type: 'veg', price: 30, available: true, description: 'Crispy pastry shells filled with spiced potatoes', slot_time: '07:30-21:30' },
  { name: 'Chicken Biryani', type: 'nonveg', price: 180, available: true, description: 'Hyderabadi-style dum biryani with tender chicken', slot_time: '07:30-21:30' },
  { name: 'Mutton Keema', type: 'nonveg', price: 180, available: true, description: 'Minced mutton with aromatic spices', slot_time: '07:30-21:30' },
  { name: 'Fish Curry', type: 'nonveg', price: 160, available: true, description: 'Kerala-style fish in coconut gravy', slot_time: '07:30-21:30' },
  { name: 'Egg Chicken Roll', type: 'nonveg', price: 90, available: true, description: 'Spiced chicken and egg wrapped in a flaky roll', slot_time: '07:30-21:30' },
  { name: 'Chicken Fried Rice', type: 'nonveg', price: 130, available: true, description: 'Wok-tossed rice with shredded chicken and egg', slot_time: '07:30-21:30' },
  { name: 'Chicken Shawarma', type: 'nonveg', price: 120, available: true, description: 'Slow-roasted chicken wrap with garlic mayo', slot_time: '07:30-21:30' },
  { name: 'Chicken Kothu Parotta', type: 'nonveg', price: 140, available: true, description: 'Shredded parotta chopped with chicken, egg and curry sauce', slot_time: '07:30-21:30' },
  { name: 'Egg Kothu Parotta', type: 'nonveg', price: 110, available: true, description: 'Shredded parotta chopped with egg and spices', slot_time: '07:30-21:30' },
];
