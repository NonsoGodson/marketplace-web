'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api-client';

export function MessageSellerButton({ storeId }: { storeId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      const conversation = await api.messaging.start({ storeId, message });
      router.push(`/messages/${conversation.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send that message.');
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Message seller
      </Button>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <Textarea
        label="Message"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask a question before you buy…"
      />
      {error && <p className="text-sm text-clay">{error}</p>}
      <Button onClick={handleSend} loading={sending} className="self-start">
        Send
      </Button>
    </div>
  );
}
