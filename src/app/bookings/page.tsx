'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError, Booking } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

export default function BookingsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.bookings
      .mine()
      .then(setBookings)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your bookings.'));
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-10 lg:px-0">
        <h1 className="font-display text-3xl">Your bookings</h1>

        {error && <p className="mt-6 text-sm text-clay">{error}</p>}
        {!bookings && !error && <p className="mt-6 text-sm text-ink/50">Loading…</p>}
        {bookings && bookings.length === 0 && <p className="mt-6 text-sm text-ink/50">No bookings yet.</p>}

        <div className="mt-6 flex flex-col divide-y divide-line">
          {bookings?.map((booking) => (
            <Link
              key={booking.id}
              href={`/bookings/${booking.id}`}
              className="flex items-center justify-between py-4 hover:text-indigo"
            >
              <div>
                <p className="text-sm font-medium">{booking.service?.title ?? 'Service'}</p>
                <p className="text-xs text-ink/50">
                  {new Date(booking.scheduledStart).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatMoney(booking.priceSnapshot, 'NGN')}</p>
                <p className="text-xs text-ink/50">{booking.status}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
