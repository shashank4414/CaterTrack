import prisma from '../prisma';
import { Request, Response } from 'express';

type ExistingOrderRecord = {
  id: number;
  clientId: number;
  total: number;
  status: string;
  deliveryDate: Date | null;
  discount: number | null;
  note: string | null;
  items: Array<{
    id: number;
    menuItemId: number;
    quantity: number;
    price: number;
    note: string | null;
  }>;
};

type OrderItemInput = {
  menuItemId?: number;
  quantity?: number;
  note?: string | null;
};

type PreparedOrderItem = {
  menuItemId: number;
  quantity: number;
  price: number;
  note: string | null;
};

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
] as const;

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

function normalizeNote(note: unknown) {
  return typeof note === 'string' ? note.trim() || null : null;
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function buildExistingItemInputs(
  items: ExistingOrderRecord['items'],
): OrderItemInput[] {
  return items.map((item) => ({
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    note: item.note,
  }));
}

function parseDeliveryDate(value: unknown) {
  if (value === undefined) {
    return {
      value: undefined as Date | null | undefined,
      errors: [] as string[],
    };
  }

  if (value === null || value === '') {
    return { value: null as Date | null, errors: [] as string[] };
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return {
      value: undefined as Date | null | undefined,
      errors: ['deliveryDate must be a valid date'],
    };
  }

  return { value: parsed, errors: [] as string[] };
}

function getQueryString(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] ?? '').trim();
  }

  return String(value ?? '').trim();
}

function parseQueryDate(value: unknown, endOfDay: boolean) {
  const rawValue = getQueryString(value);

  if (!rawValue) {
    return null;
  }

  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999);
  } else {
    parsed.setHours(0, 0, 0, 0);
  }

  return parsed;
}

async function prepareOrderItems(
  items: OrderItemInput[] | undefined,
  requireItems: boolean,
): Promise<{ items: PreparedOrderItem[]; errors: string[] }> {
  const errors: string[] = [];

  if (items === undefined) {
    if (requireItems) {
      errors.push('At least one order item is required');
    }
    return { items: [], errors };
  }

  if (!Array.isArray(items) || items.length === 0) {
    errors.push('At least one order item is required');
    return { items: [], errors };
  }

  const parsedItems: Array<{
    menuItemId: number;
    quantity: number;
    note: string | null;
  }> = [];
  const seenMenuItemIds = new Set<number>();

  items.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push(`Item ${index + 1} is invalid`);
      return;
    }

    if (
      typeof item.menuItemId !== 'number' ||
      !Number.isInteger(item.menuItemId) ||
      item.menuItemId < 1
    ) {
      errors.push(`Item ${index + 1} must include a valid menu item`);
      return;
    }

    if (
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      errors.push(`Item ${index + 1} must include a positive quantity`);
      return;
    }

    if (typeof item.note === 'string' && item.note.trim().length > 1000) {
      errors.push(`Item ${index + 1} note must be less than 1000 characters`);
      return;
    }

    if (seenMenuItemIds.has(item.menuItemId)) {
      errors.push('Each menu item can only be added once');
      return;
    }

    seenMenuItemIds.add(item.menuItemId);
    parsedItems.push({
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      note: normalizeNote(item.note),
    });
  });

  if (parsedItems.length === 0) {
    return { items: [], errors };
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: {
        in: parsedItems.map((item) => item.menuItemId),
      },
    },
    select: {
      id: true,
      price: true,
    },
  });

  const menuItemMap = new Map(
    menuItems.map((menuItem) => [menuItem.id, menuItem]),
  );

  const preparedItems = parsedItems.flatMap((item) => {
    const menuItem = menuItemMap.get(item.menuItemId);
    if (!menuItem) {
      errors.push(`Menu item ${item.menuItemId} not found`);
      return [];
    }

    return [
      {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        note: item.note,
      },
    ];
  });

  return { items: preparedItems, errors };
}

function calculateOrderTotal(items: PreparedOrderItem[], discount: number) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return roundCurrency(Math.max(0, subtotal - discount));
}

