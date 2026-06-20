'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

interface BookingData {
  booking_id: string;
  user_code: number;
  amount: number;
  status: string;
  item_type: string;
  item_name: string;
  booking_date: string;
  booking_time: string;
  user_name: string;
  qr_data: {
    booking_id: string;
    user_code: number;
    timestamp: string;
  };
}

export default function ConfirmationPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem('lastBooking');
    if (!data) {
      router.push('/booking');
      return;
    }
    try {
      setBooking(JSON.parse(data));
    } catch {
      router.push('/booking');
    }
  }, [router]);

  const handleCopyCode = () => {
    if (booking) {
      navigator.clipboard.writeText(String(booking.user_code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const qrValue = JSON.stringify(booking.qr_data);
  const isVeg = booking.item_type === 'veg';

  // Format date nicely
  const dateObj = new Date(booking.booking_date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Success header */}
      <div className={`relative overflow-hidden py-12 ${isVeg ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-red-700'}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8 text-6xl animate-float">🍽</div>
          <div className="absolute top-8 right-16 text-4xl animate-float" style={{ animationDelay: '1s' }}>✨</div>
          <div className="absolute bottom-4 left-1/3 text-5xl animate-float" style={{ animationDelay: '2s' }}>
            {isVeg ? '🥗' : '🍖'}
          </div>
        </div>

        <div className="relative z-10 max-w-lg mx-auto text-center px-6">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 animate-scale-in">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Booking Confirmed!
          </h1>
          <p className="text-white/80">
            Your meal has been booked successfully
          </p>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-6 -mt-6 pb-12">
        {/* Main Card */}
        <div className="card p-6 mb-6 animate-slide-up">
          {/* Booking ID */}
          <div className="text-center mb-6 pb-6 border-b border-[var(--border)]">
            <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider mb-1">Booking ID</p>
            <p className="text-2xl font-bold font-mono tracking-wider" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              {booking.booking_id}
            </p>
          </div>

          {/* Verification Code — THE MAIN FEATURE */}
          <div className="text-center mb-6 pb-6 border-b border-[var(--border)]">
            <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider mb-3">Your Verification Code</p>
            <button
              onClick={handleCopyCode}
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl transition-all ${
                isVeg
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                  : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
              }`}
            >
              <span className={`text-5xl font-extrabold tracking-wider ${isVeg ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                {booking.user_code}
              </span>
              <span className="text-[var(--text-tertiary)] text-xs">
                {copied ? '✓ Copied!' : 'tap to copy'}
              </span>
            </button>
            <p className="text-[var(--text-secondary)] text-sm mt-3">
              Show this code at the counter
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-6 pb-6 border-b border-[var(--border)]">
            <div className="qr-container">
              <QRCodeSVG
                value={qrValue}
                size={180}
                level="M"
                bgColor="#ffffff"
                fgColor="#0f172a"
                includeMargin={false}
              />
              <p className="text-slate-500 text-xs">Scan at counter</p>
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)] text-sm">Meal</span>
              <div className="flex items-center gap-2">
                <span className={`badge ${isVeg ? 'badge-veg' : 'badge-nonveg'}`}>
                  {isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                </span>
                <span className="font-medium text-sm">{booking.item_name}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)] text-sm">Date</span>
              <span className="font-medium text-sm">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)] text-sm">Time</span>
              <span className="font-medium text-sm">{booking.booking_time}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)] text-sm">Status</span>
              <span className="badge badge-pending">⏳ Pending</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]">
              <span className="text-[var(--text-secondary)]">Amount</span>
              <span className="text-2xl font-bold gradient-text">₹{booking.amount}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Link href="/booking" className="btn btn-primary w-full">
            Book Another Meal
          </Link>
          <Link href="/" className="btn btn-secondary w-full">
            Go Home
          </Link>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
          <p className="text-amber-700 dark:text-amber-400 text-sm font-medium mb-2">📋 How to collect your meal</p>
          <ol className="text-amber-600 dark:text-amber-400/80 text-sm space-y-1 list-decimal list-inside">
            <li>Go to the cafeteria at your selected time</li>
            <li>Show your QR code or tell the staff your code: <strong>{booking.user_code}</strong></li>
            <li>The admin will verify and confirm your booking</li>
            <li>Collect your meal from the counter</li>
          </ol>
        </div>
      </main>
    </div>
  );
}
