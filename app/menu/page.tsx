'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { isTokenExpired, clearClientSession } from '@/lib/clientAuth';

// ── Real IIST Cafeteria Menu ──────────────────────────────────────────────────
const VEG_ITEMS = [
  { name: 'Paneer Rice',          price: 90,  desc: 'Fragrant rice cooked with paneer and spices' },
  { name: 'Paneer Noodles',       price: 85,  desc: 'Wok-tossed noodles with paneer and vegetables' },
  { name: 'Gobi Rice',            price: 80,  desc: 'Spiced cauliflower fried rice' },
  { name: 'Jeera Rice',           price: 55,  desc: 'Basmati rice tempered with cumin' },
  { name: 'Tomato Rice',          price: 55,  desc: 'Tangy south-Indian style tomato rice' },
  { name: 'Veg Noodles',          price: 50,  desc: 'Stir-fried noodles with garden vegetables' },
  { name: 'Veg Rice',             price: 50,  desc: 'Simple steamed rice with mixed veg stir-fry' },
  { name: 'Paneer Kothuparota',   price: 90,  desc: 'Shredded parota chopped with paneer and masala' },
  { name: 'Dal Kichadi',          price: 70,  desc: 'Comforting lentil and rice porridge with ghee' },
  { name: 'Dal Fry',              price: 65,  desc: 'Yellow lentils tempered with garlic and cumin' },
  { name: 'Dal Tadka',            price: 70,  desc: 'Creamy lentils finished with a smoky tadka' },
  { name: 'Parota',               price: 8,   desc: 'Flaky layered flatbread (per piece)' },
  { name: 'Paneer Butter Masala', price: 90,  desc: 'Paneer in rich tomato-butter gravy' },
  { name: 'Chilly Paneer',        price: 90,  desc: 'Indo-Chinese crispy paneer in chilli sauce' },
  { name: 'Kadai Paneer',         price: 85,  desc: 'Paneer cooked with bell peppers in kadai masala' },
  { name: 'Gobi Manchurian',      price: 80,  desc: 'Crispy cauliflower florets in Manchurian sauce' },
  { name: 'Tomato Fry',           price: 60,  desc: 'Tangy dry-fried tomato side dish' },
  { name: 'Veg Momos',            price: 90,  desc: 'Steamed vegetable dumplings with spicy dip' },
];

const NONVEG_ITEMS = [
  { name: 'Chicken Rice',                   price: 90,  desc: 'Flavourful rice cooked with tender chicken pieces' },
  { name: 'Egg Rice',                        price: 60,  desc: 'Fried rice scrambled with eggs and spices' },
  { name: 'Chicken Noodles',                 price: 80,  desc: 'Stir-fried noodles with shredded chicken' },
  { name: 'Egg Noodles',                     price: 60,  desc: 'Noodles tossed with egg and soy sauce' },
  { name: 'Kothuparota',                     price: 90,  desc: 'Shredded parota chopped with egg, chicken and masala' },
  { name: 'Egg Burji',                       price: 50,  desc: 'Spiced scrambled eggs with onion and tomato' },
  { name: 'Double Omlet',                    price: 30,  desc: 'Two-egg omelette with masala filling' },
  { name: 'Bread Omlet',                     price: 35,  desc: 'Fluffy omelette served with toasted bread' },
  { name: 'Chicken Pasta',                   price: 90,  desc: 'Pasta tossed with chicken in a spiced sauce' },
  { name: 'Chicken 65',                      price: 90,  desc: 'Deep-fried spicy chicken 65 — classic Hyderabadi style' },
  { name: 'Chicken Curry',                   price: 90,  desc: 'Home-style chicken in thick onion-tomato gravy' },
  { name: 'Garlic Chicken',                  price: 90,  desc: 'Sautéed chicken with garlic and black pepper' },
  { name: 'Pepper Chicken',                  price: 90,  desc: 'Dry-roasted chicken with cracked black pepper' },
  { name: 'Butter Chicken',                  price: 90,  desc: 'Creamy tomato-butter chicken curry' },
  { name: 'Kadai Chicken',                   price: 90,  desc: 'Chicken with bell peppers in kadai masala' },
  { name: 'Chilly Chicken',                  price: 80,  desc: 'Indo-Chinese crispy chicken in chilli sauce' },
  { name: 'Chicken Cheese Garlic Fingers',   price: 100, desc: 'Cheesy garlic chicken fingers — house special' },
];

type Tab = 'all' | 'veg' | 'nonveg';

