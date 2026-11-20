'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useRequireAuth } from '@/lib/use-require-auth';
import { useCart } from '@/lib/cart-context';
import { api, ApiError } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

export default function CartPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const { cart, loading, error, updateItem, removeItem, refresh } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (authLoading || !user) return null; // redirecting

  const items = cart?.items ?? [];
  // Group by store purely for display — the backend does the real split at checkout.
  const byStore = items.reduce<Record<string, { name: string; items: typeof items }>>((acc, item) => {
    const key = item.product.store.businessName;
    if (!acc[key]) acc[key] = { name: key, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {});

  const total = items.reduce((sum, item) => {
    const unitPrice = item.variant?.priceOverride ? Number(item.variant.priceOverride) : Number(item.product.price);
    return sum + unitPrice * item.quantity;
  }, 0);

  async function handleCheckout() {
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      const result = await api.orders.checkout();
      await refresh();
      // Off to the provider's hosted checkout page. They send the buyer back
      // to /payment/callback when they're done (or give up).
      window.location.assign(result.authorizationUrl);
    } catch (err) {
      setCheckoutError(err instanceof ApiError ? err.message : 'Checkout failed. Try again.');
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-3xl px-6 py-10 lg:px-0">
        <h1 className="font-display text-3xl">Your cart</h1>

        {loading && <p className="mt-6 text-sm text-ink/50">Loading…</p>}
        {error && <p className="mt-6 text-sm text-clay">{error}</p>}

        {!loading && items.length === 0 && (
          <div className="mt-10 text-center text-ink/50">
            <p>Your cart is empty.</p>
            <Link href="/products" className="mt-2 inline-block text-indigo underline underline-offset-2">
              Browse products
            </Link>
          </div>
        )}

        {Object.entries(byStore).map(([storeKey, group]) => (
          <div key={storeKey} className="mt-8 border-t border-line pt-6 first:mt-6 first:border-none first:pt-0">
            <p className="mb-3 text-sm font-medium text-ink/60">{group.name}</p>
            <div className="flex flex-col gap-4">
              {group.items.map((item) => {
                const unitPrice = item.variant?.priceOverride
                  ? Number(item.variant.priceOverride)
                  : Number(item.product.price);
                return (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded border border-line bg-white">
                      {item.product.images[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.images[0].url} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Link href={`/products/${item.product.slug}`} className="text-sm font-medium hover:text-indigo">
                        {item.product.title}
                      </Link>
                      {item.variant && (
                        <p className="text-xs text-ink/50">
                          {item.variant.name}: {item.variant.value}
                        </p>
                      )}
                      <p className="text-sm text-ink/60">{formatMoney(unitPrice, item.product.currency)}</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, Math.max(1, Number(e.target.value)))}
                      className="w-16 rounded border border-line px-2 py-1.5 text-sm"
                      aria-label={`Quantity for ${item.product.title}`}
                    />
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-sm text-ink/40 hover:text-clay"
                      aria-label={`Remove ${item.product.title}`}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {items.length > 0 && (
          <div className="mt-8 flex flex-col items-end gap-3 border-t border-line pt-6">
            <p className="text-lg font-semibold">
              Total: {formatMoney(total, items[0].product.currency)}
            </p>
            {checkoutError && <p className="text-sm text-clay">{checkoutError}</p>}
            <Button onClick={handleCheckout} loading={checkingOut}>
              Place order
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
