'use client';

import { useEffect, useState, FormEvent } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError, AdminUser } from '@/lib/api-client';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Suspending is ADMIN-only on the backend; hide the control from
  // SUPPORT_ADMIN rather than showing a button that will just 403.
  const canSuspend = user?.role === 'ADMIN';

  function load(params: { q?: string; status?: string } = {}) {
    api.admin
      .users(params)
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load users.'));
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setError(null);
    load({ q, status });
  }

  async function suspend(u: AdminUser) {
    const reason = window.prompt(`Reason for suspending ${u.email}? (optional)`);
    if (reason === null) return; // cancelled
    setBusyId(u.id);
    setError(null);
    try {
      await api.admin.suspendUser(u.id, reason || undefined);
      load({ q, status });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not suspend that user.');
    } finally {
      setBusyId(null);
    }
  }

  async function reactivate(u: AdminUser) {
    setBusyId(u.id);
    setError(null);
    try {
      await api.admin.reactivateUser(u.id);
      load({ q, status });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reactivate that user.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell title="Users">
      <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email"
          className="flex-1 rounded border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
          aria-label="Status"
        >
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="PENDING_VERIFICATION">Pending verification</option>
        </select>
        <Button type="submit">Search</Button>
      </form>

      {error && <p className="mt-4 text-sm text-clay">{error}</p>}
      {users && users.length === 0 && <p className="mt-6 text-sm text-ink/50">No users match.</p>}

      <div className="mt-6 flex flex-col divide-y divide-line">
        {users?.map((u) => (
          <div key={u.id} className="flex flex-col items-start gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="break-words text-sm font-medium">
                {u.firstName} {u.lastName}
              </p>
              <p className="break-all text-xs text-ink/50">
                {u.email} · {u.role} · {u.status}
              </p>
            </div>
            {canSuspend && u.role !== 'ADMIN' && (
              u.status === 'SUSPENDED' ? (
                <Button variant="ghost" loading={busyId === u.id} onClick={() => reactivate(u)}>
                  Reactivate
                </Button>
              ) : (
                <Button variant="ghost" loading={busyId === u.id} onClick={() => suspend(u)}>
                  Suspend
                </Button>
              )
            )}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
