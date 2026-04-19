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
    page?: string | string[];
  }>;
};

import Link from 'next/link';
import SearchInput from './SearchInput';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';

async function getClients(
  search: string,
  page: number,
): Promise<ClientsResponse> {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (page > 1) query.set('page', String(page));
  const response = await fetch(`${API_BASE_URL}/clients?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Failed to fetch clients');
  return response.json();
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function formatPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');

  if (digits.length !== 10) {
    return phone;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function getClientsPageHref(search: string, page: number) {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (page > 1) query.set('page', String(page));
  const queryString = query.toString();
  return queryString ? `/clients?${queryString}` : '/clients';
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = Array.isArray(resolvedSearchParams?.search)
    ? resolvedSearchParams.search[0]?.trim() || ''
    : resolvedSearchParams?.search?.trim() || '';
  const rawPage = Array.isArray(resolvedSearchParams?.page)
    ? resolvedSearchParams.page[0]?.trim() || '1'
    : resolvedSearchParams?.page?.trim() || '1';
  const page = Math.max(1, Number(rawPage) || 1);

  const result = await getClients(search, page)
    .then((data) => ({ data, error: false }))
    .catch(() => ({ data: null, error: true }));

  if (result.error || !result.data) {
    return (
      <main className="min-h-screen bg-amber-50 px-4 py-12 sm:px-8">
        <div className="mx-auto max-w-md rounded-3xl border border-red-200 bg-white/90 p-8 text-center shadow-[0_24px_60px_-36px_rgba(120,53,15,0.45)] backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-5 w-5 text-red-600"
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
          <h1 className="text-base font-semibold text-slate-900">
            Unable to load clients
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            The API request failed. Please try again.
          </p>
        </div>
      </main>
    );
  }

  const { data: clients, total, page: currentPage, totalPages } = result.data;
  const pageStart = total === 0 ? 0 : (currentPage - 1) * result.data.limit + 1;
  const pageEnd = total === 0 ? 0 : pageStart + clients.length - 1;
  const canGoToPreviousPage = currentPage > 1;
  const canGoToNextPage = currentPage < totalPages;

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Page header */}
        <header>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-700">
              Client Directory
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Clients
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Manage and browse your client records.
            </p>
          </div>
        </header>

        {/* Search bar */}
        <SearchInput defaultValue={search} />

        {/* Result count */}
        {clients.length > 0 && (
          <p className="text-xs font-medium tracking-wide text-stone-600">
            {search
              ? `${clients.length} result${clients.length !== 1 ? 's' : ''} for "${search}"`
              : `${clients.length} client${clients.length !== 1 ? 's' : ''} total`}
          </p>
        )}

        {/* Empty state */}
        {clients.length === 0 ? (
          <div className="rounded-3xl border border-stone-300 bg-white/85 py-16 text-center shadow-[0_24px_60px_-36px_rgba(120,53,15,0.35)] backdrop-blur-sm">
            <p className="text-sm font-medium text-slate-800">
              {search ? 'No matching clients' : 'No clients yet'}
            </p>
            <p className="mt-1 text-xs text-stone-500">
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
                  className="flex items-start gap-3 rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 shadow-[0_16px_40px_-30px_rgba(120,53,15,0.35)] transition hover:border-orange-300 hover:bg-orange-50/70"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800">
                    {getInitials(client.firstName, client.lastName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {client.firstName} {client.lastName}
                      </p>
                      <span className="shrink-0 text-xs text-stone-400">
                        #{client.id}
                      </span>
                    </div>
                    <div className="mt-0.5 space-y-1 text-xs text-slate-700">
                      {client.email && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-3 w-3 shrink-0 text-orange-300"
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
                            className="h-3 w-3 shrink-0 text-orange-300"
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
                          {formatPhoneNumber(client.phone)}
                        </span>
                      )}
                    </div>
                    {client.note?.trim() && (
                      <p className="mt-1 flex items-center gap-1 truncate text-xs text-stone-500">
                        <svg
                          className="h-3 w-3 shrink-0 text-orange-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.75}
                            d="M19.5 14.25v-8.25a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6v12a2.25 2.25 0 0 0 2.25 2.25h6.75m6-6-3 3m0 0-3-3m3 3V9"
                          />
                        </svg>
                        {client.note}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-3xl border border-stone-300 bg-white/90 shadow-[0_24px_60px_-36px_rgba(120,53,15,0.35)] backdrop-blur-sm md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900">
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      ID
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      Name
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      Email
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      Phone
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="relative transition hover:bg-orange-50/70"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs font-medium text-stone-400">
                        <Link
                          href={`/clients/${client.id}`}
                          className="absolute inset-0"
                          aria-label={`View ${client.firstName} ${client.lastName}`}
                        />
                        #{client.id}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-800">
                            {getInitials(client.firstName, client.lastName)}
                          </div>
                          <span className="font-medium text-slate-900">
                            {client.firstName} {client.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {client.email ? (
                          <span className="flex items-center gap-1.5">
                            <svg
                              className="h-3.5 w-3.5 shrink-0 text-orange-300"
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
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-700">
                        {client.phone ? (
                          <span className="flex items-center gap-1.5">
                            <svg
                              className="h-3.5 w-3.5 shrink-0 text-orange-300"
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
                            {formatPhoneNumber(client.phone)}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                      <td className="max-w-xs px-5 py-3.5 text-stone-500">
                        {client.note?.trim() ? (
                          <span className="flex items-center gap-1.5">
                            <svg
                              className="h-3.5 w-3.5 shrink-0 text-orange-300"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.75}
                                d="M19.5 14.25v-8.25a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6v12a2.25 2.25 0 0 0 2.25 2.25h6.75m6-6-3 3m0 0-3-3m3 3V9"
                              />
                            </svg>
                            <span className="truncate">{client.note}</span>
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col gap-3 px-1 py-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="mt-1 text-sm text-stone-600">
                    Showing{' '}
                    <span className="font-semibold text-slate-900">
                      {pageStart}
                    </span>{' '}
                    -{' '}
                    <span className="font-semibold text-slate-900">
                      {pageEnd}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-slate-900">
                      {total}
                    </span>{' '}
                    clients
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <Link
                    href={getClientsPageHref(search, currentPage - 1)}
                    aria-disabled={!canGoToPreviousPage}
                    className={`inline-flex w-28 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                      canGoToPreviousPage
                        ? 'border border-stone-300 bg-white text-stone-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800'
                        : 'pointer-events-none border border-stone-200 bg-stone-50 text-stone-300'
                    }`}
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
                    Previous
                  </Link>

                  <div className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800">
                    Page {currentPage}
                    <span className="ml-1 font-normal text-orange-600">
                      of {totalPages}
                    </span>
                  </div>

                  <Link
                    href={getClientsPageHref(search, currentPage + 1)}
                    aria-disabled={!canGoToNextPage}
                    className={`inline-flex w-28 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                      canGoToNextPage
                        ? 'border border-stone-300 bg-white text-stone-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800'
                        : 'pointer-events-none border border-stone-200 bg-stone-50 text-stone-300'
                    }`}
                  >
                    Next
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
                        d="M8.25 4.5 15.75 12l-7.5 7.5"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
