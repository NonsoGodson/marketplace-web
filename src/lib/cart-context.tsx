'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { api, ApiError, Cart } from './api-client';
import { useAuth } from './auth-context';

interface CartContextValue {
  cart: Cart | null;
  itemCount: number;
  loading: boolean;
  error: string | null;
  addItem: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const data = await api.cart.get();
      setCart(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your cart.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load (or clear) the cart whenever auth state changes.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(
    async (productId: string, quantity: number, variantId?: string) => {
      await api.cart.addItem({ productId, quantity, variantId });
      await refresh();
    },
    [refresh],
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      await api.cart.updateItem(itemId, quantity);
      await refresh();
    },
    [refresh],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      await api.cart.removeItem(itemId);
      await refresh();
    },
    [refresh],
  );

  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <CartContext.Provider value={{ cart, itemCount, loading, error, addItem, updateItem, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
