'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { CheckPaymentButton } from '@/components/payment/CheckPaymentButton';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError, Booking } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

const statusLabel: Record<Booking['status'], string> = {
  PENDING: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useRequireAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  function load() {
    api.bookings
      .mine()
      .then((all) => setBooking(all.find((b) => b.id === params.id) ?? null))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load this booking.'));
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleCancel() {
    setCancelling(true);
    try {
      await api.bookings.updateStatus(params.id, 'CANCELLED');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not cancel this booking.');
    } finally {
      setCancelling(false);
    }
  }

  if (authLoading || !user) return null;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-10 lg:px-0">
        <h1 className="font-display text-3xl">Booking confirmation</h1>

        {error && <p className="mt-6 text-sm text-clay">{error}</p>}
        {!booking && !error && <p className="mt-6 text-sm text-ink/50">Loading…</p>}

        {booking && (
          <>
            <p className="mt-2 text-sm text-ink/60">{booking.service?.title ?? 'Service'}</p>

            <div className="mt-6 rounded border border-line p-4">
              <p className="text-sm font-medium">Status: {statusLabel[booking.status]}</p>
              <p className="mt-1 text-sm text-ink/60">
                {new Date(booking.scheduledStart).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
              </p>
              <p className="mt-1 text-sm text-ink/60">Price: {formatMoney(booking.priceSnapshot, 'NGN')}</p>
              {booking.customerNotes && (
                <p className="mt-2 text-sm text-ink/60">Notes: {booking.customerNotes}</p>
              )}
            </div>

            {booking.status === 'PENDING' && (
              <div className="mt-4 rounded border border-marigold/40 bg-marigold/10 p-4 text-sm text-ink/80">
                <p className="font-medium">Waiting for payment.</p>
                <p className="mt-1">
                  If you&rsquo;ve just paid, it can take a moment to confirm. The time slot is held for you until
                  the booking is paid or cancelled.
                </p>
                {booking.payment?.externalPaymentId && (
                  <CheckPaymentButton reference={booking.payment.externalPaymentId} onChecked={load} />
                )}
              </div>
            )}

            {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
              <Button variant="ghost" onClick={handleCancel} loading={cancelling} className="mt-6">
                Cancel booking
              </Button>
            )}

            <div>
              <Link href="/bookings" className="mt-8 inline-block text-sm text-indigo underline underline-offset-2">
                View all bookings
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
