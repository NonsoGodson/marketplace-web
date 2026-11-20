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
  type: 'PHYSICAL' as 'PHYSICAL' | 'DIGITAL',
  price: '',
  stockQuantity: '',
  imageUrl: '',
};

export default function NewProductPage() {
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
      await api.sellerProducts.create({
        categoryId: form.categoryId,
        title: form.title,
        description: form.description,
        type: form.type,
        price: Number(form.price),
        stockQuantity: form.type === 'PHYSICAL' ? Number(form.stockQuantity || 0) : undefined,
        images: form.imageUrl ? [{ url: form.imageUrl }] : undefined,
      });
      router.push('/seller/products');
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
        <h1 className="font-display text-3xl">New product</h1>
        <p className="mt-2 text-sm text-ink/60">
          Listings start as a draft — publish from &ldquo;Manage products&rdquo; once you&rsquo;re ready
          (and once your store is verified, if it isn&rsquo;t already).
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex gap-2 rounded border border-line p-1">
            {(['PHYSICAL', 'DIGITAL'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => update('type', option)}
                className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                  form.type === option ? 'bg-indigo text-paper' : 'text-ink/60 hover:text-ink'
                }`}
              >
                {option === 'PHYSICAL' ? 'Physical' : 'Digital'}
              </button>
            ))}
          </div>

          <CategorySelect type="PRODUCT" value={form.categoryId} onChange={(id) => update('categoryId', id)} />

          <Field label="Title" name="title" required value={form.title} onChange={(e) => update('title', e.target.value)} />
          <Textarea
            label="Description"
            name="description"
            required
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
          <Field
            label="Price (NGN)"
            type="number"
            name="price"
            min="0"
            required
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
          />
          {form.type === 'PHYSICAL' && (
            <Field
              label="Stock quantity"
              type="number"
              name="stockQuantity"
              min="0"
              value={form.stockQuantity}
              onChange={(e) => update('stockQuantity', e.target.value)}
            />
          )}
          <Field
            label="Image URL (optional)"
            name="imageUrl"
            placeholder="https://…"
            value={form.imageUrl}
            onChange={(e) => update('imageUrl', e.target.value)}
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
