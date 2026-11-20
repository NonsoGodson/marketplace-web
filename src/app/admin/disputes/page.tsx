'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError, AdminDispute } from '@/lib/api-client';

export default function AdminDisputesPage() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<AdminDispute[] | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [busy, setBusy] = useState(false);

  // Resolving a dispute can issue a refund, which the backend restricts to
  // full ADMIN — SUPPORT_ADMIN can read the queue but not rule on it.
  const canResolve = user?.role === 'ADMIN';

  function load() {
    api.admin
      .disputes()
      .then(setDisputes)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load disputes.'));
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function resolve(id: string, status: 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'CLOSED') {
    if (!notes.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.admin.resolveDispute(id, {
        status,
        resolutionNotes: notes,
        // Blank = full refund on the backend; only sent for a buyer ruling.
        refundAmount: status === 'RESOLVED_BUYER' && refundAmount ? Number(refundAmount) : undefined,
      });
      setResolvingId(null);
      setNotes('');
      setRefundAmount('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resolve that dispute.');
    } finally {
      setBusy(false);
    }
  }

  const visible = disputes?.filter((d) => showResolved || d.status === 'OPEN' || d.status === 'UNDER_REVIEW');

  return (
    <AdminShell title="Disputes">
      <label className="flex items-center gap-2 text-sm text-ink/60">
        <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
        Show resolved and closed
      </label>

      {error && <p className="mt-4 text-sm text-clay">{error}</p>}
      {visible && visible.length === 0 && <p className="mt-6 text-sm text-ink/50">No open disputes.</p>}

      <div className="mt-6 flex flex-col gap-4">
        {visible?.map((d) => (
          <div key={d.id} className="rounded border border-line p-4">
            <p className="text-sm font-medium">
              {d.reason.replace(/_/g, ' ').toLowerCase()} ·{' '}
              {d.orderId ? `Order ${d.orderId.slice(0, 8)}` : `Booking ${d.bookingId?.slice(0, 8)}`}
            </p>
            <p className="mt-0.5 text-xs text-ink/50">
              {new Date(d.createdAt).toLocaleString()} · {d.status}
              {d.refundAmount ? ` · refunded ${d.refundAmount}` : ''}
            </p>
            <p className="mt-3 whitespace-pre-line text-sm text-ink/70">{d.description}</p>

            {canResolve &&
              (d.status === 'OPEN' || d.status === 'UNDER_REVIEW') &&
              (resolvingId === d.id ? (
                <div className="mt-4 flex flex-col gap-2">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Resolution notes (required)"
                    rows={2}
                    className="rounded border border-line px-3 py-2 text-sm outline-none focus:border-indigo"
                  />
                  <input
                    type="number"
                    min="0"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Refund amount — leave blank for a full refund"
                    className="rounded border border-line px-3 py-2 text-sm outline-none focus:border-indigo"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button loading={busy} onClick={() => resolve(d.id, 'RESOLVED_BUYER')}>
                      Rule for buyer (refund)
                    </Button>
                    <Button variant="ghost" loading={busy} onClick={() => resolve(d.id, 'RESOLVED_SELLER')}>
                      Rule for seller
                    </Button>
                    <Button variant="ghost" loading={busy} onClick={() => resolve(d.id, 'CLOSED')}>
                      Close without ruling
                    </Button>
                    <Button variant="ghost" onClick={() => setResolvingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" className="mt-4" onClick={() => setResolvingId(d.id)}>
                  Review
                </Button>
              ))}
          </div>
        ))}
      </div>

      {!canResolve && (
        <p className="mt-6 text-xs text-ink/40">Only a full admin can rule on disputes, since a ruling can issue a refund.</p>
      )}
    </AdminShell>
  );
}
