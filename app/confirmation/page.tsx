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
  payment_method?: string;
  payment_status?: string;
  payment_utr?: string;
  is_parcel?: boolean;
  items?: any[];
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

  const itemsListText = booking.items && booking.items.length > 0
    ? booking.items.map((item: any) => `• ${item.name} x${item.quantity}${item.is_parcel ? ' (Parcel)' : ''} — ₹${(item.price + (item.is_parcel ? 5 : 0)) * item.quantity}`).join('\n')
    : `• ${booking.item_name} — ₹${booking.amount}`;

  const whatsappMessage = encodeURIComponent(
    `🍽️ *IIST Cafeteria Order Receipt*\n` +
    `-----------------------------------\n` +
    `*Order ID:* ${booking.booking_id}\n` +
    `*Verification Code:* ${booking.user_code}\n` +
    `*Customer:* ${booking.user_name || 'Guest'}\n` +
    `*Items Ordered:*\n${itemsListText}\n` +
    `*Time Slot:* ${booking.booking_time}\n` +
    `*Amount:* ₹${booking.amount}\n` +
    `*Payment:* ${booking.payment_method || 'Pay at Counter'} (${booking.payment_status || 'Pending'})\n` +
    `-----------------------------------\n` +
    `Please show this message at the counter to collect your meal.`
  );

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
        {/* Notification success banner */}
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium flex items-center gap-3 animate-scale-in">
          <span className="text-lg">📩</span>
          <div className="text-left">
            <p className="font-semibold text-white text-xs md:text-sm">Please Share to Counter</p>
            <p className="text-[10px] md:text-xs text-slate-400">Tap the WhatsApp button below to send your order receipt directly to the counter.</p>
          </div>
        </div>

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
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl transition-all cursor-pointer ${
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
          <div className="space-y-3 text-left">
            {booking.items && booking.items.length > 0 ? (
              <div className="border-b border-[var(--border)] pb-3 mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Ordered Items</p>
                <div className="space-y-2">
                  {booking.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-[var(--surface-elevated)] px-3 py-2 rounded-xl border border-[var(--border)]">
                      <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'veg' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className="font-semibold text-sm text-[var(--text-primary)]">{item.name}</span>
                          <span className="text-xs text-[var(--text-tertiary)]">x{item.quantity}</span>
                        </div>
                        {item.is_parcel && (
                          <span className="text-[10px] text-amber-500 font-medium">📦 Parcel (+₹5)</span>
                        )}
                      </div>
                      <span className="font-bold text-sm text-[var(--text-primary)]">
                        ₹{(item.price + (item.is_parcel ? 5 : 0)) * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] text-sm">Meal</span>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${isVeg ? 'badge-veg' : 'badge-nonveg'}`}>
                      {isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
                    </span>
                    <span className="font-medium text-sm text-[var(--text-primary)]">{booking.item_name}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)] text-sm">Parcel</span>
                  <span className={`badge text-xs font-semibold ${
                    booking.is_parcel
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-[var(--border-light)] text-[var(--text-tertiary)]'
                  }`}>
                    {booking.is_parcel ? '📦 Parcel (+₹5)' : '🍽 Dine-in'}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)] text-sm">Date</span>
              <span className="font-medium text-sm text-[var(--text-primary)]">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)] text-sm">Time</span>
              <span className="font-medium text-sm text-[var(--text-primary)]">{booking.booking_time}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)] text-sm">Payment Method</span>
              <span className="font-medium text-sm capitalize text-[var(--text-primary)]">{booking.payment_method || 'Pay at Counter'}</span>
            </div>
            {booking.payment_utr && booking.payment_utr !== 'UPI' && (
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] text-sm">UTR No.</span>
                <span className="font-mono font-bold text-sm text-amber-500">{booking.payment_utr}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)] text-sm">Payment Status</span>
              <span className={`badge ${booking.payment_status?.includes('Paid') ? 'badge-confirmed bg-emerald-500/10 text-emerald-500' : 'badge-pending bg-amber-500/10 text-amber-500'}`}>
                {booking.payment_status === 'Paid' || booking.payment_status === 'Paid (UPI)' ? '✓ Paid' : '⏳ Pending'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-[var(--border)]">
              <span className="text-[var(--text-secondary)]">Amount</span>
              <span className="text-2xl font-bold gradient-text">₹{booking.amount}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <a
            href={`https://wa.me/919082571606?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.233-1.371a9.994 9.994 0 0 0 4.773 1.216h.004c5.505 0 9.99-4.478 9.99-9.984 0-2.669-1.037-5.176-2.922-7.062A9.925 9.925 0 0 0 12.012 2zm5.726 14.141c-.247.695-1.201 1.27-1.655 1.319-.444.047-.999.073-1.602-.122a7.712 7.712 0 0 1-3.411-2.023c-1.464-1.274-2.39-2.778-2.731-3.268-.341-.489-.565-.856-.565-1.337 0-.48.247-.723.338-.823.091-.1.201-.15.297-.15h.215c.074 0 .167.003.243.176.082.19.282.686.306.736.024.049.039.109.007.172s-.048.1-.097.16c-.048.059-.1.134-.144.18-.049.052-.1.109-.044.204a9.124 9.124 0 0 0 1.666 2.059 7.6 7.6 0 0 0 2.408 1.48c.114.053.181.045.249-.034.068-.078.297-.344.375-.461.078-.117.157-.098.264-.059.109.039.689.324.808.383.118.059.198.088.228.137.031.05.031.288-.067.575z"/>
            </svg>
            Share Receipt to Counter (+91 9082571606)
          </a>
          <Link href="/booking" className="btn btn-primary w-full">
            Book Another Meal
          </Link>
          <Link href="/" className="btn btn-secondary w-full animate-fade-in">
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