export default function MenuPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
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

  const filterItems = (items: typeof VEG_ITEMS) =>
    items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  const showVeg    = tab === 'all' || tab === 'veg';
  const showNonveg = tab === 'all' || tab === 'nonveg';

  const filteredVeg    = showVeg    ? filterItems(VEG_ITEMS)    : [];
  const filteredNonveg = showNonveg ? filterItems(NONVEG_ITEMS) : [];
  const totalShown     = filteredVeg.length + filteredNonveg.length;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
              </svg>
            </Link>
            <div>
              <h1 className="font-extrabold text-lg leading-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Our Menu
              </h1>
              <p className="text-[var(--text-tertiary)] text-xs">{totalShown} items available</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <span className="text-slate-300 text-sm hidden md:block">Welcome, {userName}</span>
                <button onClick={handleLogout} className="btn btn-ghost text-slate-300 btn-sm cursor-pointer">
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" className="btn btn-ghost text-slate-300 btn-sm">
                Sign In
              </Link>
            )}
            <Link href="/booking" className="btn btn-primary btn-sm">
              Book Now →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* ── Hero strip ────────────────────────────────────────────────────── */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 mb-6 text-slate-900 animate-fade-in">
          <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70">IIST Trivandrum</p>
          <h2 className="text-2xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            Cafeteria Menu
          </h2>
          <p className="text-sm opacity-80">Fresh daily · Veg &amp; Non-Veg · Parcel +₹5</p>
        </div>

        {/* ── Search ────────────────────────────────────────────────────────── */}
        <div className="relative mb-4">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            className="input input-mobile pl-10"
            placeholder="Search dishes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="menu-search"
          />
        </div>

        {/* ── Filter tabs ───────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(['all', 'veg', 'nonveg'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`btn btn-sm flex-shrink-0 transition-all ${
                tab === t ? 'btn-primary' : 'btn-ghost border border-[var(--border)]'
              }`}
            >
              {t === 'all' ? '🍽 All' : t === 'veg' ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'}
            </button>
          ))}
        </div>

        {/* ── Veg Section ───────────────────────────────────────────────────── */}
        {filteredVeg.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
              <h2 className="font-bold text-base text-emerald-600 dark:text-emerald-400 uppercase tracking-wide" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Vegetarian
              </h2>
              <span className="text-xs text-[var(--text-tertiary)]">({filteredVeg.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
              {filteredVeg.map((item) => (
                <MenuCard key={item.name} item={item} type="veg" />
              ))}
            </div>
          </section>
        )}

        {/* ── Non-Veg Section ───────────────────────────────────────────────── */}
        {filteredNonveg.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
              <h2 className="font-bold text-base text-red-600 dark:text-red-400 uppercase tracking-wide" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                Non-Vegetarian
              </h2>
              <span className="text-xs text-[var(--text-tertiary)]">({filteredNonveg.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
              {filteredNonveg.map((item) => (
                <MenuCard key={item.name} item={item} type="nonveg" />
              ))}
            </div>
          </section>
        )}

        {totalShown === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold text-[var(--text-secondary)]">No dishes found</p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">Try a different search term</p>
          </div>
        )}

        {/* ── Footer note ───────────────────────────────────────────────────── */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-center">
          <p className="text-amber-700 dark:text-amber-400 text-sm font-medium">
            📦 Parcel / Takeaway? Add just <strong>₹5</strong> per dish when booking.
          </p>
        </div>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <div className="mt-6 mb-4">
          <Link href="/booking" className="btn btn-primary btn-xl w-full animate-pulse-glow">
            Book a Meal Now →
          </Link>
        </div>
      </main>
    </div>
  );
}

// ── Menu Card component ───────────────────────────────────────────────────────
function MenuCard({
  item,
  type,
}: {
  item: { name: string; price: number; desc: string };
  type: 'veg' | 'nonveg';
}) {
  const isVeg = type === 'veg';
  return (
    <div className={`flex items-start justify-between p-4 rounded-2xl border-2 transition-all hover:-translate-y-0.5 hover:shadow-md ${
      isVeg
        ? 'border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-900/10'
        : 'border-red-100 dark:border-red-900/40 bg-red-50/40 dark:bg-red-900/10'
    }`}>
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`w-2.5 h-2.5 rounded-sm border-2 flex-shrink-0 ${isVeg ? 'border-emerald-600' : 'border-red-600'}`}>
            <span className={`block w-1 h-1 rounded-full mx-auto mt-0.5 ${isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
          </span>
          <p className="font-bold text-sm text-[var(--text-primary)] truncate">{item.name}</p>
        </div>
        <p className="text-[var(--text-tertiary)] text-xs leading-relaxed line-clamp-2">{item.desc}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className={`text-lg font-extrabold ${isVeg ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
          ₹{item.price}
        </p>
      </div>
    </div>
  );
}
