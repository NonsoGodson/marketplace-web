'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell } from '@/components/layout/AuthShell';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useAuth, ApiError } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [role, setRole] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, role });
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Buy, or start selling — you can always do both from one account."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-indigo underline underline-offset-2">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex gap-2 rounded border border-line p-1">
          {(['BUYER', 'SELLER'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRole(option)}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium transition-colors ${
                role === option ? 'bg-indigo text-paper' : 'text-ink/60 hover:text-ink'
              }`}
              aria-pressed={role === option}
            >
              {option === 'BUYER' ? "I'm here to buy" : "I'm here to sell"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="First name"
            name="firstName"
            required
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
          />
          <Field
            label="Last name"
            name="lastName"
            required
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
          />
        </div>
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
        />
        {error && <p className="text-sm text-clay">{error}</p>}
        <Button type="submit" loading={loading} className="mt-2 w-full">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
