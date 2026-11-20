'use client';

import { useEffect, useState, FormEvent } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth-context';
import { api, ApiError, AdminCategory, CategoryType } from '@/lib/api-client';

function flatten(categories: AdminCategory[], depth = 0): { cat: AdminCategory; depth: number }[] {
  return categories.flatMap((cat) => [{ cat, depth }, ...flatten(cat.children, depth + 1)]);
}

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const [tree, setTree] = useState<AdminCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [newType, setNewType] = useState<CategoryType>('PRODUCT');
  const [filter, setFilter] = useState<'ALL' | CategoryType>('ALL');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Groups start collapsed: with hundreds of subcategories a phone would otherwise scroll forever.
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggleOpen(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function load() {
    api.admin
      .categories()
      .then(setTree)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load categories.'));
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await api.admin.createCategory({
        name: name.trim(),
        parentId: parentId || undefined,
        // A subcategory inherits its parent's type on the server.
        type: parentId ? undefined : newType,
      });
      setName('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create that category.');
    } finally {
      setCreating(false);
    }
  }

  async function toggle(cat: AdminCategory) {
    setBusyId(cat.id);
    setError(null);
    try {
      await api.admin.setCategoryActive(cat.id, !cat.isActive);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update that category.');
    } finally {
      setBusyId(null);
    }
  }

  const rows = tree ? flatten(tree) : [];
  const visibleRows = (() => {
    const out: { cat: AdminCategory; depth: number }[] = [];
    const walk = (nodes: AdminCategory[], depth: number) => {
      for (const cat of nodes) {
        out.push({ cat, depth });
        if (cat.children.length > 0 && open.has(cat.id)) walk(cat.children, depth + 1);
      }
    };
    walk((tree ?? []).filter((c) => filter === 'ALL' || c.type === filter), 0);
    return out;
  })();

  return (
    <AdminShell title="Categories">
      <form onSubmit={handleCreate} className="flex flex-col gap-3 rounded border border-line p-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="cat-name" className="text-sm font-medium text-ink/80">
            New category
          </label>
          <input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Fashion & Beauty"
            className="rounded border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cat-parent" className="text-sm font-medium text-ink/80">
            Parent (optional)
          </label>
          <select
            id="cat-parent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="rounded border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
          >
            <option value="">Top level</option>
            {rows.map(({ cat, depth }) => (
              <option key={cat.id} value={cat.id}>
                {`${'— '.repeat(depth)}${cat.name}`}
              </option>
            ))}
          </select>
        </div>
        {!parentId && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cat-type" className="text-sm font-medium text-ink/80">
              Type
            </label>
            <select
              id="cat-type"
              value={newType}
              onChange={(e) => setNewType(e.target.value as CategoryType)}
              className="rounded border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo"
            >
              <option value="PRODUCT">Products</option>
              <option value="SERVICE">Services</option>
            </select>
          </div>
        )}
        <Button type="submit" loading={creating}>
          Add
        </Button>
      </form>

      {error && <p className="mt-4 text-sm text-clay">{error}</p>}
      {tree && rows.length === 0 && (
        <p className="mt-6 text-sm text-ink/50">
          No categories yet. Sellers can&rsquo;t create listings until at least one exists.
        </p>
      )}

      <div className="mt-6 flex gap-2">
        {(['ALL', 'PRODUCT', 'SERVICE'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              filter === f ? 'border-indigo text-indigo' : 'border-line text-ink/60'
            }`}
          >
            {f === 'ALL' ? 'All' : f === 'PRODUCT' ? 'Products' : 'Services'}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col divide-y divide-line">
        {visibleRows.map(({ cat, depth }) => (
          <div key={cat.id} className="flex items-center justify-between gap-3 py-3" style={{ paddingLeft: depth * 16 }}>
            <div className="flex min-w-0 items-center gap-2">
              {cat.children.length > 0 ? (
                <button
                  type="button"
                  onClick={() => toggleOpen(cat.id)}
                  aria-expanded={open.has(cat.id)}
                  aria-label={`${open.has(cat.id) ? 'Collapse' : 'Expand'} ${cat.name}`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-line text-sm text-ink/60"
                >
                  {open.has(cat.id) ? '–' : '+'}
                </button>
              ) : (
                <span className="w-7 shrink-0" />
              )}
              <p className={`min-w-0 break-words text-sm ${cat.isActive ? '' : 'text-ink/40 line-through'}`}>
                {cat.name}
                {depth === 0 && (
                  <span className="ml-2 whitespace-nowrap rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/50">
                    {cat.type === 'SERVICE' ? 'Service' : 'Product'}
                    {cat.children.length > 0 ? ` · ${cat.children.length}` : ''}
                  </span>
                )}
              </p>
            </div>
            <Button className="shrink-0" variant="ghost" loading={busyId === cat.id} onClick={() => toggle(cat)}>
              {cat.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-ink/40">
        Reordering and renaming are supported by the backend but don&rsquo;t have controls here yet.
      </p>
    </AdminShell>
  );
}
