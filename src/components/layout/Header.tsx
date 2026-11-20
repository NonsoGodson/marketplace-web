'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { user, logout, loading } = useAuth();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPPORT_ADMIN';
  const closeMenu = () => setMenuOpen(false);

  // Links shown in the phone menu (on wider screens they sit in the header bar).
  const menuLinks = [
    { href: '/products', label: 'Products' },
    { href: '/services', label: 'Services' },
    ...(user
      ? [
          isAdmin
            ? { href: '/admin', label: 'Admin' }
            : { href: user.role === 'BUYER' ? '/sell' : '/seller/dashboard', label: 'Sell' },
          { href: '/orders', label: 'Orders' },
          { href: '/bookings', label: 'Bookings' },
          { href: '/messages', label: 'Messages' },
        ]
      : []),
  ];

  return (
    <header className="relative border-b border-line">
      <div className="flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-lg italic text-indigo sm:text-xl">
            Naija MarketHub
          </Link>
          <nav className="hidden gap-5 text-sm text-ink/70 sm:flex">
            <Link href="/products" className="hover:text-ink">
              Products
            </Link>
            <Link href="/services" className="hover:text-ink">
              Services
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <Link href="/cart" className="relative rounded p-2 text-ink/70 hover:text-indigo" aria-label="Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-marigold text-[10px] font-semibold text-ink">
                  {itemCount}
                </span>
              )}
            </Link>
          )}

          {/* Wider screens: everything in the bar. */}
          <div className="hidden items-center gap-3 sm:flex">
            {loading ? null : user ? (
              <>
                {isAdmin ? (
                  <Link href="/admin" className="text-sm font-medium text-indigo hover:underline">
                    Admin
                  </Link>
                ) : (
                  <Link
                    href={user.role === 'BUYER' ? '/sell' : '/seller/dashboard'}
                    className="text-sm text-ink/70 hover:text-indigo"
                  >
                    Sell
                  </Link>
                )}
                <Link href="/orders" className="text-sm text-ink/70 hover:text-indigo">
                  Orders
                </Link>
                <Link href="/bookings" className="text-sm text-ink/70 hover:text-indigo">
                  Bookings
                </Link>
                <Link href="/messages" className="text-sm text-ink/70 hover:text-indigo">
                  Messages
                </Link>
                <span className="text-sm text-ink/60">{user.email}</span>
                <Button variant="ghost" onClick={logout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary">Sign up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Phones: one menu button instead of a crowded bar. */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="rounded p-2 text-ink/70 hover:text-indigo sm:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav aria-label="Menu" className="flex flex-col gap-1 border-t border-line px-6 py-3 text-sm sm:hidden">
          {menuLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMenu}
              className="rounded px-2 py-3 text-ink/80 hover:bg-white hover:text-indigo"
            >
              {link.label}
            </Link>
          ))}
          {loading ? null : user ? (
            <div className="mt-2 flex flex-col items-start gap-2 border-t border-line px-2 pt-3">
              <span className="break-all text-xs text-ink/50">{user.email}</span>
              <Button
                variant="ghost"
                onClick={() => {
                  closeMenu();
                  logout();
                }}
              >
                Log out
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex gap-2 border-t border-line px-2 pt-3">
              <Link href="/login" onClick={closeMenu}>
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/register" onClick={closeMenu}>
                <Button variant="primary">Sign up</Button>
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
