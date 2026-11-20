export function StarDisplay({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating.toFixed(1)} out of 5`} className="text-marigold-dark">
      {'★'.repeat(Math.round(rating))}
      <span className="text-line">{'★'.repeat(5 - Math.round(rating))}</span>
    </span>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (rating: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1 text-2xl">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          onClick={() => onChange(star)}
          className={star <= value ? 'text-marigold-dark' : 'text-line hover:text-marigold'}
        >
          ★
        </button>
      ))}
    </div>
  );
}
