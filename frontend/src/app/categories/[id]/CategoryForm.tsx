'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_BASE_URL =
  process.env.API_BASE_URL ??
  'https://catertrack-production.up.railway.app/categories';

type Fields = {
  name: string;
  subtitle: string;
};

type CategoryFormProps = {
  mode: 'create' | 'edit';
  initial: Fields;
  categoryId?: number;
  cancelHref: string;
};

export default function CategoryForm({
  mode,
  initial,
  categoryId,
  cancelHref,
}: CategoryFormProps) {
  const router = useRouter();
  const [fields, setFields] = useState<Fields>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function set(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const isEditing = mode === 'edit' && typeof categoryId === 'number';
      const endpoint = isEditing
        ? `${API_BASE_URL}/categories/${categoryId}`
        : `${API_BASE_URL}/categories`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.trim(),
          subtitle: fields.subtitle.trim() || null,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(body?.errors ?? [body?.error ?? 'Failed to save category']);
        return;
      }

      const nextCategoryId = isEditing ? categoryId : body?.id;
      router.push(
        nextCategoryId ? `/categories/${nextCategoryId}` : '/categories',
      );
      router.refresh();
    } catch {
      setErrors(['Something went wrong. Please try again.']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3">
          <ul className="space-y-0.5">
            {errors.map((err) => (
              <li key={err} className="text-xs text-red-600">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={fields.name}
            onChange={(e) => set('name', e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Subtitle
          </label>
          <input
            type="text"
            value={fields.subtitle}
            onChange={(e) => set('subtitle', e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-5">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full bg-orange-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-800 disabled:opacity-60"
        >
          {loading
            ? 'Saving…'
            : mode === 'create'
              ? 'Create category'
              : 'Save changes'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => router.push(cancelHref)}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-orange-200 hover:text-orange-800 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
