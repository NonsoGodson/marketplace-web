'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { CheckPaymentButton } from '@/components/payment/CheckPaymentButton';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError, Order } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

const statusLabel: Record<Order['status'], string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAID: 'Paid',
  PARTIALLY_FULFILLED: 'Partially fulfilled',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useRequireAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    api.orders
      .getOne(params.id)
      .then(setOrder)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load this order.'));
  }, [user, params.id, reloadKey]);

  if (authLoading || !user) return null;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-10 lg:px-0">
        <h1 className="font-display text-3xl">Order confirmation</h1>

        {error && <p className="mt-6 text-sm text-clay">{error}</p>}
        {!order && !error && <p className="mt-6 text-sm text-ink/50">Loading…</p>}

        {order && (
          <>
            <p className="mt-2 text-sm text-ink/60">Order #{order.id.slice(0, 8)}</p>

            <div className="mt-6 rounded border border-line p-4">
              <p className="text-sm font-medium">Status: {statusLabel[order.status]}</p>
              <p className="mt-1 text-sm text-ink/60">
                Total: {formatMoney(order.totalAmount, order.currency)}
              </p>
            </div>

            {order.status === 'PENDING_PAYMENT' && (
              <div className="mt-4 rounded border border-marigold/40 bg-marigold/10 p-4 text-sm text-ink/80">
                <p className="font-medium">Waiting for payment.</p>
                <p className="mt-1">
                  If you&rsquo;ve just paid, it can take a moment to confirm. If you left before finishing, this
                  order isn&rsquo;t complete yet.
                </p>
                {order.payment?.externalPaymentId && (
                  <CheckPaymentButton
                    reference={order.payment.externalPaymentId}
                    onChecked={() => setReloadKey((k) => k + 1)}
                  />
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-4">
              {order.sellerOrders.map((so) => (
                <div key={so.id} className="border-t border-line pt-4">
                  <p className="text-sm font-medium text-ink/70">
                    {so.store?.businessName ?? 'Seller'} · {so.status}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1 text-sm text-ink/70">
                    {so.items.map((item) => (
                      <li key={item.id} className="flex justify-between">
                        <span>
                          {item.titleSnapshot} × {item.quantity}
                        </span>
                        <span>{formatMoney(item.lineTotal, order.currency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Link href="/orders" className="mt-8 inline-block text-sm text-indigo underline underline-offset-2">
              View all orders
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
