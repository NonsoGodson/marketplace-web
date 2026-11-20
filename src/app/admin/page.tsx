'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError, AdminAnalytics } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

function Stat({ label, value, href, highlight }: { label: string; value: string | number; href?: string; highlight?: boolean }) {
  const body = (
    <div className={`rounded border p-4 ${highlight ? 'border-marigold/50 bg-marigold/10' : 'border-line'}`}>
      <p className="break-words text-xl font-semibold text-indigo sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-ink/50">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.admin
      .analytics()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load analytics.'));
  }, [user]);

  return (
    <AdminShell title="Overview">
      {error && <p className="text-sm text-clay">{error}</p>}
      {!data && !error && <p className="text-sm text-ink/50">Loading…</p>}

      {data && (
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="mb-3 text-sm font-medium text-ink/60">Needs attention</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Seller applications" value={data.sellers.pendingApplications} href="/admin/sellers" highlight={data.sellers.pendingApplications > 0} />
              <Stat label="Open reports" value={data.trustAndSafety.openReports} href="/admin/reports" highlight={data.trustAndSafety.openReports > 0} />
              <Stat label="Open disputes" value={data.trustAndSafety.openDisputes} href="/admin/disputes" highlight={data.trustAndSafety.openDisputes > 0} />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium text-ink/60">Marketplace</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Total users" value={data.users.total} />
              <Stat label={`New (last ${data.users.periodDays}d)`} value={data.users.newInPeriod} />
              <Stat label="Active sellers" value={data.sellers.active} />
              <Stat label="Published listings" value={data.listings.publishedProducts + data.listings.publishedServices} />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-medium text-ink/60">Money</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Gross transaction value" value={formatMoney(data.transactions.grossTransactionValue, 'NGN')} />
              <Stat label="Platform revenue" value={formatMoney(data.transactions.platformRevenue, 'NGN')} />
              <Stat label="Seller payouts" value={formatMoney(data.transactions.sellerPayouts, 'NGN')} />
              <Stat label="Orders" value={data.transactions.totalOrders} />
              <Stat label="Bookings" value={data.transactions.totalBookings} />
              <Stat label="Refunds issued" value={data.trustAndSafety.refundedOrders + data.trustAndSafety.refundedBookings} />
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
