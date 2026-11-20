'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError, Order } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

export default function OrdersPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.orders
      .mine()
      .then(setOrders)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your orders.'));
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-10 lg:px-0">
        <h1 className="font-display text-3xl">Your orders</h1>

        {error && <p className="mt-6 text-sm text-clay">{error}</p>}
        {!orders && !error && <p className="mt-6 text-sm text-ink/50">Loading…</p>}
        {orders && orders.length === 0 && <p className="mt-6 text-sm text-ink/50">No orders yet.</p>}

        <div className="mt-6 flex flex-col divide-y divide-line">
          {orders?.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between py-4 hover:text-indigo"
            >
              <div>
                <p className="text-sm font-medium">Order #{order.id.slice(0, 8)}</p>
                <p className="text-xs text-ink/50">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatMoney(order.totalAmount, order.currency)}</p>
                <p className="text-xs text-ink/50">{order.status}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
