'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError, ConversationSummary } from '@/lib/api-client';

function ConversationRow({ convo, label }: { convo: ConversationSummary; label: string }) {
  const last = convo.messages[0];
  return (
    <Link href={`/messages/${convo.id}`} className="flex items-center justify-between py-4 hover:text-indigo">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-ink/50">{last ? last.body : 'No messages yet'}</p>
      </div>
      <p className="ml-4 shrink-0 text-xs text-ink/40">{new Date(convo.updatedAt).toLocaleDateString()}</p>
    </Link>
  );
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [asBuyer, setAsBuyer] = useState<ConversationSummary[] | null>(null);
  const [asSeller, setAsSeller] = useState<ConversationSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.messaging
      .listMineAsBuyer()
      .then(setAsBuyer)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your messages.'));
    // Returns an empty list (not an error) for anyone without a store.
    api.messaging.listMineAsSeller().then(setAsSeller).catch(() => {});
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-2xl px-6 py-10 lg:px-0">
        <h1 className="font-display text-3xl">Messages</h1>

        {error && <p className="mt-6 text-sm text-clay">{error}</p>}
        {!asBuyer && !error && <p className="mt-6 text-sm text-ink/50">Loading…</p>}

        {asBuyer && asBuyer.length === 0 && asSeller.length === 0 && (
          <p className="mt-6 text-sm text-ink/50">No conversations yet.</p>
        )}

        {asBuyer && asBuyer.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-1 text-sm font-medium text-ink/60">Your conversations with sellers</h2>
            <div className="flex flex-col divide-y divide-line">
              {asBuyer.map((c) => (
                <ConversationRow key={c.id} convo={c} label={c.store?.businessName ?? 'Seller'} />
              ))}
            </div>
          </div>
        )}

        {asSeller.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-1 text-sm font-medium text-ink/60">Messages from buyers</h2>
            <div className="flex flex-col divide-y divide-line">
              {asSeller.map((c) => (
                <ConversationRow
                  key={c.id}
                  convo={c}
                  label={c.buyer ? `${c.buyer.firstName} ${c.buyer.lastName}` : 'Buyer'}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
