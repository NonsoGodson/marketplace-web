import Link from 'next/link';
import { ProductSummary } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

export function ProductCard({ product }: { product: ProductSummary }) {
  const hasDiscount = product.discountPrice && Number(product.discountPrice) < Number(product.price);

  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col gap-2">
      <div className="aspect-square overflow-hidden rounded bg-white border border-line">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0].url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink/30">
            <span className="font-display italic">{product.title.slice(0, 1)}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-ink line-clamp-1">{product.title}</p>
        <p className="text-xs text-ink/50">{product.store.businessName}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-indigo">
            {formatMoney(hasDiscount ? product.discountPrice! : product.price, product.currency)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-ink/40 line-through">
              {formatMoney(product.price, product.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
