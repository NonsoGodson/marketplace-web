import { Header } from '@/components/layout/Header';
import { CategoryNav } from '@/components/layout/CategoryNav';
import { SearchBar } from '@/components/layout/SearchBar';
import { ProductCard } from '@/components/product/ProductCard';
import { api } from '@/lib/api-client';

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof api.products.search>> = { items: [], total: 0 };
  try {
    featured = await api.products.search({ sort: 'newest', limit: 10 });
  } catch {
    // Backend unreachable — the hero and nav still render fine without featured items.
  }

  return (
    <main>
      <Header />
      <CategoryNav />

      <section className="flex flex-col items-center gap-6 px-6 py-20 text-center lg:px-12">
        <h1 className="max-w-2xl font-display text-5xl leading-tight">
          Buy, sell, and book — <span className="italic text-marigold-dark">anything.</span>
        </h1>
        <p className="max-w-md text-ink/60">
          Products, digital goods, and services from real people and businesses near you.
        </p>
        <SearchBar />
      </section>

      {featured.items.length > 0 && (
        <section className="px-6 pb-20 lg:px-12">
          <h2 className="mb-6 font-display text-2xl">Newly listed</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {featured.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
