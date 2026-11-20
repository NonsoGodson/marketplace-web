import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { AddToCartButton } from '@/components/product/AddToCartButton';
import { ReviewsSection } from '@/components/review/ReviewsSection';
import { api, ApiError } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  let product;
  try {
    product = await api.products.getBySlug(params.slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const hasDiscount = product.discountPrice && Number(product.discountPrice) < Number(product.price);

  return (
    <main>
      <Header />
      <section className="grid gap-10 px-6 py-10 lg:grid-cols-2 lg:px-12">
        <div className="aspect-square overflow-hidden rounded bg-white border border-line">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0].url} alt={product.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink/30">
              <span className="font-display text-6xl italic">{product.title.slice(0, 1)}</span>
            </div>
          )}
        </div>

        <div>
          <Link href={`/products?categoryId=${product.category.id}`} className="text-sm text-ink/50 hover:text-indigo">
            {product.category.name}
          </Link>
          <h1 className="mt-1 font-display text-3xl">{product.title}</h1>
          <Link href={`/stores/${product.store.slug}`} className="mt-1 inline-block text-sm text-ink/60 hover:text-indigo">
            Sold by {product.store.businessName}
          </Link>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-indigo">
              {formatMoney(hasDiscount ? product.discountPrice! : product.price, product.currency)}
            </span>
            {hasDiscount && (
              <span className="text-ink/40 line-through">{formatMoney(product.price, product.currency)}</span>
            )}
          </div>

          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ink/70">
            {product.description}
          </p>

          <AddToCartButton product={product} />
        </div>
      </section>

      <div className="px-6 lg:px-12">
        <ReviewsSection target={{ targetType: 'PRODUCT', productId: product.id }} />
      </div>
    </main>
  );
}
