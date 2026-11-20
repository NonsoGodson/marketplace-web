'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { StarDisplay, StarPicker } from './Stars';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError, ReviewList } from '@/lib/api-client';

type Target =
  | { targetType: 'PRODUCT'; productId: string }
  | { targetType: 'SERVICE'; serviceId: string }
  | { targetType: 'SELLER'; storeId: string };

export function ReviewsSection({ target }: { target: Target }) {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ReviewList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function load() {
    const params =
      target.targetType === 'PRODUCT'
        ? { productId: target.productId }
        : target.targetType === 'SERVICE'
        ? { serviceId: target.serviceId }
        : { storeId: target.storeId };
    api.reviews
      .listForTarget(params)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load reviews.'));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    if (!user) {
      router.push('/login');
      return;
    }
    if (rating === 0) {
      setFormError('Choose a star rating first.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await api.reviews.create({ ...target, rating, body: body || undefined });
      setSubmitted(true);
      setRating(0);
      setBody('');
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-12 border-t border-line pt-8">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl">Reviews</h2>
        {data && data.totalReviews > 0 && (
          <span className="text-sm text-ink/60">
            <StarDisplay rating={data.averageRating} /> {data.averageRating.toFixed(1)} ({data.totalReviews})
          </span>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-clay">{error}</p>}

      {!submitted && (
        <div className="mt-6 max-w-md rounded border border-line p-4">
          <p className="mb-2 text-sm font-medium text-ink/70">Leave a review</p>
          <StarPicker value={rating} onChange={setRating} />
          <Textarea
            label="Comments (optional)"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-3"
          />
          {formError && <p className="mt-2 text-sm text-clay">{formError}</p>}
          <Button onClick={handleSubmit} loading={submitting} className="mt-3">
            Submit review
          </Button>
        </div>
      )}
      {submitted && <p className="mt-6 text-sm text-jade">Thanks for your review!</p>}

      <div className="mt-8 flex flex-col gap-6">
        {data?.items.length === 0 && <p className="text-sm text-ink/50">No reviews yet — be the first.</p>}
        {data?.items.map((review) => (
          <div key={review.id} className="border-t border-line pt-4 first:border-none first:pt-0">
            <div className="flex items-center gap-2">
              <StarDisplay rating={review.rating} />
              <p className="text-sm font-medium">
                {review.author.firstName} {review.author.lastName.slice(0, 1)}.
              </p>
              {review.isVerifiedPurchase && (
                <span className="rounded-full bg-jade/10 px-2 py-0.5 text-xs text-jade">Verified purchase</span>
              )}
            </div>
            {review.body && <p className="mt-1 text-sm text-ink/70">{review.body}</p>}
            <p className="mt-1 text-xs text-ink/40">{new Date(review.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
