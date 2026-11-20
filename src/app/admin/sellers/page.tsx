'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError, PendingStore } from '@/lib/api-client';

export default function AdminSellersPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<PendingStore[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  function load() {
    api.admin
      .pendingSellers()
      .then(setStores)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load applications.'));
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api.admin.approveSeller(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not approve that application.');
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!reason.trim()) return;
    setBusyId(id);
    setError(null);
    try {
      await api.admin.rejectSeller(id, reason);
      setRejectingId(null);
      setReason('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reject that application.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell title="Seller applications">
      {error && <p className="mb-4 text-sm text-clay">{error}</p>}
      {stores && stores.length === 0 && <p className="text-sm text-ink/50">No applications waiting for review.</p>}

      <div className="flex flex-col gap-4">
        {stores?.map((store) => (
          <div key={store.id} className="rounded border border-line p-4">
            <p className="break-words font-medium">{store.businessName}</p>
            <p className="mt-1 break-all text-xs text-ink/50">
              {store.contactEmail}
              {store.contactPhone ? ` · ${store.contactPhone}` : ''}
              {store.country ? ` · ${store.country}` : ''}
            </p>
            {store.description && <p className="mt-3 whitespace-pre-line text-sm text-ink/70">{store.description}</p>}

            {rejectingId === store.id ? (
              <div className="mt-4 flex flex-col gap-2">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason shown to the applicant"
                  rows={2}
                  className="rounded border border-line px-3 py-2 text-sm outline-none focus:border-indigo"
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" loading={busyId === store.id} onClick={() => reject(store.id)}>
                    Confirm rejection
                  </Button>
                  <Button variant="ghost" onClick={() => setRejectingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button loading={busyId === store.id} onClick={() => approve(store.id)}>
                  Approve
                </Button>
                <Button variant="ghost" onClick={() => setRejectingId(store.id)}>
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
