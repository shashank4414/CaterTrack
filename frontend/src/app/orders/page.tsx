import Link from 'next/link';
import {
  formatCurrency,
  formatDate,
  getClientDisplayName,
  getOrderItemCount,
  getOrders,
  getOrdersPageHref,
  ORDER_STATUS_FILTERS,
  ORDER_STATUS_STYLES,
} from './data';

type OrdersPageProps = {
  searchParams?: Promise<{
    status?: string | string[];
    page?: string | string[];
    search?: string | string[];
    createdFrom?: string | string[];
    createdTo?: string | string[];
  }>;
};

const FILTER_LABELS: Record<string, string> = {
  all: 'All orders',
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const resolvedSearchParams = await searchParams;

  const rawStatus = Array.isArray(resolvedSearchParams?.status)
    ? resolvedSearchParams.status[0]?.trim().toLowerCase() || 'all'
    : resolvedSearchParams?.status?.trim().toLowerCase() || 'all';
  const status = ORDER_STATUS_FILTERS.includes(
    rawStatus as (typeof ORDER_STATUS_FILTERS)[number],
  )
    ? rawStatus
    : 'all';
  const rawPage = Array.isArray(resolvedSearchParams?.page)
    ? resolvedSearchParams.page[0]?.trim() || '1'
    : resolvedSearchParams?.page?.trim() || '1';
  const page = Math.max(1, Number(rawPage) || 1);
  const search = Array.isArray(resolvedSearchParams?.search)
    ? resolvedSearchParams.search[0]?.trim() || ''
    : resolvedSearchParams?.search?.trim() || '';
  const createdFrom = Array.isArray(resolvedSearchParams?.createdFrom)
    ? resolvedSearchParams.createdFrom[0]?.trim() || ''
    : resolvedSearchParams?.createdFrom?.trim() || '';
  const createdTo = Array.isArray(resolvedSearchParams?.createdTo)
    ? resolvedSearchParams.createdTo[0]?.trim() || ''
    : resolvedSearchParams?.createdTo?.trim() || '';

  const result = await getOrders({
    status,
    page,
    search,
    createdFrom,
    createdTo,
  })
    .then((data) => ({ data, error: false }))
    .catch(() => ({ data: null, error: true }));

  if (result.error || !result.data) {
    return (
      <main className="px-4 py-12 sm:px-8">
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
            Unable to load orders
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            The API request failed. Please try again.
          </p>
        </div>
      </main>
    );
  }

  const {
    data: orders,
    total,
    page: currentPage,
    totalPages,
    limit,
  } = result.data;
  const pageStart = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const pageEnd = total === 0 ? 0 : pageStart + orders.length - 1;
  const canGoToPreviousPage = currentPage > 1;
  const canGoToNextPage = currentPage < totalPages;
  const hasSearch = Boolean(search);
  const hasDateRange = Boolean(createdFrom || createdTo);
  const hasFilters = status !== 'all' || hasSearch || hasDateRange;
  const resultsLabel =
    status === 'all'
      ? `${orders.length} order${orders.length !== 1 ? 's' : ''} shown`
      : `${orders.length} ${status} order${orders.length !== 1 ? 's' : ''} shown`;
  const mobileSummaryLabel =
    orders.length > 0
      ? resultsLabel
      : status === 'all'
        ? 'No orders yet'
        : `No ${status} orders`;

  return (
    <main className="px-4 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-orange-700">
              Order Workflow
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Orders
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Manage active work, delivery dates, and line-item totals.
            </p>
          </div>
          <Link
            href="/orders/new"
            className="hidden items-center justify-center gap-1.5 rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-sm font-semibold text-orange-800 shadow-[0_12px_28px_-24px_rgba(120,53,15,0.5)] transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-900 sm:inline-flex"
          >
            <svg
              className="h-4 w-4 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            New order
          </Link>
        </header>

        <div className="flex flex-wrap gap-2">
          {ORDER_STATUS_FILTERS.map((filter) => {
            const isActive = filter === status;

            return (
              <Link
                key={filter}
                href={getOrdersPageHref({
                  status: filter,
                  page: 1,
                  search,
                  createdFrom,
                  createdTo,
                })}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? 'border-orange-300 bg-orange-100 text-orange-900'
                    : 'border-stone-300 bg-white/90 text-stone-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800'
                }`}
              >
                {FILTER_LABELS[filter]}
              </Link>
            );
          })}
        </div>

        <details
          className="group rounded-3xl border border-stone-300 bg-white/88 shadow-[0_24px_60px_-36px_rgba(120,53,15,0.35)] backdrop-blur-sm sm:hidden"
          open={hasSearch || hasDateRange}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-900 marker:hidden sm:hidden">
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M3 4.5h18m-15 7.5h12m-9 7.5h6"
                />
              </svg>
              Filters
              {hasSearch || hasDateRange ? (
                <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-800">
                  Active
                </span>
              ) : null}
            </span>
            <svg
              className="h-4 w-4 text-stone-400 transition group-open:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="m6 9 6 6 6-6"
              />
            </svg>
          </summary>

          <form method="get" className="hidden p-4 group-open:block">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_auto] lg:items-end">
              <div>
                <label
                  htmlFor="order-search"
                  className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500"
                >
                  Search client name
                </label>
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-stone-300 bg-stone-50/80 px-4 py-2 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
                  <svg
                    className="h-4 w-4 shrink-0 text-orange-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.15 10.15Z"
                    />
                  </svg>
                  <input
                    id="order-search"
                    name="search"
                    type="search"
                    defaultValue={search}
                    placeholder="Search by first or last name"
                    className="flex-1 bg-transparent py-1 text-sm text-slate-900 placeholder-stone-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="created-from"
                  className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500"
                >
                  Created from
                </label>
                <input
                  id="created-from"
                  name="createdFrom"
                  type="date"
                  defaultValue={createdFrom}
                  className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label
                  htmlFor="created-to"
                  className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500"
                >
                  Created to
                </label>
                <input
                  id="created-to"
                  name="createdTo"
                  type="date"
                  defaultValue={createdTo}
                  className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                {status !== 'all' ? (
                  <input type="hidden" name="status" value={status} />
                ) : null}
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:border-orange-300 hover:bg-orange-100 hover:text-orange-900"
                >
                  Apply filters
                </button>
                {hasSearch || hasDateRange ? (
                  <Link
                    href={getOrdersPageHref({ status, page: 1 })}
                    className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800"
                  >
                    Clear
                  </Link>
                ) : null}
              </div>
            </div>
          </form>
        </details>

        <form
          method="get"
          className="hidden rounded-3xl border border-stone-300 bg-white/88 p-4 shadow-[0_24px_60px_-36px_rgba(120,53,15,0.35)] backdrop-blur-sm sm:block"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_auto] lg:items-end">
            <div>
              <label
                htmlFor="order-search-desktop"
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500"
              >
                Search client name
              </label>
              <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-stone-300 bg-stone-50/80 px-4 py-2 transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
                <svg
                  className="h-4 w-4 shrink-0 text-orange-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.5 6.5a7.5 7.5 0 0 0 10.15 10.15Z"
                  />
                </svg>
                <input
                  id="order-search-desktop"
                  name="search"
                  type="search"
                  defaultValue={search}
                  placeholder="Search by first or last name"
                  className="flex-1 bg-transparent py-1 text-sm text-slate-900 placeholder-stone-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="created-from-desktop"
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500"
              >
                Created from
              </label>
              <input
                id="created-from-desktop"
                name="createdFrom"
                type="date"
                defaultValue={createdFrom}
                className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="created-to-desktop"
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500"
              >
                Created to
              </label>
              <input
                id="created-to-desktop"
                name="createdTo"
                type="date"
                defaultValue={createdTo}
                className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {status !== 'all' ? (
                <input type="hidden" name="status" value={status} />
              ) : null}
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:border-orange-300 hover:bg-orange-100 hover:text-orange-900"
              >
                Apply filters
              </button>
              {hasSearch || hasDateRange ? (
                <Link
                  href={getOrdersPageHref({ status, page: 1 })}
                  className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800"
                >
                  Clear
                </Link>
              ) : null}
            </div>
          </div>
        </form>

        <div className="flex items-start justify-between gap-2 sm:hidden">
          <p className="min-w-0 flex-1 text-xs font-medium leading-5 tracking-wide text-stone-600">
            {mobileSummaryLabel}
          </p>
          <Link
            href="/orders/new"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-orange-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-orange-800 shadow-[0_12px_28px_-24px_rgba(120,53,15,0.5)] transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-900"
          >
            <svg
              className="h-3.5 w-3.5 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            New order
          </Link>
        </div>

        {orders.length > 0 && (
          <p className="hidden text-xs font-medium tracking-wide text-stone-600 sm:block">
            {resultsLabel}
          </p>
        )}

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-stone-300 bg-white/85 py-16 text-center shadow-[0_24px_60px_-36px_rgba(120,53,15,0.35)] backdrop-blur-sm">
            <p className="text-sm font-medium text-slate-800">
              {hasFilters
                ? 'No matching orders'
                : status === 'all'
                  ? 'No orders yet'
                  : `No ${status} orders`}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {hasFilters
                ? 'Try changing the name search or created date range.'
                : 'Orders will appear here as they move through your workflow.'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {orders.map((order) => {
                const statusStyle =
                  ORDER_STATUS_STYLES[order.status.toLowerCase()] ??
                  'bg-stone-50 text-stone-600 border-stone-200';

                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 shadow-[0_16px_40px_-30px_rgba(120,53,15,0.35)] transition hover:border-orange-300 hover:bg-orange-50/70"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {getClientDisplayName(order.client)}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500">
                          Order #{order.id}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusStyle}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-stone-600">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                          Total
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                          Items
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {getOrderItemCount(order)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                          Delivery
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {order.deliveryDate
                            ? formatDate(order.deliveryDate)
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                          Created
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-3xl border border-stone-300 bg-white/90 shadow-[0_24px_60px_-36px_rgba(120,53,15,0.35)] backdrop-blur-sm md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900">
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      ID
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      Client
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      Status
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      Items
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      Total
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      Delivery
                    </th>
                    <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/80">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((order) => {
                    const statusStyle =
                      ORDER_STATUS_STYLES[order.status.toLowerCase()] ??
                      'bg-stone-50 text-stone-600 border-stone-200';

                    return (
                      <tr
                        key={order.id}
                        className="relative transition hover:bg-orange-50/70"
                      >
                        <td className="whitespace-nowrap px-5 py-3.5 text-xs font-medium text-stone-400">
                          <Link
                            href={`/orders/${order.id}`}
                            className="absolute inset-0"
                            aria-label={`View order ${order.id}`}
                          />
                          #{order.id}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-900">
                          {getClientDisplayName(order.client)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${statusStyle}`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">
                          {getOrderItemCount(order)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-900">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-stone-500">
                          {order.deliveryDate ? (
                            formatDate(order.deliveryDate)
                          ) : (
                            <span className="text-stone-300">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-stone-500">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
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
                    orders
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <Link
                    href={getOrdersPageHref({
                      status,
                      page: currentPage - 1,
                      search,
                      createdFrom,
                      createdTo,
                    })}
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
                    href={getOrdersPageHref({
                      status,
                      page: currentPage + 1,
                      search,
                      createdFrom,
                      createdTo,
                    })}
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
