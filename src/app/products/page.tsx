import { Header } from '@/components/layout/Header';
import { CategoryNav } from '@/components/layout/CategoryNav';
import { SearchBar } from '@/components/layout/SearchBar';
import { ProductCard } from '@/components/product/ProductCard';
import { api } from '@/lib/api-client';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; categoryId?: string; sort?: string };
}) {
  const { q, categoryId, sort } = searchParams;

  let result: Awaited<ReturnType<typeof api.products.search>> = { items: [], total: 0 };
  let loadError = false;
  try {
    result = await api.products.search({ q, categoryId, sort });
  } catch {
    loadError = true;
  }

  return (
    <main>
      <Header />
      <CategoryNav type="PRODUCT" />

      <section className="px-6 py-8 lg:px-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-2xl">
            {q ? (
              <>
                Results for <span className="italic">&ldquo;{q}&rdquo;</span>
              </>
            ) : (
              'All products'
            )}
          </h1>
          <SearchBar defaultValue={q} />
        </div>

        {loadError && (
          <p className="rounded border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-clay">
            Couldn&rsquo;t reach the marketplace right now. Try again in a moment.
          </p>
        )}

        {!loadError && result.items.length === 0 && (
          <p className="py-16 text-center text-ink/50">
            No products found{q ? ` for "${q}"` : ''}. Try a different search.
          </p>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {result.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
