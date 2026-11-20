'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError, ServiceSummary } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function AvailabilityEditor({ serviceId, onSaved }: { serviceId: string; onSaved: () => void }) {
  const [slots, setSlots] = useState<{ dayOfWeek: number; startTime: string; endTime: string }[]>([
    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateSlot(i: number, field: 'dayOfWeek' | 'startTime' | 'endTime', value: string) {
    setSlots((s) => s.map((slot, idx) => (idx === i ? { ...slot, [field]: field === 'dayOfWeek' ? Number(value) : value } : slot)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await api.sellerServices.setAvailability(serviceId, slots);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save availability.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 rounded border border-line bg-white p-3">
      {slots.map((slot, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <select
            value={slot.dayOfWeek}
            onChange={(e) => updateSlot(i, 'dayOfWeek', e.target.value)}
            className="rounded border border-line px-2 py-1.5"
          >
            {days.map((d, idx) => (
              <option key={d} value={idx}>
                {d}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={slot.startTime}
            onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
            className="rounded border border-line px-2 py-1.5"
          />
          <span className="text-ink/40">–</span>
          <input
            type="time"
            value={slot.endTime}
            onChange={(e) => updateSlot(i, 'endTime', e.target.value)}
            className="rounded border border-line px-2 py-1.5"
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSlots((s) => [...s, { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }])}
          className="text-xs text-indigo underline underline-offset-2"
        >
          + Add another window
        </button>
        <Button variant="ghost" loading={saving} onClick={save}>
          Save availability
        </Button>
      </div>
      {error && <p className="text-sm text-clay">{error}</p>}
    </div>
  );
}

export default function SellerServicesPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [services, setServices] = useState<ServiceSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingAvailabilityFor, setEditingAvailabilityFor] = useState<string | null>(null);

  function load() {
    api.sellerServices
      .mine()
      .then(setServices)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your services.'));
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function toggleStatus(service: ServiceSummary) {
    const nextStatus = service.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
    setBusyId(service.id);
    try {
      await api.sellerServices.updateStatus(service.id, nextStatus);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update that listing.');
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || !user) return null;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-3xl px-6 py-10 lg:px-0">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">Your services</h1>
          <Link href="/seller/services/new">
            <Button variant="secondary">New service</Button>
          </Link>
        </div>

        {error && <p className="mt-4 text-sm text-clay">{error}</p>}
        {services && services.length === 0 && <p className="mt-8 text-sm text-ink/50">No services yet.</p>}

        <div className="mt-6 flex flex-col divide-y divide-line">
          {services?.map((service) => (
            <div key={service.id} className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{service.title}</p>
                  <p className="text-xs text-ink/50">
                    {formatMoney(service.price, service.currency)} · {service.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setEditingAvailabilityFor(editingAvailabilityFor === service.id ? null : service.id)}
                  >
                    Availability
                  </Button>
                  {service.status !== 'SUSPENDED' && (
                    <Button variant="ghost" loading={busyId === service.id} onClick={() => toggleStatus(service)}>
                      {service.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </Button>
                  )}
                </div>
              </div>
              {editingAvailabilityFor === service.id && (
                <AvailabilityEditor serviceId={service.id} onSaved={() => setEditingAvailabilityFor(null)} />
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
