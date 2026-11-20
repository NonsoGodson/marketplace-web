import Link from 'next/link';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel — the one bold element; everything else stays quiet. */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-indigo px-12 py-10 text-paper lg:flex">
        <Link href="/" className="font-display text-xl italic">
          Naija MarketHub
        </Link>
        <div className="max-w-sm">
          <p className="font-display text-4xl leading-tight">
            One place to buy, sell, and book — anything.
          </p>
          <p className="mt-4 text-sm text-paper/70">
            Products, digital goods, and services from real people and
            businesses near you.
          </p>
        </div>
        <p className="text-xs text-paper/50">
          © {new Date().getFullYear()} Naija MarketHub
        </p>
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-marigold/20"
        />
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 block font-display text-xl italic lg:hidden">
            Naija MarketHub
          </Link>
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-ink/60">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-ink/60">{footer}</div>
        </div>
      </div>
    </div>
  );
}
