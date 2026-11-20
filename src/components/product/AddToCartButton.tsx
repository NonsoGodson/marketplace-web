'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { ApiError, ProductDetail } from '@/lib/api-client';

export function AddToCartButton({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [variantId, setVariantId] = useState<string | undefined>(product.variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'added'>('idle');
  const [error, setError] = useState<string | null>(null);

  const selectedVariant = product.variants.find((v) => v.id === variantId);
  const outOfStock = product.variants.length > 0 ? (selectedVariant?.stockQuantity ?? 0) < 1 : false;

  async function handleAdd() {
    if (!user) {
      router.push('/login');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      await addItem(product.id, quantity, variantId);
      setStatus('added');
      setTimeout(() => setStatus('idle'), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add to cart.');
      setStatus('idle');
    }
  }

  return (
    <div className="mt-8">
      {product.variants.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {product.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVariantId(v.id)}
              className={`rounded border px-3 py-1.5 text-sm transition-colors ${
                variantId === v.id ? 'border-indigo bg-indigo text-paper' : 'border-line text-ink/70 hover:border-indigo'
              }`}
            >
              {v.name}: {v.value}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-16 rounded border border-line px-2 py-2.5 text-sm"
          aria-label="Quantity"
        />
        <Button onClick={handleAdd} loading={status === 'loading'} disabled={outOfStock} className="flex-1 sm:flex-none">
          {status === 'added' ? 'Added ✓' : outOfStock ? 'Out of stock' : 'Add to cart'}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-clay">{error}</p>}
    </div>
  );
}
