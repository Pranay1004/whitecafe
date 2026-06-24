'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import type { MenuItem, MealType, BookingItem } from '@/lib/types';
import { isTokenExpired, clearClientSession } from '@/lib/clientAuth';

// IIST Cafeteria time slots (hourly ranges, for reference only)
const TIME_SLOTS = [
  // Morning
  { value: '08:00', label: '8 – 9 AM',   period: 'Morning' },
  { value: '09:00', label: '9 – 10 AM',  period: 'Morning' },
  { value: '10:00', label: '10 – 11 AM', period: 'Morning' },
  { value: '11:00', label: '11 – 12 PM', period: 'Morning' },
  // Afternoon
  { value: '12:00', label: '12 – 1 PM',  period: 'Afternoon' },
  { value: '13:00', label: '1 – 2 PM',   period: 'Afternoon' },
  { value: '14:00', label: '2 – 3 PM',   period: 'Afternoon' },
  { value: '15:00', label: '3 – 4 PM',   period: 'Afternoon' },
  { value: '16:00', label: '4 – 5 PM',   period: 'Afternoon' },
  // Evening
  { value: '17:00', label: '5 – 6 PM',   period: 'Evening' },
  { value: '18:00', label: '6 – 7 PM',   period: 'Evening' },
  { value: '19:00', label: '7 – 8 PM',   period: 'Evening' },
  // Night
  { value: '20:00', label: '8 – 9 PM',   period: 'Night' },
  { value: '21:00', label: '9 – 10 PM',  period: 'Night' },
  { value: '22:00', label: '10 – 11 PM', period: 'Night' },
];


const PERIOD_ICONS: Record<string, string> = {
  Morning:   '🌅',
  Afternoon: '☀️',
  Evening:   '🌇',
  Night:     '🌙',
};

