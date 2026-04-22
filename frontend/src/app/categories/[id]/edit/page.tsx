import Link from 'next/link';
import { notFound } from 'next/navigation';
import CategoryForm from '../CategoryForm';
import { getCategory } from '../../data';

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({
  params,
}: EditCategoryPageProps) {
  const { id } = await params;
  const category = await getCategory(id).catch(() => null);

  if (!category) notFound();

  return (
    <main className="px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href={`/categories/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 transition hover:text-orange-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
          {category.name}
        </Link>

        <section className="rounded-3xl border border-stone-300 bg-white/88 p-6 shadow-[0_24px_60px_-36px_rgba(120,53,15,0.4)] backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-700">
            Category Editor
          </p>
          <h1 className="mt-2 text-lg font-bold text-slate-900">
            Edit category
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            Update the details for{' '}
            <span className="font-medium text-slate-700">{category.name}</span>.
          </p>
          <div className="mt-5 border-t border-stone-200 pt-5">
            <CategoryForm
              mode="edit"
              categoryId={category.id}
              cancelHref={`/categories/${category.id}`}
              initial={{
                name: category.name,
                subtitle: category.subtitle ?? '',
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
