import Link from 'next/link';
import { notFound } from 'next/navigation';
import DeleteClientButton from './DeleteClientButton';

type Client = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

type Order = {
  id: number;
  clientId: number;
  total: number;
  status: string;
  deliveryDate: string | null;
  discount: number | null;
  note: string | null;
  createdAt: string;
};

type OrdersResponse = {
  data: Order[];
  total: number;
};

type ClientDetailPageProps = {
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

async function getClientOrders(id: string): Promise<OrdersResponse> {
  const res = await fetch(
    `${API_BASE_URL}/orders?clientId=${id}&limit=50&sortBy=createdAt&order=desc`,
    { cache: 'no-store' },
  );
  if (!res.ok) return { data: [], total: 0 };
  return res.json();
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { id } = await params;

  const [client, ordersResult] = await Promise.all([
    getClient(id).catch(() => null),
    getClientOrders(id).catch(() => ({ data: [], total: 0 })),
  ]);

  if (!client) notFound();

  const orders = ordersResult.data;

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl space-y-6">
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

        {/* Client hero card */}
        <section className="rounded-3xl border border-stone-300 bg-white/88 p-6 shadow-[0_24px_60px_-36px_rgba(120,53,15,0.4)] backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-800">
              {getInitials(client.firstName, client.lastName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">
                    {client.firstName} {client.lastName}
                  </h1>
                  <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                    #{client.id}
                  </span>
                </div>
                <Link
                  href={`/clients/${client.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-800 transition hover:border-orange-300 hover:bg-orange-100 hover:text-orange-900"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                    />
                  </svg>
                  Edit
                </Link>
              </div>
              <p className="mt-0.5 text-xs text-stone-500">
                Joined {formatDate(client.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-stone-200 pt-5 sm:grid-cols-2">
            {/* Email */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Email
              </p>
              {client.email ? (
                <a
                  href={`mailto:${client.email}`}
                  className="mt-1 flex items-center gap-1.5 text-sm text-slate-700 transition hover:text-orange-700"
                >
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
                </a>
              ) : (
                <p className="mt-1 text-sm text-stone-400">—</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Phone
              </p>
              {client.phone ? (
                <a
                  href={`tel:${client.phone}`}
                  className="mt-1 flex items-center gap-1.5 text-sm text-slate-700 transition hover:text-orange-700"
                >
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
                </a>
              ) : (
                <p className="mt-1 text-sm text-stone-400">—</p>
              )}
            </div>

            {/* Note */}
            {client.note?.trim() && (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Note
                </p>
                <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-700">
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-300"
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
                  <span>{client.note}</span>
                </p>
              </div>
            )}
          </div>

          {/* Metadata footer */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-stone-200 pt-4 text-xs text-stone-500">
            <span>Updated {formatDate(client.updatedAt)}</span>
          </div>
        </section>

        {/* Orders section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Orders
              {orders.length > 0 && (
                <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                  {orders.length}
                </span>
              )}
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-3xl border border-stone-300 bg-white/88 py-12 text-center shadow-[0_24px_60px_-36px_rgba(120,53,15,0.35)] backdrop-blur-sm">
              <p className="text-sm font-medium text-slate-800">
                No orders yet
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Orders for this client will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-stone-300 bg-white/88 shadow-[0_24px_60px_-36px_rgba(120,53,15,0.35)] backdrop-blur-sm">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900">
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      ID
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      Total
                    </th>
                    <th className="hidden px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80 sm:table-cell">
                      Delivery
                    </th>
                    <th className="hidden px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80 sm:table-cell">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((order) => {
                    const statusStyle =
                      STATUS_STYLES[order.status.toLowerCase()] ??
                      'bg-stone-50 text-stone-600 border-stone-200';
                    return (
                      <tr
                        key={order.id}
                        className="transition hover:bg-orange-50/70"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-stone-500">
                          #{order.id}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyle}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                          {formatCurrency(order.total)}
                          {order.discount ? (
                            <span className="ml-1.5 text-xs text-orange-700">
                              -{formatCurrency(order.discount)} off
                            </span>
                          ) : null}
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-3 text-stone-500 sm:table-cell">
                          {order.deliveryDate ? (
                            formatDate(order.deliveryDate)
                          ) : (
                            <span className="text-stone-300">—</span>
                          )}
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-3 text-stone-500 sm:table-cell">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section className="rounded-3xl border border-red-200 bg-white/88 p-6 shadow-[0_24px_60px_-36px_rgba(120,53,15,0.35)] backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-red-600">Danger zone</h2>
          <p className="mt-1 text-xs text-stone-500">
            Permanently delete this client and all associated data. This action
            cannot be undone.
          </p>
          <div className="mt-4">
            <DeleteClientButton
              clientId={client.id}
              clientName={`${client.firstName} ${client.lastName}`}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
