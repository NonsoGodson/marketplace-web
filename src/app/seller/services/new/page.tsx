'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { CategorySelect } from '@/components/seller/CategorySelect';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError } from '@/lib/api-client';

const emptyForm = {
  categoryId: '',
  title: '',
  description: '',
  pricingModel: 'FIXED' as 'FIXED' | 'HOURLY' | 'PER_SESSION',
  price: '',
  locationType: 'IN_PERSON' as 'ONLINE' | 'IN_PERSON' | 'BOTH',
  location: '',
  durationMinutes: '60',
  cancellationPolicy: '',
};

export default function NewServicePage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.sellerServices.create({
        categoryId: form.categoryId,
        title: form.title,
        description: form.description,
        pricingModel: form.pricingModel,
        price: Number(form.price),
        locationType: form.locationType,
        location: form.locationType !== 'ONLINE' ? form.location : undefined,
        durationMinutes: Number(form.durationMinutes),
        cancellationPolicy: form.cancellationPolicy || undefined,
      });
      router.push('/seller/services');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the listing.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) return null;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-md px-6 py-10 lg:px-0">
        <h1 className="font-display text-3xl">New service</h1>
        <p className="mt-2 text-sm text-ink/60">
          Add your weekly availability from &ldquo;Manage services&rdquo; after creating this —
          bookings won&rsquo;t have anything to check against until you do.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <CategorySelect type="SERVICE" value={form.categoryId} onChange={(id) => update('categoryId', id)} />

          <Field label="Title" name="title" required value={form.title} onChange={(e) => update('title', e.target.value)} />
          <Textarea
            label="Description"
            name="description"
            required
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink/80">Pricing</label>
              <select
                value={form.pricingModel}
                onChange={(e) => update('pricingModel', e.target.value)}
                className="rounded border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
              >
                <option value="FIXED">Fixed</option>
                <option value="HOURLY">Hourly</option>
                <option value="PER_SESSION">Per session</option>
              </select>
            </div>
            <Field
              label={`Price (NGN${form.pricingModel === 'HOURLY' ? '/hr' : ''})`}
              type="number"
              name="price"
              min="0"
              required
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink/80">Location type</label>
              <select
                value={form.locationType}
                onChange={(e) => update('locationType', e.target.value)}
                className="rounded border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
              >
                <option value="IN_PERSON">In-person</option>
                <option value="ONLINE">Online</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <Field
              label="Duration (minutes)"
              type="number"
              name="durationMinutes"
              min="5"
              required
              value={form.durationMinutes}
              onChange={(e) => update('durationMinutes', e.target.value)}
            />
          </div>

          {form.locationType !== 'ONLINE' && (
            <Field
              label="Location"
              name="location"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
            />
          )}

          <Textarea
            label="Cancellation policy (optional)"
            name="cancellationPolicy"
            rows={2}
            value={form.cancellationPolicy}
            onChange={(e) => update('cancellationPolicy', e.target.value)}
          />

          {error && <p className="text-sm text-clay">{error}</p>}
          <Button type="submit" loading={submitting} className="mt-2 w-full">
            Create draft
          </Button>
        </form>
      </section>
    </main>
  );
}
