export type OrderClient = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
};

export type OrderMenuItem = {
  id: number;
  name: string;
  subtitle: string | null;
};

export type OrderLine = {
  id: number;
  menuItemId: number;
  quantity: number;
  price: number;
  note: string | null;
  menuItem?: OrderMenuItem | null;
};

export type Order = {
  id: number;
  clientId: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  deliveryDate: string | null;
  discount: number | null;
  status: string;
  note: string | null;
  client?: OrderClient | null;
  items?: OrderLine[];
};

export type OrdersResponse = {
  data: Order[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type OrderListFilters = {
  status?: string;
  page?: number;
  search?: string;
  createdFrom?: string;
  createdTo?: string;
};

type ClientsResponse = {
  data: ClientOption[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type MenuItemsResponse = {
  data: MenuItemOption[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ClientOption = {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
};

export type MenuItemOption = {
  id: number;
  name: string;
  subtitle: string | null;
  price: number;
};

export const ORDER_STATUS_FILTERS = [
  'all',
  'pending',
  'confirmed',
  'completed',
  'cancelled',
] as const;

export const ORDER_STATUS_VALUES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
] as const;

export const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';

export async function getOrders({
  status,
  page,
  search,
  createdFrom,
  createdTo,
}: OrderListFilters): Promise<OrdersResponse> {
  const query = new URLSearchParams();
  if (status && status !== 'all') query.set('status', status);
  if (page && page > 1) query.set('page', String(page));
  if (search?.trim()) query.set('search', search.trim());
  if (createdFrom?.trim()) query.set('createdFrom', createdFrom.trim());
  if (createdTo?.trim()) query.set('createdTo', createdTo.trim());

  const response = await fetch(`${API_BASE_URL}/orders?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  return response.json();
}

export async function getOrder(id: string): Promise<Order | null> {
  const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch order');
  }

  return response.json();
}

export async function getClients(): Promise<ClientOption[]> {
  const query = new URLSearchParams({
    limit: '200',
    sortBy: 'firstName',
    order: 'asc',
  });

  const response = await fetch(`${API_BASE_URL}/clients?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }

  const data: ClientsResponse = await response.json();
  return data.data;
}

export async function getMenuItems(): Promise<MenuItemOption[]> {
  const query = new URLSearchParams({
    limit: '200',
    sortBy: 'name',
    order: 'asc',
  });

  const response = await fetch(
    `${API_BASE_URL}/menu-items?${query.toString()}`,
    {
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error('Failed to fetch menu items');
  }

  const data: MenuItemsResponse = await response.json();
  return data.data;
}

export function getOrdersPageHref({
  status,
  page,
  search,
  createdFrom,
  createdTo,
}: OrderListFilters) {
  const query = new URLSearchParams();
  if (status && status !== 'all') query.set('status', status);
  if (page && page > 1) query.set('page', String(page));
  if (search?.trim()) query.set('search', search.trim());
  if (createdFrom?.trim()) query.set('createdFrom', createdFrom.trim());
  if (createdTo?.trim()) query.set('createdTo', createdTo.trim());
  const queryString = query.toString();
  return queryString ? `/orders?${queryString}` : '/orders';
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateInput(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

export function getClientDisplayName(client?: OrderClient | null) {
  if (!client) return 'Unknown client';
  return `${client.firstName} ${client.lastName}`;
}

export function getOrderItemCount(order: Order) {
  return order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}
