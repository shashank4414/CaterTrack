type Client = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  note?: string | null;
};

type ClientsResponse = {
  data: Client[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ClientsPageProps = {
  searchParams?: Promise<{
    search?: string | string[];
  }>;
};

import Link from 'next/link';
import SearchInput from './SearchInput';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';

async function getClients(search: string): Promise<ClientsResponse> {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  const response = await fetch(`${API_BASE_URL}/clients?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Failed to fetch clients');
  return response.json();
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = Array.isArray(resolvedSearchParams?.search)
    ? resolvedSearchParams.search[0]?.trim() || ''
    : resolvedSearchParams?.search?.trim() || '';

  const result = await getClients(search)
    .then((data) => ({ data, error: false }))
    .catch(() => ({ data: null, error: true }));

  if (result.error || !result.data) {
    return (
      <main className="min-h-screen bg-stone-100 px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <svg
              className="h-5 w-5 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h1 className="text-base font-semibold text-zinc-900">
            Unable to load clients
          </h1>
          <p className="mt-1 text-sm text-stone-400">
            The API request failed. Please try again.
          </p>
        </div>
      </main>
    );
  }

  const { data: clients, total, page, totalPages } = result.data;

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Page header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Clients
            </h1>
            <p className="mt-0.5 text-sm text-stone-400">
              Manage and browse your client records.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-5 rounded-xl border border-stone-200 bg-white px-5 py-3 shadow-sm">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                Total
              </p>
              <p className="mt-0.5 text-xl font-bold text-zinc-900">{total}</p>
            </div>
            <div className="h-7 w-px bg-stone-200" />
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                Page
              </p>
              <p className="mt-0.5 text-xl font-bold text-zinc-900">
                {page}
                <span className="ml-1 text-sm font-normal text-stone-300">
                  / {totalPages}
                </span>
              </p>
            </div>
          </div>
        </header>

        {/* Search bar */}
        <SearchInput defaultValue={search} />

        {/* Result count */}
        {clients.length > 0 && (
          <p className="text-xs text-stone-400">
            {search
              ? `${clients.length} result${clients.length !== 1 ? 's' : ''} for "${search}"`
              : `${clients.length} client${clients.length !== 1 ? 's' : ''} on this page`}
          </p>
        )}

        {/* Empty state */}
        {clients.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white py-16 text-center shadow-sm">
            <p className="text-sm font-medium text-zinc-700">
              {search ? 'No matching clients' : 'No clients yet'}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              {search
                ? 'Try adjusting your search term.'
                : 'Client records will appear here once added.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-2 md:hidden">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                    {getInitials(client.firstName, client.lastName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {client.firstName} {client.lastName}
                      </p>
                      <span className="shrink-0 text-xs text-stone-300">
                        #{client.id}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-zinc-700">
                      {client.email && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-3 w-3 shrink-0 text-stone-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.75}
                              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                            />
                          </svg>
                          {client.email}
                        </span>
                      )}
                      {client.phone && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-3 w-3 shrink-0 text-stone-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.75}
                              d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                            />
                          </svg>
                          {client.phone}
                        </span>
                      )}
                    </div>
                    {client.note?.trim() && (
                      <p className="mt-1 truncate text-xs text-stone-300">
                        {client.note}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50">
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                      ID
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                      Name
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                      Email
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                      Phone
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="relative transition hover:bg-emerald-50/50"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs font-medium text-stone-300">
                        <Link
                          href={`/clients/${client.id}`}
                          className="absolute inset-0"
                          aria-label={`View ${client.firstName} ${client.lastName}`}
                        />
                        #{client.id}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
                            {getInitials(client.firstName, client.lastName)}
                          </div>
                          <span className="font-medium text-zinc-900">
                            {client.firstName} {client.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-700">
                        {client.email ? (
                          <span className="flex items-center gap-1.5">
                            <svg
                              className="h-3.5 w-3.5 shrink-0 text-stone-300"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.75}
                                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                              />
                            </svg>
                            {client.email}
                          </span>
                        ) : (
                          <span className="text-stone-200">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-zinc-700">
                        {client.phone ? (
                          <span className="flex items-center gap-1.5">
                            <svg
                              className="h-3.5 w-3.5 shrink-0 text-stone-300"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.75}
                                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                              />
                            </svg>
                            {client.phone}
                          </span>
                        ) : (
                          <span className="text-stone-200">—</span>
                        )}
                      </td>
                      <td className="max-w-xs px-5 py-3.5 text-stone-400">
                        {client.note?.trim() || (
                          <span className="text-stone-200">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
