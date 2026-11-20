import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { BookingWidget } from '@/components/service/BookingWidget';
import { ReviewsSection } from '@/components/review/ReviewsSection';
import { api, ApiError } from '@/lib/api-client';
import { formatMoney } from '@/lib/format';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pricingSuffix: Record<string, string> = { FIXED: '', HOURLY: '/hr', PER_SESSION: '/session' };
const locationLabel: Record<string, string> = {
  ONLINE: 'Online',
  IN_PERSON: 'In-person',
  BOTH: 'Online or in-person',
};

export default async function ServiceDetailPage({ params }: { params: { slug: string } }) {
  let service;
  try {
    service = await api.services.getBySlug(params.slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <main>
      <Header />
      <section className="grid gap-10 px-6 py-10 lg:grid-cols-2 lg:px-12">
        <div className="aspect-[4/3] overflow-hidden rounded bg-white border border-line">
          {service.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={service.images[0].url} alt={service.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink/30">
              <span className="font-display text-6xl italic">{service.title.slice(0, 1)}</span>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-ink/50">{service.category.name}</p>
          <h1 className="mt-1 font-display text-3xl">{service.title}</h1>
          <p className="mt-1 text-sm text-ink/60">
            <Link href={`/stores/${service.store.slug}`} className="hover:text-indigo">
              {service.store.businessName}
            </Link>{' '}
            · {locationLabel[service.locationType]} · {service.durationMinutes} min
          </p>

          <p className="mt-4 text-2xl font-semibold text-jade">
            {formatMoney(service.price, service.currency)}
            <span className="text-sm font-normal text-ink/50">{pricingSuffix[service.pricingModel]}</span>
          </p>

          {service.availability.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-ink/70">Availability</p>
              <ul className="flex flex-col gap-1 text-sm text-ink/70">
                {service.availability.map((slot, i) => (
                  <li key={i}>
                    {dayNames[slot.dayOfWeek]} · {slot.startTime}–{slot.endTime}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-ink/70">
            {service.description}
          </p>

          {/* Booking flow — see BookingWidget for why slots are computed
              client-side from availability alone. */}
          <BookingWidget service={service} />
        </div>
      </section>

      <div className="px-6 lg:px-12">
        <ReviewsSection target={{ targetType: 'SERVICE', serviceId: service.id }} />
      </div>
    </main>
  );
}
