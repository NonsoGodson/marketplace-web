import { Header } from '@/components/layout/Header';
import { PaymentCallback } from '@/components/payment/PaymentCallback';

// Paystack sends the buyer back here with ?reference=... (and a duplicate
// ?trxref=...). Read from searchParams on the server and pass down, rather
// than calling useSearchParams in the client component, to avoid Next's
// Suspense-boundary requirement for that hook.
export default function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: { reference?: string; trxref?: string };
}) {
  const reference = searchParams.reference ?? searchParams.trxref;

  return (
    <main>
      <Header />
      <section className="mx-auto max-w-md px-6 py-16 text-center lg:px-0">
        <PaymentCallback reference={reference} />
      </section>
    </main>
  );
}
