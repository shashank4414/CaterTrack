import Link from 'next/link';
import OrderForm from '../[id]/OrderForm';
import { getClients, getMenuItems } from '../data';

type NewOrderPageProps = {
  searchParams?: Promise<{
    clientId?: string | string[];
    from?: string | string[];
  }>;
};

export default async function NewOrderPage({
  searchParams,
}: NewOrderPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawClientId = Array.isArray(resolvedSearchParams?.clientId)
    ? resolvedSearchParams.clientId[0]?.trim() || ''
    : resolvedSearchParams?.clientId?.trim() || '';
  const rawFrom = Array.isArray(resolvedSearchParams?.from)
    ? resolvedSearchParams.from[0]?.trim() || ''
    : resolvedSearchParams?.from?.trim() || '';

  const [clients, menuItems] = await Promise.all([
    getClients().catch(() => []),
    getMenuItems().catch(() => []),
  ]);
  const initialClientId = clients.some(
    (client) => String(client.id) === rawClientId,
  )
    ? rawClientId
    : '';
  const cancelHref = rawFrom.startsWith('/') ? rawFrom : '/orders';
  const missingClients = clients.length === 0;
  const missingMenuItems = menuItems.length === 0;

  return (
    <main className="px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href={cancelHref}
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
          {cancelHref.startsWith('/clients/') ? 'Client' : 'Orders'}
        </Link>

        <section className="rounded-3xl border border-stone-300 bg-white/88 p-6 shadow-[0_24px_60px_-36px_rgba(120,53,15,0.4)] backdrop-blur-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-700">
            Order Editor
          </p>
          <h1 className="mt-2 text-lg font-bold text-slate-900">
            Create order
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            Build an order from a client, line items, and delivery details.
          </p>

          {missingClients || missingMenuItems ? (
            <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm text-orange-900">
              <p className="font-semibold">Order setup is incomplete</p>
              <p className="mt-1 text-xs text-orange-800">
                {missingClients && missingMenuItems
                  ? 'Create at least one client and one menu item before creating an order.'
                  : missingClients
                    ? 'Create at least one client before creating an order.'
                    : 'Create at least one menu item before creating an order.'}
              </p>
            </div>
          ) : (
            <div className="mt-5 border-t border-stone-200 pt-5">
              <OrderForm
                mode="create"
                clients={clients}
                menuItems={menuItems}
                cancelHref={cancelHref}
                initial={{
                  clientId: initialClientId,
                  status: 'pending',
                  deliveryDate: '',
                  discount: '',
                  note: '',
                  items: [
                    {
                      menuItemId: '',
                      quantity: '1',
                      note: '',
                    },
                  ],
                }}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
