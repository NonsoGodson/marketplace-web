'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError, ServiceDetail } from '@/lib/api-client';

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BookingWidget({ service }: { service: ServiceDetail }) {
  const router = useRouter();
  const { user } = useAuth();
  const [date, setDate] = useState(todayISODate());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  // Client-side only: generates candidate slots from the weekly availability
  // windows. It has NO visibility into which slots are already booked —
  // there's no public "existing bookings for this service" endpoint — so a
  // slot that looks open here can still be rejected at submit time if
  // someone else took it first. See README for why that's the case.
  const slots = useMemo(() => {
    const selectedDate = new Date(`${date}T00:00:00`);
    const dayOfWeek = selectedDate.getDay();
    const windows = service.availability.filter((w) => w.dayOfWeek === dayOfWeek);
    const result: string[] = [];
    for (const w of windows) {
      const start = toMinutes(w.startTime);
      const end = toMinutes(w.endTime);
      for (let t = start; t + service.durationMinutes <= end; t += service.durationMinutes) {
        result.push(toHHMM(t));
      }
    }
    return result;
  }, [date, service.availability, service.durationMinutes]);

  async function handleConfirm() {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!selectedSlot) return;

    setSubmitting(true);
    setError(null);
    try {
      const scheduledStart = new Date(`${date}T${selectedSlot}:00`).toISOString();
      const result = await api.bookings.create({ serviceId: service.id, scheduledStart, customerNotes: notes || undefined });
      setBooked(true);
      window.location.assign(result.authorizationUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the booking. Try a different time.');
      setSelectedSlot(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (service.availability.length === 0) {
    return (
      <p className="mt-8 rounded border border-line p-4 text-sm text-ink/60">
        This seller hasn&rsquo;t set their availability yet, so booking isn&rsquo;t open. Check back later.
      </p>
    );
  }

  return (
    <div className="mt-8 rounded border border-line p-4">
      <label className="text-sm font-medium text-ink/80" htmlFor="booking-date">
        Choose a date
      </label>
      <input
        id="booking-date"
        type="date"
        min={todayISODate()}
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          setSelectedSlot(null);
        }}
        className="mt-1.5 block rounded border border-line px-3 py-2 text-sm"
      />

      <div className="mt-4">
        {slots.length === 0 ? (
          <p className="text-sm text-ink/50">No availability on this day — try another date.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`rounded border px-3 py-1.5 text-sm transition-colors ${
                  selectedSlot === slot ? 'border-jade bg-jade text-paper' : 'border-line text-ink/70 hover:border-jade'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSlot && (
        <div className="mt-4 flex flex-col gap-3">
          <Textarea
            label="Anything the seller should know? (optional)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {error && <p className="text-sm text-clay">{error}</p>}
          <Button onClick={handleConfirm} loading={submitting} disabled={booked} className="w-full sm:w-auto">
            Confirm booking for {date} at {selectedSlot}
          </Button>
        </div>
      )}
    </div>
  );
}
