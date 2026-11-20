import Link from 'next/link';
import { ServiceSummary } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

const pricingSuffix: Record<ServiceSummary['pricingModel'], string> = {
  FIXED: '',
  HOURLY: '/hr',
  PER_SESSION: '/session',
};

export function ServiceCard({ service }: { service: ServiceSummary }) {
  return (
    <Link href={`/services/${service.slug}`} className="group flex flex-col gap-2">
      <div className="aspect-[4/3] overflow-hidden rounded bg-white border border-line">
        {service.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.images[0].url}
            alt={service.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink/30">
            <span className="font-display italic">{service.title.slice(0, 1)}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-ink line-clamp-1">{service.title}</p>
        <p className="text-xs text-ink/50">
          {service.store.businessName} · {service.locationType === 'ONLINE' ? 'Online' : service.locationType === 'BOTH' ? 'Online or in-person' : 'In-person'}
        </p>
        <p className="mt-1 text-sm font-semibold text-jade">
          {formatMoney(service.price, service.currency)}
          <span className="text-xs font-normal text-ink/50">{pricingSuffix[service.pricingModel]}</span>
        </p>
      </div>
    </Link>
  );
}
