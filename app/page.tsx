'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isTokenExpired, clearClientSession } from '@/lib/clientAuth';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      if (isTokenExpired(token)) {
        clearClientSession();
        setIsLoggedIn(false);
        setUserName('');
      } else {
        setIsLoggedIn(true);
        try {
          setUserName(JSON.parse(user).name);
        } catch { /* ignore */ }
      }
    } else {
      setIsLoggedIn(false);
      setUserName('');
    }
  }, []);

  const handleLogout = () => {
    clearClientSession();
    setIsLoggedIn(false);
    setUserName('');
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-lg font-bold text-slate-900">
            🍽
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
              IIST Cafeteria
            </h1>
            <p className="text-slate-400 text-xs">Trivandrum</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/menu" className="btn btn-ghost text-slate-300 btn-sm hidden sm:inline-flex">
            Menu
          </Link>
          {isLoggedIn ? (
            <>
              <span className="text-slate-300 text-sm hidden md:block">Welcome, {userName}</span>
              <Link href="/booking" className="btn btn-primary btn-sm">
                Book Meal
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost text-slate-300 btn-sm cursor-pointer">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost text-slate-300 btn-sm">
                Sign In
              </Link>
              <Link href="/guest" className="btn btn-primary btn-sm">
                Guest Booking
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 md:py-0">
        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 text-sm font-medium">Now serving 200+ students daily</span>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Book Your Meal,
            <br />
            <span className="gradient-text">Skip The Queue</span>
          </h2>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Pre-order your lunch and dinner at IIST Cafeteria. Veg or Non-Veg — get your unique QR code and walk straight to the counter.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href={isLoggedIn ? '/booking' : '/login'}
              className="btn btn-primary btn-lg w-full sm:w-auto animate-pulse-glow"
              id="hero-book-meal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Book Your Meal
            </Link>
            <Link
              href="/menu"
              className="btn btn-secondary btn-lg w-full sm:w-auto border-amber-600/50 text-amber-400 hover:bg-amber-900/20"
              id="hero-menu"
            >
              🍽 View Full Menu
            </Link>
            <Link
              href="/guest"
              className="btn btn-secondary btn-lg w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-800"
              id="hero-guest"
            >
              Continue as Guest
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm text-left hover:bg-white/8 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-2xl mb-4">
                🥗
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Veg & Non-Veg</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Choose from Paneer Biryani, Chicken Biryani, Fish Curry, and more. Updated daily.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm text-left hover:bg-white/8 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-2xl mb-4">
                📱
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">QR Verification</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Get a unique QR code and verification number. Show at counter — no waiting in line.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm text-left hover:bg-white/8 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center text-2xl mb-4">
                ⚡
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Instant Booking</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Book in under 30 seconds. Pick your meal, pick your slot, done. Zero paperwork.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 px-6 border-t border-white/5">
        <p className="text-slate-500 text-xs">
          © {new Date().getFullYear()} IIST Trivandrum Cafeteria • Built with ❤️
        </p>
        <div className="flex items-center justify-center gap-6 mt-3">
          <Link href="/admin/portal" className="text-slate-500 text-xs hover:text-slate-300 transition-colors">
            Admin Portal
          </Link>
          <Link href="/admin/counter" className="text-slate-500 text-xs hover:text-slate-300 transition-colors">
            Counter Staff
          </Link>
        </div>
      </footer>
    </div>
  );
}
