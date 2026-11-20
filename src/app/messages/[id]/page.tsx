'use client';

import { useCallback, useEffect, useRef, useState, FormEvent } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError, Conversation } from '@/lib/api-client';

export default function ConversationPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useRequireAuth();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api.messaging
      .get(params.id)
      .then(setConversation)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load this conversation.'));
  }, [params.id]);

  useEffect(() => {
    if (!user) return;
    load();
    // Simple polling rather than websockets — the backend has no realtime
    // channel yet (see README). 10s keeps it feeling live enough for
    // pre-purchase questions without hammering the API.
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [user, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.messaging.sendMessage(params.id, draft);
      setDraft('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send that message.');
    } finally {
      setSending(false);
    }
  }

  if (authLoading || !user) return null;

  return (
    <main>
      <Header />
      <section className="mx-auto flex max-w-2xl flex-col px-6 py-8 lg:px-0">
        <Link href="/messages" className="text-sm text-indigo underline underline-offset-2">
          ← All messages
        </Link>

        {error && <p className="mt-4 text-sm text-clay">{error}</p>}
        {!conversation && !error && <p className="mt-6 text-sm text-ink/50">Loading…</p>}

        {conversation && (
          <>
            <div className="mt-6 flex flex-col gap-3">
              {conversation.messages.map((msg) => {
                const mine = msg.senderId === user.sub;
                return (
                  <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-3.5 py-2 text-sm ${
                        mine ? 'bg-indigo text-paper' : 'border border-line bg-white text-ink'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? 'text-paper/60' : 'text-ink/40'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {(conversation.blockedByBuyer || conversation.blockedBySeller) ? (
              <p className="mt-6 text-sm text-ink/50">This conversation has been blocked.</p>
            ) : (
              <form onSubmit={handleSend} className="mt-6 flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write a message…"
                  className="flex-1 rounded border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
                />
                <Button type="submit" loading={sending}>
                  Send
                </Button>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  );
}
