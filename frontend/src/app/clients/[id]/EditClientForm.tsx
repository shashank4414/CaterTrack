'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_BASE_URL = '/api';

type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  note: string;
};

export default function EditClientForm({
  clientId,
  initial,
}: {
  clientId: number;
  initial: Fields;
}) {
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
      const res = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: fields.firstName.trim(),
          lastName: fields.lastName.trim(),
          email: fields.email.trim() || null,
          phone: fields.phone.trim() || null,
          note: fields.note.trim() || null,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        setErrors(body?.errors ?? [body?.error ?? 'Failed to update client']);
        return;
      }

      router.push(`/clients/${clientId}`);
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
            First name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={fields.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Last name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={fields.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Email
          </label>
          <input
            type="email"
            value={fields.email}
            onChange={(e) => set('email', e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Phone
          </label>
          <input
            type="tel"
            value={fields.phone}
            onChange={(e) => set('phone', e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Note
          </label>
          <textarea
            rows={3}
            maxLength={1000}
            value={fields.note}
            onChange={(e) => set('note', e.target.value)}
            className="mt-1.5 w-full resize-none rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />
          <p className="mt-1 text-right text-[10px] text-stone-500">
            {fields.note.length}/1000
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-5">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full bg-orange-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-800 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => router.back()}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-orange-200 hover:text-orange-800 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
