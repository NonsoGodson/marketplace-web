'use client';

import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';

export function SearchBar({ action = '/products', defaultValue = '' }: { action?: string; defaultValue?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    router.push(`${action}${params.toString() ? `?${params}` : ''}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl gap-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search for products or services…"
        className="flex-1 rounded border border-line bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/40 focus:border-indigo"
      />
      <button
        type="submit"
        className="rounded bg-indigo px-5 py-3 text-sm font-medium text-paper hover:bg-indigo-light"
      >
        Search
      </button>
    </form>
  );
}
