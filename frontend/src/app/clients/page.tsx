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

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';

async function getClients(search: string): Promise<ClientsResponse> {
  const query = new URLSearchParams();

  if (search) {
    query.set('search', search);
  }

  const response = await fetch(`${API_BASE_URL}/clients?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }

  return response.json();
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
      <main className="min-h-screen bg-slate-100 px-6 py-10 md:px-10">
        <div className="mx-auto max-w-5xl rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Clients
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Unable to load clients from the API.
          </p>
        </div>
      </main>
    );
  }

  const { data: clients, total, page, totalPages } = result.data;

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl bg-slate-900 px-5 py-6 text-white shadow-xl md:px-8 md:py-10">
          <div className="mt-2 flex flex-col gap-4 md:mt-5 md:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                Clients
              </h1>
              <p className="mt-2 text-sm leading-5 text-slate-300 md:mt-3 md:text-base md:leading-6">
                View active client records pulled from the backend API.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur-sm md:p-4">
                <p className="text-xs text-slate-300 md:text-sm">
                  Total clients
                </p>
                <p className="mt-1 text-xl font-semibold text-white md:mt-2 md:text-2xl">
                  {total}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 backdrop-blur-sm md:p-4">
                <p className="text-xs text-slate-300 md:text-sm">
                  Current page
                </p>
                <p className="mt-1 text-xl font-semibold text-white md:mt-2 md:text-2xl">
                  {page}
                  <span className="ml-1 text-xs font-medium text-slate-300 md:ml-2 md:text-sm">
                    of {totalPages}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <form
            className="flex flex-col gap-3 md:flex-row md:items-center"
            action="/clients"
            method="get"
          >
            <div className="flex-1">
              <label
                htmlFor="client-search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search clients
              </label>
              <input
                id="client-search"
                name="search"
                type="search"
                defaultValue={search}
                placeholder="Search by ID, name, email, phone, or note"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-500"
              />
            </div>

            <div className="flex gap-3 md:self-end">
              <button
                type="submit"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Search
              </button>
              {search ? (
                <a
                  href="/clients"
                  className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Clear
                </a>
              ) : null}
            </div>
          </form>
        </section>

        {clients.length === 0 ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              {search ? 'No matching clients found' : 'No clients found'}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {search
                ? 'Try a different search term or clear the filter to view all clients.'
                : 'The API request succeeded, but there are no client records to display yet.'}
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Client list
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? `Showing ${clients.length} matching records on this page.`
                  : `Showing ${clients.length} records on this page.`}
              </p>
            </div>

            <div className="space-y-4 p-4 md:hidden">
              {clients.map((client) => (
                <article
                  key={client.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">
                        {client.firstName} {client.lastName}
                      </h3>
                    </div>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      #{client.id}
                    </span>
                  </div>

                  <dl className="mt-5 space-y-4">
                    <div>
                      <dd className="mt-1 text-sm text-slate-700">
                        {client.email || 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dd className="mt-1 text-sm text-slate-700">
                        {client.phone || 'N/A'}
                      </dd>
                    </div>
                    {client.note?.trim() ? (
                      <div>
                        <dd className="mt-1 text-sm leading-6 text-slate-700">
                          {client.note}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      ID
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Name
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {clients.map((client) => (
                    <tr key={client.id} className="align-top hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        #{client.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {client.firstName} {client.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {client.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {client.phone || 'N/A'}
                      </td>
                      <td className="max-w-xs px-6 py-4 text-sm text-slate-600">
                        {client.note?.trim() || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
