import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { ProductCard } from '@/components/product/ProductCard';
import { ServiceCard } from '@/components/product/ServiceCard';
import { ReviewsSection } from '@/components/review/ReviewsSection';
import { MessageSellerButton } from '@/components/store/MessageSellerButton';
import { api, ApiError } from '@/lib/api-client';

export default async function StoreProfilePage({ params }: { params: { slug: string } }) {
  let store;
  try {
    store = await api.stores.getBySlug(params.slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const [products, services] = await Promise.all([
    api.products.search({ storeId: store.id, limit: 20 }).catch(() => ({ items: [], total: 0 })),
    api.services.search({ storeId: store.id, limit: 20 }).catch(() => ({ items: [], total: 0 })),
  ]);

  return (
    <main>
      <Header />

      <section className="px-6 py-10 lg:px-12">
        <div className="flex items-start gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-white">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={store.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-3xl italic text-indigo">{store.businessName.slice(0, 1)}</span>
            )}
          </div>
          <div>
            <h1 className="font-display text-3xl">{store.businessName}</h1>
            {store.country && <p className="mt-1 text-sm text-ink/50">{store.country}</p>}
            {store.description && (
              <p className="mt-3 max-w-xl whitespace-pre-line text-sm leading-relaxed text-ink/70">
                {store.description}
              </p>
            )}
            <div className="mt-4">
              <MessageSellerButton storeId={store.id} />
            </div>
          </div>
        </div>
      </section>

      {products.items.length > 0 && (
        <section className="px-6 pb-10 lg:px-12">
          <h2 className="mb-4 font-display text-2xl">Products</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {products.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {services.items.length > 0 && (
        <section className="px-6 pb-10 lg:px-12">
          <h2 className="mb-4 font-display text-2xl">Services</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {services.items.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      )}

      <div className="px-6 pb-16 lg:px-12">
        <ReviewsSection target={{ targetType: 'SELLER', storeId: store.id }} />
      </div>
    </main>
  );
}
