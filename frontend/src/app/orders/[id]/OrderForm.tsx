'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ClientOption,
  formatCurrency,
  MenuItemOption,
  ORDER_STATUS_VALUES,
} from '../data';

const API_BASE_URL = '/api';

type OrderLineFields = {
  menuItemId: string;
  quantity: string;
  note: string;
};

type Fields = {
  clientId: string;
  status: string;
  deliveryDate: string;
  discount: string;
  note: string;
  items: OrderLineFields[];
};

type OrderFormProps = {
  mode: 'create' | 'edit';
  initial: Fields;
  orderId?: number;
  clients: ClientOption[];
  menuItems: MenuItemOption[];
  cancelHref: string;
  clientFieldMode?: 'select' | 'searchable';
};

function getClientFullName(client: ClientOption) {
  return `${client.firstName} ${client.lastName}`;
}

function formatPhoneNumber(phone: string | null | undefined) {
  if (!phone) {
    return 'No phone';
  }

  const digits = phone.replace(/\D/g, '');

  if (digits.length !== 10) {
    return phone;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function matchesClientSearch(client: ClientOption, value: string) {
  const normalizedValue = value.trim().toLowerCase();
  const phoneDigits = value.replace(/\D/g, '');

  if (!normalizedValue) {
    return true;
  }

  const fullName = getClientFullName(client).toLowerCase();
  const clientPhone = client.phone ?? '';
  const clientPhoneDigits = clientPhone.replace(/\D/g, '');

  return (
    fullName.includes(normalizedValue) ||
    clientPhone.toLowerCase().includes(normalizedValue) ||
    (phoneDigits.length > 0 && clientPhoneDigits.includes(phoneDigits))
  );
}

function getEmptyLineItem(): OrderLineFields {
  return {
    menuItemId: '',
    quantity: '1',
    note: '',
  };
}

export default function OrderForm({
  mode,
  initial,
  orderId,
  clients,
  menuItems,
  cancelHref,
  clientFieldMode = 'select',
}: OrderFormProps) {
  const router = useRouter();
  const [fields, setFields] = useState<Fields>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [isClientListOpen, setClientListOpen] = useState(false);

  const selectedClient = clients.find(
    (client) => String(client.id) === fields.clientId,
  );
  const clientInputValue = isClientListOpen
    ? clientSearch
    : selectedClient
      ? getClientFullName(selectedClient)
      : clientSearch;
  const filteredClients = clients.filter((client) =>
    matchesClientSearch(client, clientSearch),
  );

  function openClientList() {
    setClientListOpen(true);

    if (selectedClient && !clientSearch.trim()) {
      setClientSearch('');
    }
  }

  function closeClientList() {
    setClientListOpen(false);
    setClientSearch('');
  }

  function selectClient(client: ClientOption) {
    set('clientId', String(client.id));
    setClientSearch('');
    setClientListOpen(false);
  }

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function updateItem(
    index: number,
    key: keyof OrderLineFields,
    value: string,
  ) {
    setFields((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function addItem() {
    set('items', [...fields.items, getEmptyLineItem()]);
  }

  function removeItem(index: number) {
    set(
      'items',
      fields.items.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  const subtotal = fields.items.reduce((sum, item) => {
    const menuItem = menuItems.find(
      (entry) => String(entry.id) === item.menuItemId,
    );
    const quantity = Number(item.quantity);

    if (!menuItem || !Number.isFinite(quantity) || quantity < 1) {
      return sum;
    }

    return sum + menuItem.price * quantity;
  }, 0);

  const parsedDiscount = Number(fields.discount || '0');
  const discount =
    Number.isFinite(parsedDiscount) && parsedDiscount > 0 ? parsedDiscount : 0;
  const estimatedTotal = Math.max(0, subtotal - discount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    const nextErrors: string[] = [];
    const normalizedClientId = fields.clientId.trim();
    const normalizedDiscount = fields.discount.trim();

    if (!normalizedClientId) {
      nextErrors.push('Client is required');
    }

    if (!fields.status.trim()) {
      nextErrors.push('Status is required');
    }

    if (fields.items.length === 0) {
      nextErrors.push('Add at least one order item');
    }

    const seenMenuItemIds = new Set<string>();
    for (const [index, item] of fields.items.entries()) {
      if (!item.menuItemId.trim()) {
        nextErrors.push(`Line ${index + 1}: menu item is required`);
      }

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        nextErrors.push(
          `Line ${index + 1}: quantity must be a positive whole number`,
        );
      }

      if (item.menuItemId && seenMenuItemIds.has(item.menuItemId)) {
        nextErrors.push('Each menu item can only be added once');
      }

      if (item.menuItemId) {
        seenMenuItemIds.add(item.menuItemId);
      }
    }

    if (
      normalizedDiscount &&
      (!Number.isFinite(parsedDiscount) || parsedDiscount < 0)
    ) {
      nextErrors.push('Discount must be a non-negative number');
    }

    if (nextErrors.length > 0) {
      setErrors([...new Set(nextErrors)]);
      setLoading(false);
      return;
    }

    try {
      const isEditing = mode === 'edit' && typeof orderId === 'number';
      const endpoint = isEditing
        ? `${API_BASE_URL}/orders/${orderId}`
        : `${API_BASE_URL}/orders`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: Number(normalizedClientId),
          status: fields.status.trim().toLowerCase(),
          deliveryDate: fields.deliveryDate || null,
          discount: normalizedDiscount ? Number(normalizedDiscount) : 0,
          note: fields.note.trim() || null,
          items: fields.items.map((item) => ({
            menuItemId: Number(item.menuItemId),
            quantity: Number(item.quantity),
            note: item.note.trim() || null,
          })),
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(body?.errors ?? [body?.error ?? 'Failed to save order']);
        return;
      }

      const nextOrderId = isEditing ? orderId : body?.id;
      router.push(nextOrderId ? `/orders/${nextOrderId}` : '/orders');
      router.refresh();
    } catch {
      setErrors(['Something went wrong. Please try again.']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <section className="space-y-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
            Order Details
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Client <span className="text-red-400">*</span>
              </label>
              {clientFieldMode === 'searchable' ? (
                <div className="relative mt-1.5">
                  <div className="flex items-center gap-2 rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm transition focus-within:border-orange-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100">
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
                      id="client-search"
                      type="search"
                      value={clientInputValue}
                      onChange={(e) => setClientSearch(e.target.value)}
                      onFocus={openClientList}
                      onBlur={closeClientList}
                      placeholder="Search by client name or phone"
                      className="flex-1 bg-transparent text-sm text-slate-900 placeholder-stone-400 outline-none"
                    />
                    <svg
                      className={`h-4 w-4 shrink-0 text-stone-400 transition ${
                        isClientListOpen ? 'rotate-180' : ''
                      }`}
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
                  </div>

                  <p className="mt-1.5 min-h-[1rem] text-xs text-stone-500">
                    {selectedClient
                      ? `${getClientFullName(selectedClient)} • ${formatPhoneNumber(selectedClient.phone)}`
                      : 'Select a client to attach this order.'}
                  </p>

                  {isClientListOpen ? (
                    <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_20px_45px_-30px_rgba(15,23,42,0.35)]">
                      <div className="max-h-64 overflow-y-auto">
                        {filteredClients.length > 0 ? (
                          <div className="divide-y divide-stone-100">
                            {filteredClients.map((client) => {
                              const isSelected = String(client.id) === fields.clientId;

                              return (
                                <button
                                  key={client.id}
                                  type="button"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => selectClient(client)}
                                  className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition ${
                                    isSelected
                                      ? 'bg-orange-50'
                                      : 'hover:bg-stone-50'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-900">
                                      {getClientFullName(client)}
                                    </p>
                                    <p className="mt-0.5 text-xs text-stone-500">
                                      {formatPhoneNumber(client.phone)}
                                    </p>
                                  </div>
                                  {isSelected ? (
                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-700">
                                      Current
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="px-3 py-4 text-sm text-stone-500">
                            No clients match that name or phone number.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <select
                  required
                  value={fields.clientId}
                  onChange={(e) => set('clientId', e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={String(client.id)}>
                      {getClientFullName(client)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Status <span className="text-red-400">*</span>
              </label>
              <select
                required
                value={fields.status}
                onChange={(e) => set('status', e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm capitalize text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              >
                {ORDER_STATUS_VALUES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Delivery date
              </label>
              <input
                type="date"
                value={fields.deliveryDate}
                onChange={(e) => set('deliveryDate', e.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-stone-50/80 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                Discount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={fields.discount}
                onChange={(e) => set('discount', e.target.value)}
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
        </div>
      </section>

      <section className="space-y-4 border-t border-stone-200 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              Line Items
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Add menu items and quantities to build the order.
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-800 transition hover:border-orange-300 hover:bg-orange-100"
          >
            Add item
          </button>
        </div>

        <div className="space-y-3">
          {fields.items.map((item, index) => {
            const selectedMenuItem = menuItems.find(
              (entry) => String(entry.id) === item.menuItemId,
            );
            const quantity = Number(item.quantity);
            const lineTotal =
              selectedMenuItem && Number.isFinite(quantity) && quantity > 0
                ? selectedMenuItem.price * quantity
                : 0;

            return (
              <div
                key={`${index}-${item.menuItemId}`}
                className="rounded-2xl border border-stone-300 bg-stone-50/70 p-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Menu item <span className="text-red-400">*</span>
                    </label>
                    <select
                      required
                      value={item.menuItemId}
                      onChange={(e) =>
                        updateItem(index, 'menuItemId', e.target.value)
                      }
                      className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="">Select an item</option>
                      {menuItems.map((menuItem) => (
                        <option key={menuItem.id} value={String(menuItem.id)}>
                          {menuItem.name} ({formatCurrency(menuItem.price)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Quantity <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, 'quantity', e.target.value)
                      }
                      className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Line note
                    </label>
                    <input
                      type="text"
                      maxLength={1000}
                      value={item.note}
                      onChange={(e) =>
                        updateItem(index, 'note', e.target.value)
                      }
                      className="mt-1.5 w-full rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-200 pt-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Line total
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatCurrency(lineTotal)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={fields.items.length === 1}
                    className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-300 bg-white/90 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
          Summary
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Subtotal
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {formatCurrency(subtotal)}
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Discount
            </p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {formatCurrency(discount)}
            </p>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-700">
              Estimated total
            </p>
            <p className="mt-1 text-base font-semibold text-orange-900">
              {formatCurrency(estimatedTotal)}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-5">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full bg-orange-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-800 disabled:opacity-60"
        >
          {loading
            ? 'Saving…'
            : mode === 'create'
              ? 'Create order'
              : 'Save changes'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => router.push(cancelHref)}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-orange-200 hover:text-orange-800 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