function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCurrentTimeValue() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function isSlotExpired(slotValue: string) {
  return slotValue <= getCurrentTimeValue();
}

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);

  // Cart state
  const [cart, setCart] = useState<BookingItem[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [menuTab, setMenuTab] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [menuSearch, setMenuSearch] = useState('');

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'phonepe' | 'paytm' | 'bharatpay' | 'counter'>('counter');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSimulating, setPaymentSimulating] = useState(false);

  const todayDate = getTodayDateString();
  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Group available slots by period
  const slotsByPeriod = TIME_SLOTS.reduce((acc, slot) => {
    if (!acc[slot.period]) acc[slot.period] = [];
    acc[slot.period].push(slot);
    return acc;
  }, {} as Record<string, typeof TIME_SLOTS>);

  // Count available (non-expired) slots
  const availableSlotCount = TIME_SLOTS.filter(s => !isSlotExpired(s.value)).length;

  // Session verification on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData || isTokenExpired(token)) {
      clearClientSession();
      router.push('/login');
      return;
    }
    try {
      setUser(JSON.parse(userData));
    } catch {
      clearClientSession();
      router.push('/login');
    }
  }, [router]);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {}
    }
  }, []);

  // Save cart helper
  const saveCart = (newCart: BookingItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  // Fetch full menu once on mount
  useEffect(() => {
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setMenuItems(data.data);
      })
      .catch(() => setMenuItems([]));
  }, []);

  // Cart operations
  const addToCart = (item: MenuItem) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      const updated = cart.map((c) =>
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      );
      saveCart(updated);
    } else {
      const newItem: BookingItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        type: item.type,
        quantity: 1,
        is_parcel: false,
      };
      saveCart([...cart, newItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    const existing = cart.find((c) => c.id === itemId);
    if (!existing) return;
    if (existing.quantity > 1) {
      const updated = cart.map((c) =>
        c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c
      );
      saveCart(updated);
    } else {
      const updated = cart.filter((c) => c.id !== itemId);
      saveCart(updated);
    }
  };

  const toggleItemParcel = (itemId: string) => {
    const updated = cart.map((c) =>
      c.id === itemId ? { ...c, is_parcel: !c.is_parcel } : c
    );
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const handleLogout = () => {
    clearClientSession();
    router.push('/');
  };

  const price = cart.reduce(
    (sum, item) => sum + (item.price + (item.is_parcel ? 5 : 0)) * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleBook = async (method: string = 'Pay at Counter', status: string = 'Pending', transactionUtr: string = '') => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      let phone = '';
      let email = '';
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          phone = parsed.phone || '';
          email = parsed.email || '';
        } catch {}
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_date: todayDate,
          booking_time: selectedTime,
          payment_method: method,
          payment_status: status,
          payment_utr: transactionUtr,
          phone,
          email,
          items: cart,
        }),
      });

      if (res.status === 401) {
        clearClientSession();
        router.push('/login');
        return;
      }

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Booking failed');
        setLoading(false);
        setShowPaymentModal(false);
        return;
      }

      // Store booking data for confirmation page
      localStorage.setItem('lastBooking', JSON.stringify({
        ...data.data,
        booking_date: todayDate,
        booking_time: selectedTime,
        user_name: user?.name,
        payment_method: method,
        payment_status: status,
        payment_utr: transactionUtr,
        items: cart,
        amount: price,
      }));

      // Clear cart upon successful order
      clearCart();

      router.push('/confirmation');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      setShowPaymentModal(false);
    }
  };

  const handleConfirmBookingClick = () => {
    setError('');
    if (paymentMethod === 'counter') {
      handleBook('Pay at Counter', 'Pending', '');
    } else {
      setShowPaymentModal(true);
      setPaymentSimulating(false);
    }
  };

  const handleConfirmUpiPayment = () => {
    setError('');
    setPaymentSimulating(true);
    setTimeout(() => {
      setPaymentSimulating(false);
      const methodLabel = paymentMethod === 'phonepe' ? 'PhonePe' : paymentMethod === 'paytm' ? 'Paytm' : 'BharatPe';
      handleBook(methodLabel, 'Paid (UPI)', 'UPI');
    }, 1200);
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="font-bold text-lg" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Book a Meal
              </h1>
              <p className="text-[var(--text-tertiary)] text-xs">{todayFormatted}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">
                {user.name}
              </span>
            )}
            <button onClick={handleLogout} className="btn btn-ghost text-slate-300 btn-sm cursor-pointer">
              Sign Out
            </button>
          </div>
        </div>

        {/* Progress bar — now 3 steps */}
        <div className="max-w-3xl mx-auto px-6 pb-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--border)]">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: step >= s ? '100%' : '0%',
                    background: step >= s ? 'linear-gradient(90deg, #f59e0b, #f97316)' : 'transparent',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[var(--text-tertiary)] text-xs">
              Step {step} of {totalSteps}
            </p>
            {cartCount > 0 && step === 2 && (
              <span className="text-xs font-semibold text-amber-500">
                🛒 {cartCount} items in cart (₹{price})
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-scale-in">
            <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* No available slots warning */}
        {availableSlotCount === 0 && step === 1 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-amber-700 dark:text-amber-400 text-sm font-medium">
              ⚠ All time slots for today have passed. Booking is closed for the day.
            </p>
          </div>
        )}

        {/* Step 1: Time Slot selection */}
        {step === 1 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Pick a time slot
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              Booking for <strong>today</strong> — {todayFormatted}
            </p>

            {Object.entries(slotsByPeriod).map(([period, slots]) => {
              const allExpired = slots.every(s => isSlotExpired(s.value));
              return (
                <div key={period} className="mb-6">
                  <p className={`text-sm font-semibold mb-2 ${allExpired ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-secondary)]'}`}>
                    {PERIOD_ICONS[period]} {period}
                    {allExpired && <span className="ml-2 text-xs font-normal">(passed)</span>}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => {
                      const expired = isSlotExpired(slot.value);
                      return (
                        <button
                          key={slot.value}
                          onClick={() => !expired && setSelectedTime(slot.value)}
                          disabled={expired}
                          className={`py-4 px-2 rounded-xl border-2 text-center font-bold text-sm transition-all active:scale-95 cursor-pointer ${
                            expired
                              ? 'border-[var(--border)] text-[var(--text-tertiary)] opacity-40 cursor-not-allowed line-through'
                              : selectedTime === slot.value
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                                : 'border-[var(--border)] hover:border-amber-300 text-[var(--text-primary)]'
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => setStep(2)}
              disabled={!selectedTime}
              className="btn btn-primary btn-xl w-full mt-6"
            >
              Select Dishes →
            </button>
          </div>
        )}

        {/* Step 2: Add Menu Items to Cart */}
        {step === 2 && (
          <div className="animate-slide-up pb-24">
            <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Add items to your cart
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              Choose from our fresh cafeteria menu
            </p>

            {/* Filter Tabs & Search */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="search"
                  className="input input-mobile pl-10"
                  placeholder="Search dishes…"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['all', 'veg', 'nonveg'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setMenuTab(t)}
                    className={`btn btn-sm flex-shrink-0 transition-all cursor-pointer ${
                      menuTab === t ? 'btn-primary' : 'btn-ghost border border-[var(--border)]'
                    }`}
                  >
                    {t === 'all' ? '🍽 All' : t === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu List */}
            <div className="space-y-3 stagger">
              {menuItems
                .filter((item) => {
                  if (menuTab === 'veg' && item.type !== 'veg') return false;
                  if (menuTab === 'nonveg' && item.type !== 'nonveg') return false;
                  if (menuSearch && !item.name.toLowerCase().includes(menuSearch.toLowerCase())) return false;
                  return true;
                })
                .map((item) => {
                  const cartItem = cart.find((c) => c.id === item.id);
                  const isVeg = item.type === 'veg';
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                        cartItem
                          ? isVeg
                            ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-900/10'
                            : 'border-red-500 bg-red-50/20 dark:bg-red-900/10'
                          : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'
                      }`}
                    >
                      <div className="flex-1 pr-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-2.5 h-2.5 rounded-sm border-2 flex-shrink-0 ${isVeg ? 'border-emerald-600' : 'border-red-600'}`}>
                            <span className={`block w-1 h-1 rounded-full mx-auto mt-0.5 ${isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                          </span>
                          <h3 className="font-semibold text-base">{item.name}</h3>
                        </div>
                        <p className="text-[var(--text-secondary)] text-xs">{item.description}</p>
                        <span className={`inline-block font-bold text-sm mt-1 ${isVeg ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          ₹{item.price}
                        </span>
                      </div>
                      
                      {/* Quantity Controller / Add Button */}
                      <div className="flex-shrink-0 ml-4">
                        {cartItem ? (
                          <div className="flex items-center bg-slate-900 border border-[var(--border)] rounded-xl overflow-hidden text-white">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="px-3 py-2 text-lg font-bold text-amber-500 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              −
                            </button>
                            <span className="px-3 font-semibold text-sm">
                              {cartItem.quantity}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="px-3 py-2 text-lg font-bold text-amber-500 hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="btn btn-sm btn-primary cursor-pointer px-4"
                          >
                            Add +
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Sticky Bottom Cart Bar */}
            {cartCount > 0 && (
              <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-[var(--border)] py-4 px-6 text-white">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Selected items</p>
                    <p className="font-bold text-lg">
                      {cartCount} {cartCount === 1 ? 'item' : 'items'} · <span className="text-amber-500">₹{price}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={clearCart}
                      className="btn btn-ghost text-slate-400 btn-sm cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="btn btn-primary btn-md cursor-pointer animate-pulse-glow"
                    >
                      Checkout →
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => setStep(1)} className="btn btn-ghost mt-6">
              ← Change slot
            </button>
          </div>
        )}

        {/* Step 3: Checkout and Confirm */}
        {step === 3 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Confirm your order
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">Review your cart details and payment method</p>

            <div className="card p-6 mb-6">
              <div className="space-y-4">
                <div className="border-b border-[var(--border)] pb-3 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Selected Items</p>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="flex flex-col bg-[var(--surface-elevated)] p-3 rounded-xl border border-[var(--border)]">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${item.type === 'veg' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="font-semibold text-sm">{item.name}</span>
                            <span className="text-xs text-[var(--text-tertiary)]">x{item.quantity}</span>
                          </div>
                          <span className="font-bold text-sm">₹{(item.price + (item.is_parcel ? 5 : 0)) * item.quantity}</span>
                        </div>
                        
                        {/* Parcel Toggle for each Item */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)] border-dashed">
                          <span className="text-xs text-[var(--text-tertiary)]">
                            Pack as Parcel (+₹5 per unit)
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleItemParcel(item.id)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                              item.is_parcel ? 'bg-amber-500' : 'bg-[var(--border)]'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                                item.is_parcel ? 'translate-x-4' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Date</span>
                  <span className="font-semibold">{todayFormatted}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Time Slot</span>
                  <span className="font-semibold">
                    {TIME_SLOTS.find((t) => t.value === selectedTime)?.label}
                  </span>
                </div>
                
                {/* Payment Method Selector */}
                <div className="py-4 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)] block mb-3 text-sm font-semibold text-left">Select Payment Method</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('phonepe')}
                      className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                        paymentMethod === 'phonepe' ? 'border-violet-500 bg-violet-500/10' : 'border-[var(--border)] hover:border-violet-400'
                      }`}
                    >
                      <span className="text-lg mb-1">📱</span>
                      <div>
                        <p className="font-bold text-xs text-[var(--text-primary)]">PhonePe</p>
                        <p className="text-[var(--text-tertiary)] text-[10px]">Mock UPI Gateway</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('paytm')}
                      className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                        paymentMethod === 'paytm' ? 'border-sky-500 bg-sky-500/10' : 'border-[var(--border)] hover:border-sky-400'
                      }`}
                    >
                      <span className="text-lg mb-1">💳</span>
                      <div>
                        <p className="font-bold text-xs text-[var(--text-primary)]">Paytm</p>
                        <p className="text-[var(--text-tertiary)] text-[10px]">Fast UPI checkout</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('bharatpay')}
                      className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                        paymentMethod === 'bharatpay' ? 'border-emerald-500 bg-emerald-500/10' : 'border-[var(--border)] hover:border-emerald-400'
                      }`}
                    >
                      <span className="text-lg mb-1">🌀</span>
                      <div>
                        <p className="font-bold text-xs text-[var(--text-primary)]">BharatPe</p>
                        <p className="text-[var(--text-tertiary)] text-[10px]">Scan & Pay QR</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('counter')}
                      className={`p-3 rounded-xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                        paymentMethod === 'counter' ? 'border-amber-500 bg-amber-500/10' : 'border-[var(--border)] hover:border-amber-400'
                      }`}
                    >
                      <span className="text-lg mb-1">💵</span>
                      <div>
                        <p className="font-bold text-xs text-[var(--text-primary)]">Pay at Counter</p>
                        <p className="text-[var(--text-tertiary)] text-[10px]">Pay Cash at counter</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[var(--text-secondary)]">Total Amount</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold gradient-text">₹{price}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn btn-ghost">
                ← Back
              </button>
              <button
                onClick={handleConfirmBookingClick}
                disabled={loading || cart.length === 0}
                className="btn btn-primary btn-lg flex-1 animate-pulse-glow"
                id="confirm-booking"
              >
                {loading ? (
                  <div className="flex items-center gap-2 justify-center">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Booking...
                  </div>
                ) : (
                  paymentMethod === 'counter' ? `Confirm Booking — ₹${price}` : `Pay & Book — ₹${price}`
                )}
              </button>
            </div>
          </div>
        )}

        {/* UPI Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-6 animate-fade-in">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-scale-in text-center text-white">
              {paymentSimulating ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 relative">
                    <div className="absolute inset-0 border-2 border-dashed border-amber-500/30 rounded-full animate-spin" style={{ animationDuration: '6s' }} />
                    <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    Confirming Booking
                  </h3>
                  <p className="text-slate-300 text-sm">
                    Processing your order, please wait...
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-1 animate-scale-in" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    UPI Payment Gateway
                  </h3>
                  <p className="text-slate-400 text-xs mb-4">
                    Scan using your <span className="capitalize font-semibold text-slate-200">{paymentMethod}</span> app to pay ₹{price}
                  </p>
                  
                  <div className="bg-white p-3 rounded-2xl inline-block mb-4 shadow-md border border-slate-700 animate-scale-in">
                    <QRCodeSVG
                      value={`upi://pay?pa=iistcafeteria@okaxis&pn=IIST%20Cafeteria&am=${price}&cu=INR`}
                      size={150}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#0f172a"
                      includeMargin={false}
                    />
                  </div>

                  <div className="space-y-4 text-left">
                    <p className="text-slate-300 text-xs text-center leading-relaxed">
                      Please make the payment using the QR code above. Once paid, click the button below to confirm.
                    </p>
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-center">
                      <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wide">
                        💡 Verification Note
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Show the payment success screen on your phone to counter staff when collecting your meal.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => { setShowPaymentModal(false); setError(''); }}
                        className="btn btn-secondary btn-sm flex-1 bg-slate-800 border-none text-slate-300 hover:bg-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmUpiPayment}
                        className="btn btn-primary btn-sm flex-1 cursor-pointer"
                      >
                        Confirm Payment
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
