import Link from 'next/link';
import ClientForm from '../[id]/ClientForm';

export default function NewClientPage() {
  return (
    <main className="min-h-screen bg-amber-50 px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Back navigation */}
        <Link
          href="/clients"
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
          Clients
        </Link>

        <section className="rounded-3xl border border-stone-300 bg-white/88 p-6 shadow-[0_24px_60px_-36px_rgba(120,53,15,0.4)] backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-700">
            Client Editor
          </p>
          <h1 className="mt-2 text-lg font-bold text-slate-900">
            Create client
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            Add a new client record to the directory.
          </p>
          <div className="mt-5 border-t border-stone-200 pt-5">
            <ClientForm
              mode="create"
              cancelHref="/clients"
              initial={{
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                note: '',
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}