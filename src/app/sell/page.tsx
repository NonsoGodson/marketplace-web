'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Field } from '@/components/ui/Field';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError, SellerStore } from '@/lib/api-client';

const emptyForm = { businessName: '', description: '', contactEmail: '', contactPhone: '', country: '' };

export default function SellOnboardingPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [store, setStore] = useState<SellerStore | null | 'not_started'>(null);
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.sellers
      .getMyStore()
      .then((s) => {
        setStore(s);
        if (s.status === 'ACTIVE') router.push('/seller/dashboard');
        else setForm({ businessName: s.businessName, description: s.description ?? '', contactEmail: s.contactEmail ?? '', contactPhone: s.contactPhone ?? '', country: s.country ?? '' });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setStore('not_started');
      })
      .finally(() => setChecking(false));
  }, [user, router]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        businessName: form.businessName,
        description: form.description,
        contactEmail: form.contactEmail,
        ...(form.contactPhone ? { contactPhone: form.contactPhone } : {}),
        ...(form.country ? { country: form.country } : {}),
      };
      const result = await api.sellers.submitOnboarding(payload);
      setStore(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user || checking) return null;

 const showForm =
  store === 'not_started' ||
  (store !== null &&
    typeof store === 'object' &&
    store.verificationStatus === 'REJECTED');

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-md px-6 py-10 lg:px-0">
        <h1 className="font-display text-3xl">Start selling</h1>

        {store && store !== 'not_started' && store.verificationStatus === 'PENDING_REVIEW' && (
          <div className="mt-6 rounded border border-marigold/40 bg-marigold/10 p-4 text-sm">
            <p className="font-medium">Your application is under review.</p>
            <p className="mt-1 text-ink/70">
              We&rsquo;ll let you know once it&rsquo;s approved — you&rsquo;ll then be able to publish products and services.
            </p>
          </div>
        )}

        {store && store !== 'not_started' && store.verificationStatus === 'REJECTED' && (
          <div className="mt-6 rounded border border-clay/30 bg-clay/5 p-4 text-sm text-clay">
            <p className="font-medium">Your application wasn&rsquo;t approved.</p>
            {store.verificationNotes && <p className="mt-1">{store.verificationNotes}</p>}
            <p className="mt-1">You can update the details below and resubmit.</p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Field
              label="Business name"
              name="businessName"
              required
              value={form.businessName}
              onChange={(e) => update('businessName', e.target.value)}
            />
            <Textarea
              label="Tell buyers about your business"
              name="description"
              required
              rows={4}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
            <Field
              label="Contact email"
              type="email"
              name="contactEmail"
              required
              value={form.contactEmail}
              onChange={(e) => update('contactEmail', e.target.value)}
            />
            <Field
              label="Contact phone (optional)"
              name="contactPhone"
              value={form.contactPhone}
              onChange={(e) => update('contactPhone', e.target.value)}
            />
            <Field
              label="Country (optional)"
              name="country"
              value={form.country}
              onChange={(e) => update('country', e.target.value)}
            />
            {error && <p className="text-sm text-clay">{error}</p>}
            <Button type="submit" loading={submitting} className="mt-2 w-full">
              {store === 'not_started' ? 'Submit application' : 'Resubmit application'}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
