'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError, DashboardSummary } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

export default function SellerDashboardPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.sellers
      .getDashboardSummary()
      .then(setSummary)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setError('not_onboarded');
        else setError(err instanceof ApiError ? err.message : 'Could not load your dashboard.');
      });
  }, [user]);

  if (authLoading || !user) return null;

  if (error === 'not_onboarded') {
    return (
      <main>
        <Header />
        <section className="mx-auto max-w-md px-6 py-16 text-center lg:px-0">
          <p className="text-ink/60">You haven&rsquo;t started seller onboarding yet.</p>
          <Link href="/sell">
            <Button className="mt-4">Start selling</Button>
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-3xl px-6 py-10 lg:px-0">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">{summary?.store.businessName ?? 'Your store'}</h1>
          <div className="flex gap-2">
            <Link href="/seller/products/new">
              <Button variant="secondary">New product</Button>
            </Link>
            <Link href="/seller/services/new">
              <Button variant="ghost">New service</Button>
            </Link>
          </div>
        </div>

        {error && error !== 'not_onboarded' && <p className="mt-4 text-sm text-clay">{error}</p>}

        {summary && (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Published products', value: summary.catalog.publishedProducts },
                { label: 'Published services', value: summary.catalog.publishedServices },
                { label: 'Total orders', value: summary.orders.total },
                { label: 'Total bookings', value: summary.bookings.total },
              ].map((stat) => (
                <div key={stat.label} className="rounded border border-line p-4">
                  <p className="text-2xl font-semibold text-indigo">{stat.value}</p>
                  <p className="mt-1 text-xs text-ink/50">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded border border-jade/30 bg-jade/5 p-4">
                <p className="text-lg font-semibold text-jade">{formatMoney(summary.earnings.available, 'NGN')}</p>
                <p className="mt-1 text-xs text-ink/50">Available earnings</p>
              </div>
              <div className="rounded border border-line p-4">
                <p className="text-lg font-semibold">{formatMoney(summary.earnings.pending, 'NGN')}</p>
                <p className="mt-1 text-xs text-ink/50">Pending earnings</p>
              </div>
            </div>

            <div className="mt-8 flex gap-6 text-sm">
              <Link href="/seller/products" className="text-indigo underline underline-offset-2">
                Manage products
              </Link>
              <Link href="/seller/services" className="text-indigo underline underline-offset-2">
                Manage services
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
