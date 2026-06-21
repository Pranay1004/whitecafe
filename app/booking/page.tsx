'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import type { MenuItem, MealType } from '@/lib/types';

// Actual IIST Cafeteria time slots
const TIME_SLOTS = [
  { value: '07:30', label: '7:30 AM', period: 'Breakfast' },
  { value: '08:00', label: '8:00 AM', period: 'Breakfast' },
  { value: '08:30', label: '8:30 AM', period: 'Breakfast' },
  { value: '09:00', label: '9:00 AM', period: 'Breakfast' },
  { value: '09:30', label: '9:30 AM', period: 'Breakfast' },
  { value: '12:00', label: '12:00 PM', period: 'Lunch' },
  { value: '12:30', label: '12:30 PM', period: 'Lunch' },
  { value: '13:00', label: '1:00 PM', period: 'Lunch' },
  { value: '13:30', label: '1:30 PM', period: 'Lunch' },
  { value: '14:00', label: '2:00 PM', period: 'Lunch' },
  { value: '16:00', label: '4:00 PM', period: 'Snacks' },
  { value: '16:30', label: '4:30 PM', period: 'Snacks' },
  { value: '17:00', label: '5:00 PM', period: 'Snacks' },
  { value: '19:00', label: '7:00 PM', period: 'Dinner' },
  { value: '19:30', label: '7:30 PM', period: 'Dinner' },
  { value: '20:00', label: '8:00 PM', period: 'Dinner' },
  { value: '20:30', label: '8:30 PM', period: 'Dinner' },
  { value: '21:00', label: '9:00 PM', period: 'Dinner' },
];

const PERIOD_ICONS: Record<string, string> = {
  Breakfast: '🌅',
  Lunch: '🌤',
  Snacks: '☕',
  Dinner: '🌙',
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
  const [mealType, setMealType] = useState<MealType | ''>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    try {
      setUser(JSON.parse(userData));
    } catch {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (mealType) {
      fetch(`/api/menu?type=${mealType}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setMenuItems(data.data);
        })
        .catch(() => setMenuItems([]));
    }
  }, [mealType]);

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
          item_type: mealType,
          item_name: selectedItem?.name,
          booking_date: todayDate,
          booking_time: selectedTime,
          payment_method: method,
          payment_status: status,
          payment_utr: transactionUtr,
          phone,
          email,
        }),
      });

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
        item_type: mealType,
        item_name: selectedItem?.name || (mealType === 'veg' ? 'Veg Meal' : 'Non-Veg Meal'),
        booking_date: todayDate,
        booking_time: selectedTime,
        user_name: user?.name,
        payment_method: method,
        payment_status: status,
        payment_utr: transactionUtr,
      }));

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
  const price = selectedItem?.price || (mealType === 'veg' ? 150 : mealType === 'nonveg' ? 180 : 0);

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
          {user && (
            <span className="text-sm text-[var(--text-secondary)]">
              {user.name}
            </span>
          )}
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
          <p className="text-[var(--text-tertiary)] text-xs mt-2">
            Step {step} of {totalSteps}
          </p>
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

        {/* Step 1: Meal Type + Time Slot (combined) */}
        {step === 1 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              What are you craving?
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">Select your meal preference</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <button
                onClick={() => { setMealType('veg'); setSelectedItem(null); }}
                className={`group relative overflow-hidden p-6 rounded-2xl border-2 text-left transition-all duration-300 ${
                  mealType === 'veg'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-[var(--border)] hover:border-emerald-300'
                }`}
                id="select-veg"
              >
                <div className="absolute top-4 right-4 w-16 h-16 text-5xl opacity-20 group-hover:opacity-40 transition-opacity">
                  🥬
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-2xl mb-4">
                  🥗
                </div>
                <h3 className="text-lg font-bold mb-1 text-emerald-700 dark:text-emerald-400">Vegetarian</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-3">
                  Paneer Biryani, Chole Bhature, Mixed Veg Curry
                </p>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                  ₹150
                </span>
              </button>

              <button
                onClick={() => { setMealType('nonveg'); setSelectedItem(null); }}
                className={`group relative overflow-hidden p-6 rounded-2xl border-2 text-left transition-all duration-300 ${
                  mealType === 'nonveg'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-[var(--border)] hover:border-red-300'
                }`}
                id="select-nonveg"
              >
                <div className="absolute top-4 right-4 w-16 h-16 text-5xl opacity-20 group-hover:opacity-40 transition-opacity">
                  🍗
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl mb-4">
                  🍖
                </div>
                <h3 className="text-lg font-bold mb-1 text-red-700 dark:text-red-400">Non-Vegetarian</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-3">
                  Chicken Biryani, Mutton Keema, Fish Curry
                </p>
                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold text-lg">
                  ₹180
                </span>
              </button>
            </div>

            {/* Time Slot Selection — same-day only */}
            {mealType && (
              <div className="animate-slide-up">
                <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                  Pick a time slot
                </h3>
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
                              className={`py-4 px-2 rounded-xl border-2 text-center font-bold text-sm transition-all active:scale-95 ${
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
                  disabled={!selectedTime || !mealType}
                  className="btn btn-primary btn-xl w-full mt-6"
                >
                  Continue to Menu →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Menu Item */}
        {step === 2 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Pick your dish
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">
              Choose from our {mealType === 'veg' ? 'vegetarian' : 'non-vegetarian'} menu
            </p>

            <div className="space-y-3 stagger">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedItem(item); setStep(3); }}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                    selectedItem?.id === item.id
                      ? mealType === 'veg'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-[var(--border)] hover:border-[var(--text-tertiary)] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-[var(--text-secondary)] text-sm mt-1">{item.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`font-bold text-lg ${mealType === 'veg' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        ₹{item.price}
                      </span>
                      <span className={`badge ${mealType === 'veg' ? 'badge-veg' : 'badge-nonveg'}`}>
                        {item.type === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button onClick={() => setStep(1)} className="btn btn-ghost mt-6">
              ← Change meal type
            </button>
          </div>
        )}

        {/* Step 3: Confirm & Book */}
        {step === 3 && (
          <div className="animate-slide-up">
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              Confirm your order
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">Review your booking details</p>

            <div className="card p-6 mb-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
                  <span className="text-[var(--text-secondary)]">Meal</span>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${mealType === 'veg' ? 'badge-veg' : 'badge-nonveg'}`}>
                      {mealType === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                    </span>
                    <span className="font-semibold">{selectedItem?.name}</span>
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
                        <p className="font-bold text-xs">PhonePe</p>
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
                        <p className="font-bold text-xs">Paytm</p>
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
                        <p className="font-bold text-xs">BharatPe</p>
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
                        <p className="font-bold text-xs">Pay at Counter</p>
                        <p className="text-[var(--text-tertiary)] text-[10px]">Pay Cash at counter</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[var(--text-secondary)]">Amount</span>
                  <span className="text-2xl font-bold gradient-text">₹{price}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn btn-ghost">
                ← Back
              </button>
              <button
                onClick={handleConfirmBookingClick}
                disabled={loading}
                className="btn btn-primary btn-lg flex-1 animate-pulse-glow"
                id="confirm-booking"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
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
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
                      <p className="text-[10px] text-amber-400 font-semibold text-center uppercase tracking-wide">
                        💡 Verification Note
                      </p>
                      <p className="text-[10px] text-slate-400 text-center mt-1 leading-normal">
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
