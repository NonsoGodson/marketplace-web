'use client';

import { useEffect, useState } from 'react';
import { api, Category, CategoryType } from '@/lib/api-client';

function flatten(categories: Category[], depth = 0): { id: string; label: string }[] {
  return categories.flatMap((cat) => [
    { id: cat.id, label: `${'—'.repeat(depth)} ${cat.name}`.trim() },
    ...flatten(cat.children, depth + 1),
  ]);
}

export function CategorySelect({
  value,
  onChange,
  type,
}: {
  value: string;
  onChange: (categoryId: string) => void;
  // Only categories of this type are offered (products vs services).
  type?: CategoryType;
}) {
  const [options, setOptions] = useState<{ id: string; label: string }[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.categories
      .tree(type)
      .then((tree) => setOptions(flatten(tree)))
      .catch(() => setError(true));
  }, [type]);

  if (error) {
    return <p className="text-sm text-clay">Couldn&rsquo;t load categories. Refresh and try again.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="category" className="text-sm font-medium text-ink/80">
        Category
      </label>
      <select
        id="category"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-indigo"
      >
        <option value="" disabled>
          {options.length === 0 ? 'Loading…' : 'Select a category'}
        </option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
