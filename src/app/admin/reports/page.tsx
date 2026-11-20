'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError, AdminReport } from '@/lib/api-client';

function targetLabel(r: AdminReport): string {
  switch (r.targetType) {
    case 'PRODUCT': return `Product ${r.productId?.slice(0, 8)}`;
    case 'SERVICE': return `Service ${r.serviceId?.slice(0, 8)}`;
    case 'REVIEW': return `Review ${r.reviewId?.slice(0, 8)}`;
    case 'USER': return `User ${r.targetUserId?.slice(0, 8)}`;
  }
}

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<AdminReport[] | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  function load() {
    api.admin
      .reports()
      .then(setReports)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load reports.'));
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function resolve(id: string, status: 'RESOLVED' | 'DISMISSED') {
    if (!notes.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.admin.resolveReport(id, status, notes);
      setResolvingId(null);
      setNotes('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update that report.');
    } finally {
      setBusy(false);
    }
  }

  const visible = reports?.filter((r) => showResolved || r.status === 'OPEN' || r.status === 'UNDER_REVIEW');

  return (
    <AdminShell title="Reports">
      <label className="flex items-center gap-2 text-sm text-ink/60">
        <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
        Show resolved and dismissed
      </label>

      {error && <p className="mt-4 text-sm text-clay">{error}</p>}
      {visible && visible.length === 0 && <p className="mt-6 text-sm text-ink/50">Nothing in the queue.</p>}

      <div className="mt-6 flex flex-col gap-4">
        {visible?.map((r) => (
          <div key={r.id} className="rounded border border-line p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {r.reason.replace(/_/g, ' ').toLowerCase()} · {targetLabel(r)}
                </p>
                <p className="mt-0.5 text-xs text-ink/50">
                  {new Date(r.createdAt).toLocaleString()} · {r.status}
                </p>
              </div>
              {r.targetType === 'PRODUCT' && r.productId && (
                <span className="break-all text-xs text-ink/40">id: {r.productId}</span>
              )}
            </div>
            {r.details && <p className="mt-3 whitespace-pre-line text-sm text-ink/70">{r.details}</p>}

            {(r.status === 'OPEN' || r.status === 'UNDER_REVIEW') &&
              (resolvingId === r.id ? (
                <div className="mt-4 flex flex-col gap-2">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Resolution notes (required)"
                    rows={2}
                    className="rounded border border-line px-3 py-2 text-sm outline-none focus:border-indigo"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button loading={busy} onClick={() => resolve(r.id, 'RESOLVED')}>
                      Mark resolved
                    </Button>
                    <Button variant="ghost" loading={busy} onClick={() => resolve(r.id, 'DISMISSED')}>
                      Dismiss
                    </Button>
                    <Button variant="ghost" onClick={() => setResolvingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="ghost" className="mt-4" onClick={() => setResolvingId(r.id)}>
                  Review
                </Button>
              ))}
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-ink/40">
        Taking action on the reported item itself (suspending a listing or user) isn&rsquo;t wired into this page yet —
        use the Users page for accounts. <Link href="/admin/users" className="underline">Go to Users</Link>
      </p>
    </AdminShell>
  );
}
