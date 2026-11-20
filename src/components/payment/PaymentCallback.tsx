'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError, PaymentVerification } from '@/lib/api-client';

type State =
  | { phase: 'checking' }
  | { phase: 'done'; result: PaymentVerification }
  | { phase: 'error'; message: string };

const PAID_STATUSES = ['PAID', 'CONFIRMED', 'COMPLETED'];

export function PaymentCallback({ reference }: { reference?: string }) {
  const { user, loading } = useRequireAuth();
  const [state, setState] = useState<State>({ phase: 'checking' });

  useEffect(() => {
    if (!user) return;
    if (!reference) {
      setState({ phase: 'error', message: 'This page needs a payment reference to check.' });
      return;
    }
    api.payments
      .verify(reference)
      .then((result) => setState({ phase: 'done', result }))
      .catch((err) =>
        setState({
          phase: 'error',
          message: err instanceof ApiError ? err.message : 'We could not check your payment just now.',
        }),
      );
  }, [user, reference]);

  if (loading || !user) return null;

  if (state.phase === 'checking') {
    return <p className="text-ink/60">Checking your payment…</p>;
  }

  if (state.phase === 'error') {
    return (
      <>
        <h1 className="font-display text-2xl">We couldn&rsquo;t confirm your payment</h1>
        <p className="mt-3 text-sm text-clay">{state.message}</p>
        <p className="mt-3 text-sm text-ink/60">
          If you were charged, don&rsquo;t pay again — it can take a few minutes to show up. Check your orders and
          bookings, or come back to this page in a moment.
        </p>
        <div className="mt-6 flex justify-center gap-4 text-sm">
          <Link href="/orders" className="text-indigo underline underline-offset-2">Orders</Link>
          <Link href="/bookings" className="text-indigo underline underline-offset-2">Bookings</Link>
        </div>
      </>
    );
  }

  const { kind, id, status } = state.result;
  const paid = PAID_STATUSES.includes(status);
  const detailHref = kind === 'order' ? `/orders/${id}` : `/bookings/${id}`;

  return (
    <>
      <h1 className="font-display text-3xl">{paid ? 'Payment received' : 'Payment not completed'}</h1>
      <p className="mt-3 text-sm text-ink/60">
        {paid
          ? `Thanks — your ${kind} is confirmed.`
          : `We haven't seen a completed payment for this ${kind} yet. If you just paid, it can take a moment to confirm.`}
      </p>
      <Link href={detailHref} className="mt-6 inline-block text-sm text-indigo underline underline-offset-2">
        View your {kind}
      </Link>
    </>
  );
}
