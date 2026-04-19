import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditClientForm from '../EditClientForm';

type Client = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  note: string | null;
};

type EditClientPageProps = {
  params: Promise<{ id: string }>;
};

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';

async function getClient(id: string): Promise<Client | null> {
  const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch client');
  return res.json();
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params;
  const client = await getClient(id).catch(() => null);
  if (!client) notFound();

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Back navigation */}
        <Link
          href={`/clients/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-stone-400 transition hover:text-zinc-700"
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
          {client.firstName} {client.lastName}
        </Link>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-zinc-900">Edit client</h1>
          <p className="mt-0.5 text-xs text-stone-400">
            Update the details for{' '}
            <span className="font-medium text-zinc-700">
              {client.firstName} {client.lastName}
            </span>
            .
          </p>
          <div className="mt-5 border-t border-stone-100 pt-5">
            <EditClientForm
              clientId={client.id}
              initial={{
                firstName: client.firstName,
                lastName: client.lastName,
                email: client.email ?? '',
                phone: client.phone ?? '',
                note: client.note ?? '',
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
