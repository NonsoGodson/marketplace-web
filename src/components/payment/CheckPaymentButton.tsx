'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api-client';

// For a payment that's still pending: asks the backend to check with the
// provider, then lets the page reload its data. Covers the buyer who paid but
// closed the tab before returning to the site, or a webhook that hasn't landed.
export function CheckPaymentButton({ reference, onChecked }: { reference: string; onChecked: () => void }) {
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check() {
    setChecking(true);
    setError(null);
    try {
      await api.payments.verify(reference);
      onChecked();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not check the payment.');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="mt-3">
      <Button variant="ghost" loading={checking} onClick={check}>
        Check payment status
      </Button>
      {error && <p className="mt-2 text-sm text-clay">{error}</p>}
    </div>
  );
}
