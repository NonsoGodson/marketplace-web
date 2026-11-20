'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError, ProductSummary } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

export default function SellerProductsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [products, setProducts] = useState<ProductSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    api.sellerProducts
      .mine()
      .then(setProducts)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your products.'));
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function toggleStatus(product: ProductSummary) {
    const nextStatus = product.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
    setBusyId(product.id);
    try {
      await api.sellerProducts.updateStatus(product.id, nextStatus);
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
          <h1 className="font-display text-3xl">Your products</h1>
          <Link href="/seller/products/new">
            <Button variant="secondary">New product</Button>
          </Link>
        </div>

        {error && <p className="mt-4 text-sm text-clay">{error}</p>}
        {products && products.length === 0 && <p className="mt-8 text-sm text-ink/50">No products yet.</p>}

        <div className="mt-6 flex flex-col divide-y divide-line">
          {products?.map((product) => (
            <div key={product.id} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">{product.title}</p>
                <p className="text-xs text-ink/50">
                  {formatMoney(product.price, product.currency)} · {product.status}
                </p>
              </div>
              {product.status !== 'SUSPENDED' && (
                <Button
                  variant="ghost"
                  loading={busyId === product.id}
                  onClick={() => toggleStatus(product)}
                >
                  {product.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
