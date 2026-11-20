import Link from 'next/link';
import { api, Category, CategoryType } from '@/lib/api-client';

const GROUPS: { type: CategoryType; label: string; href: string }[] = [
  { type: 'PRODUCT', label: 'Products', href: '/products' },
  { type: 'SERVICE', label: 'Services', href: '/services' },
];

// Pass `type` to show one branch (product/service listing pages); omit it to
// show both, each row linking to its own listing page.
export async function CategoryNav({ type }: { type?: CategoryType } = {}) {
  let categories: Category[] = [];
  try {
    categories = await api.categories.tree();
  } catch {
    // Backend unreachable or no categories yet — nav just renders empty
    // rather than breaking the page; there's nothing actionable for the
    // visitor to do about it here.
    return null;
  }

  const groups = GROUPS.filter((g) => !type || g.type === type)
    .map((g) => ({ ...g, items: categories.filter((c) => c.type === g.type) }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;
  const showLabels = groups.length > 1;

  return (
    <nav aria-label="Categories" className="flex flex-col gap-1 py-2">
      {groups.map((group) => (
        <div key={group.type} className="flex items-center gap-2 px-6 lg:px-12">
          {showLabels && (
            <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-ink/40">{group.label}</span>
          )}
          <div className="scrollbar-none flex gap-2 overflow-x-auto py-1.5">
            {group.items.map((cat) => (
              <Link
                key={cat.id}
                href={`${group.href}?categoryId=${cat.id}`}
                className="shrink-0 rounded-full border border-line px-4 py-1.5 text-sm text-ink/70 transition-colors hover:border-indigo hover:text-indigo"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
