'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useRequireAuth } from '@/lib/use-require-auth';

const links = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/sellers', label: 'Seller applications' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/disputes', label: 'Disputes' },
];

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { user, loading } = useRequireAuth();
  const pathname = usePathname();

  if (loading || !user) return null;

  // UI-level guard only, for a clean experience — the backend enforces the
  // real role check on every admin endpoint regardless of what this renders.
  if (user.role !== 'ADMIN' && user.role !== 'SUPPORT_ADMIN') {
    return (
      <main>
        <Header />
        <p className="px-6 py-16 text-center text-ink/60">You don&rsquo;t have access to this area.</p>
      </main>
    );
  }

  return (
    <main>
      <Header />
      <div className="grid gap-8 px-6 py-8 lg:grid-cols-[200px_1fr] lg:px-12">
        <nav aria-label="Admin" className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded px-3 py-2 text-sm transition-colors ${
                pathname === link.href ? 'bg-indigo text-paper' : 'text-ink/70 hover:bg-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <section className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl">{title}</h1>
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