/**
 * GET /orders - Get all orders, filter, sort, pagination
 */
export const orders = async (req: Request, res: Response) => {
  try {
    const {
      clientId,
      search,
      status,
      createdFrom,
      createdTo,
      sortBy = 'createdAt',
      order = 'asc',
      page = '1',
      limit = '10',
    } = req.query;

    const searchTerms = getQueryString(search)
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(Boolean);
    const createdFromDate = parseQueryDate(createdFrom, false);
    const createdToDate = parseQueryDate(createdTo, true);

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const sortFields = Array.isArray(sortBy) ? sortBy : [sortBy];
    const sortOrders = Array.isArray(order) ? order : [order];

    const orderBy = sortFields.map((field, index) => ({
      [field as string]: sortOrders[index] === 'desc' ? 'desc' : 'asc',
    }));

    const createdAtFilter =
      createdFromDate || createdToDate
        ? {
            createdAt: {
              ...(createdFromDate ? { gte: createdFromDate } : {}),
              ...(createdToDate ? { lte: createdToDate } : {}),
            },
          }
        : {};

    const clientSearchFilter =
      searchTerms.length > 0
        ? {
            AND: searchTerms.map((term) => ({
              OR: [
                {
                  client: {
                    firstName: {
                      contains: term,
                    },
                  },
                },
                {
                  client: {
                    lastName: {
                      contains: term,
                    },
                  },
                },
              ],
            })),
          }
        : {};

    const where: any = {
      AND: [
        clientId ? { clientId: Number(clientId) } : {},
        status ? { status: String(status) } : {},
        clientSearchFilter,
        createdAtFilter,
      ],
    };

    const orders = await prisma.order.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          select: {
            id: true,
            menuItemId: true,
            quantity: true,
            price: true,
          },
        },
      },
    });

    const total = await prisma.order.count({ where });

    res.json({
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      data: orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

/**
 * POST /orders - Create a new order with nested items.
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      clientId,
      status = 'pending',
      deliveryDate,
      discount = 0,
      note,
      items,
    } = req.body;

    const normalizedStatus =
      typeof status === 'string' ? normalizeStatus(status) : status;
    const validation = await validateOrder(
      {
        clientId,
        status: normalizedStatus,
        discount,
        note,
        items,
      },
      { requireItems: true },
    );
    const preparedItems = await prepareOrderItems(items, true);
    const parsedDeliveryDate = parseDeliveryDate(deliveryDate);

    const errors = [
      ...validation.errors,
      ...preparedItems.errors,
      ...parsedDeliveryDate.errors,
    ];

    if (errors.length > 0) {
      return res.status(400).json({ errors: [...new Set(errors)] });
    }

    const normalizedDiscount = typeof discount === 'number' ? discount : 0;
    const total = calculateOrderTotal(preparedItems.items, normalizedDiscount);

    const newOrder = await prisma.order.create({
      data: {
        clientId,
        status: normalizedStatus,
        total,
        deliveryDate:
          parsedDeliveryDate.value === undefined
            ? null
            : parsedDeliveryDate.value,
        discount: normalizedDiscount,
        note: normalizeNote(note),
        items: {
          create: preparedItems.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            note: item.note,
          })),
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          select: {
            id: true,
            menuItemId: true,
            quantity: true,
            price: true,
            note: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                subtitle: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /orders/:id - Get order by ID.
 */
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          select: {
            id: true,
            menuItemId: true,
            quantity: true,
            price: true,
            note: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                subtitle: true,
              },
            },
          },
        },
      },
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /orders/:id - Update an order and replace its nested items.
 */
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clientId, status, deliveryDate, discount, note, items } = req.body;

    const existingOrder = (await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        items: {
          select: {
            id: true,
            menuItemId: true,
            quantity: true,
            price: true,
            note: true,
          },
        },
      },
    })) as ExistingOrderRecord | null;

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const nextClientId =
      clientId !== undefined ? clientId : existingOrder.clientId;
    const nextStatus =
      status !== undefined
        ? typeof status === 'string'
          ? normalizeStatus(status)
          : status
        : existingOrder.status;
    const nextDiscount =
      discount !== undefined ? discount : (existingOrder.discount ?? 0);
    const nextNote = note !== undefined ? note : existingOrder.note;
    const nextItems =
      items !== undefined
        ? items
        : buildExistingItemInputs(existingOrder.items);

    const validation = await validateOrder(
      {
        clientId: nextClientId,
        status: nextStatus,
        discount: nextDiscount,
        note: nextNote,
        items: nextItems,
      },
      { requireItems: true },
    );
    const preparedItems = await prepareOrderItems(nextItems, true);
    const parsedDeliveryDate = parseDeliveryDate(deliveryDate);

    const errors = [
      ...validation.errors,
      ...preparedItems.errors,
      ...parsedDeliveryDate.errors,
    ];

    if (errors.length > 0) {
      return res.status(400).json({ errors: [...new Set(errors)] });
    }

    const nextDeliveryDate =
      parsedDeliveryDate.value === undefined
        ? existingOrder.deliveryDate
        : parsedDeliveryDate.value;
    const total = calculateOrderTotal(preparedItems.items, nextDiscount);

    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: {
        clientId: nextClientId,
        status: nextStatus,
        total,
        deliveryDate: nextDeliveryDate,
        discount: nextDiscount,
        note: normalizeNote(nextNote),
        items: {
          deleteMany: {},
          create: preparedItems.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            note: item.note,
          })),
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          select: {
            id: true,
            menuItemId: true,
            quantity: true,
            price: true,
            note: true,
            menuItem: {
              select: {
                id: true,
                name: true,
                subtitle: true,
              },
            },
          },
        },
      },
    });
    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /orders/:id - Delete an order and its nested items.
 */
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existingOrder = await prisma.order.findUnique({
      where: { id: Number(id) },
    });
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await prisma.order.update({
      where: { id: Number(id) },
      data: {
        items: {
          deleteMany: {},
        },
      },
    });
    await prisma.order.delete({
      where: { id: Number(id) },
    });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const validateOrder = async (
  data: {
    clientId?: number;
    status?: string;
    discount?: number | null;
    note?: string | null;
    items?: OrderItemInput[];
  },
  options?: { requireItems?: boolean },
): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  if (data.clientId === undefined) {
    errors.push('clientId is required');
  }
  if (
    data.clientId !== undefined &&
    (!Number.isInteger(data.clientId) || data.clientId < 1)
  ) {
    errors.push('clientId must be a positive integer');
  }

  if (data.status === undefined) {
    errors.push('status is required');
  }
  if (typeof data.status === 'string' && data.status.trim() === '') {
    errors.push('status is required');
  }
  if (
    typeof data.status === 'string' &&
    data.status.trim() !== '' &&
    !ORDER_STATUSES.includes(
      normalizeStatus(data.status) as (typeof ORDER_STATUSES)[number],
    )
  ) {
    errors.push(
      'Status must be one of: pending, confirmed, completed, cancelled',
    );
  }

  if (
    data.discount !== undefined &&
    data.discount !== null &&
    (typeof data.discount !== 'number' || data.discount < 0)
  ) {
    errors.push('discount must be a non-negative number');
  }

  if (
    data.clientId !== undefined &&
    Number.isInteger(data.clientId) &&
    data.clientId > 0
  ) {
    const clientExists = await prisma.client.findUnique({
      where: { id: data.clientId },
    });
    if (!clientExists) {
      errors.push('Client not found');
    }
  }

  if (data.note && data.note.trim().length > 1000) {
    errors.push('Note must be less than 1000 characters');
  }

  if (
    options?.requireItems &&
    (!Array.isArray(data.items) || data.items.length === 0)
  ) {
    errors.push('At least one order item is required');
  }

  return { valid: errors.length === 0, errors };
};

export interface OrderValidationResult {
  valid: boolean;
  errors: string[];
}
