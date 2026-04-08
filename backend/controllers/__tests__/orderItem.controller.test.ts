import { Request, Response } from 'express';
import {
  getOrderItems,
  createOrderItem,
  getOrderItemById,
  updateOrderItem,
  deleteOrderItem,
  validateOrderItem,
} from '../orderItem.controller';
import prisma from '../../prisma';

jest.mock('../../prisma', () => ({
  __esModule: true,
  default: {
    orderItem: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
    },
    menuItem: {
      findUnique: jest.fn(),
    },
  },
}));

const mockPrismaOrderItem = prisma.orderItem as jest.Mocked<
  typeof prisma.orderItem
>;
const mockPrismaOrder = prisma.order as jest.Mocked<typeof prisma.order>;
const mockPrismaMenuItem = prisma.menuItem as jest.Mocked<
  typeof prisma.menuItem
>;

function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    query: {},
    params: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getOrderItems', () => {
  it('returns paginated order item list with defaults', async () => {
    const items = [
      { id: 1, orderId: 1, menuItemId: 2, quantity: 3, price: 12.5 },
    ];
    mockPrismaOrderItem.findMany.mockResolvedValueOnce(items as any);
    mockPrismaOrderItem.count.mockResolvedValueOnce(1);

    const req = mockReq();
    const res = mockRes();

    await getOrderItems(req, res);

    expect(mockPrismaOrderItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        data: items,
      }),
    );
  });

  it('applies filters to the query', async () => {
    mockPrismaOrderItem.findMany.mockResolvedValueOnce([]);
    mockPrismaOrderItem.count.mockResolvedValueOnce(0);

    const req = mockReq({ query: { orderId: '3', menuItemId: '4' } });
    const res = mockRes();

    await getOrderItems(req, res);

    const { where } = (mockPrismaOrderItem.findMany as jest.Mock).mock
      .calls[0][0];
    expect(JSON.stringify(where)).toContain('3');
    expect(JSON.stringify(where)).toContain('4');
  });

  it('responds 500 when database throws', async () => {
    mockPrismaOrderItem.findMany.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await getOrderItems(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to fetch order items',
    });
  });
});

describe('createOrderItem', () => {
  it('creates an order item and responds 201', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findUnique
      .mockResolvedValueOnce({ id: 2, price: 12.5 } as any)
      .mockResolvedValueOnce({ price: 12.5 } as any);
    const created = {
      id: 1,
      orderId: 1,
      menuItemId: 2,
      quantity: 3,
      price: 12.5,
      note: 'No onions',
    };
    mockPrismaOrderItem.create.mockResolvedValueOnce(created as any);

    const req = mockReq({
      body: {
        orderId: 1,
        menuItemId: 2,
        quantity: 3,
        note: '  No onions  ',
      },
    });
    const res = mockRes();

    await createOrderItem(req, res);

    expect(mockPrismaOrderItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 1,
          menuItemId: 2,
          quantity: 3,
          price: 12.5,
          note: 'No onions',
        }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  it('uses the request price when one is provided', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findUnique
      .mockResolvedValueOnce({ id: 2, price: 12.5 } as any)
      .mockResolvedValueOnce({ price: 12.5 } as any);
    mockPrismaOrderItem.create.mockResolvedValueOnce({ id: 1 } as any);

    const req = mockReq({
      body: {
        orderId: 1,
        menuItemId: 2,
        quantity: 3,
        price: 20,
      },
    });
    const res = mockRes();

    await createOrderItem(req, res);

    expect(mockPrismaOrderItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ price: 20 }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('responds 400 when required fields are missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await createOrderItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.errors).toContain('orderId is required');
    expect(body.errors).toContain('menuItemId is required');
    expect(body.errors).toContain('quantity is required');
  });

  it('responds 400 when relations do not exist', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce(null);
    mockPrismaMenuItem.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({
      body: { orderId: 999, menuItemId: 888, quantity: 1 },
    });
    const res = mockRes();

    await createOrderItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.errors).toContain('Order not found');
    expect(body.errors).toContain('Menu item not found');
  });

  it('responds 500 when database throws', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findUnique
      .mockResolvedValueOnce({ id: 2, price: 12.5 } as any)
      .mockResolvedValueOnce({ price: 12.5 } as any);
    mockPrismaOrderItem.create.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({
      body: { orderId: 1, menuItemId: 2, quantity: 1 },
    });
    const res = mockRes();

    await createOrderItem(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to create order item',
    });
  });
});

describe('getOrderItemById', () => {
  it('returns the order item when found', async () => {
    const item = { id: 1, orderId: 1, menuItemId: 2, quantity: 3, price: 12.5 };
    mockPrismaOrderItem.findUnique.mockResolvedValueOnce(item as any);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await getOrderItemById(req, res);

    expect(res.json).toHaveBeenCalledWith(item);
  });

  it('responds 404 when order item does not exist', async () => {
    mockPrismaOrderItem.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await getOrderItemById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Order item not found' });
  });

  it('responds 500 when database throws', async () => {
    mockPrismaOrderItem.findUnique.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await getOrderItemById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to fetch order item',
    });
  });
});

describe('updateOrderItem', () => {
  it('responds 404 when order item does not exist', async () => {
    mockPrismaOrderItem.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({ params: { id: '999' }, body: { quantity: 2 } });
    const res = mockRes();

    await updateOrderItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Order item not found' });
  });

  it('updates an order item and responds 200', async () => {
    const existing = {
      id: 1,
      orderId: 1,
      menuItemId: 2,
      quantity: 3,
      price: 12.5,
      note: null,
    };
    const updated = {
      ...existing,
      quantity: 4,
      note: 'Extra sauce',
    };

    mockPrismaOrderItem.findUnique.mockResolvedValueOnce(existing as any);
    mockPrismaOrder.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findUnique.mockResolvedValueOnce({ id: 2 } as any);
    mockPrismaOrderItem.update.mockResolvedValueOnce(updated as any);

    const req = mockReq({
      params: { id: '1' },
      body: { quantity: 4, note: '  Extra sauce  ' },
    });
    const res = mockRes();

    await updateOrderItem(req, res);

    expect(mockPrismaOrderItem.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 1,
          menuItemId: 2,
          quantity: 4,
          price: 12.5,
          note: 'Extra sauce',
        }),
      }),
    );
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('responds 400 when merged payload is invalid', async () => {
    const existing = {
      id: 1,
      orderId: 1,
      menuItemId: 2,
      quantity: 3,
      price: 12.5,
      note: null,
    };

    mockPrismaOrderItem.findUnique.mockResolvedValueOnce(existing as any);
    mockPrismaOrder.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findUnique.mockResolvedValueOnce({ id: 2 } as any);

    const req = mockReq({ params: { id: '1' }, body: { quantity: 0 } });
    const res = mockRes();

    await updateOrderItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.errors).toContain('quantity must be a positive integer');
  });

  it('responds 500 when database throws', async () => {
    const existing = {
      id: 1,
      orderId: 1,
      menuItemId: 2,
      quantity: 3,
      price: 12.5,
      note: null,
    };

    mockPrismaOrderItem.findUnique.mockResolvedValueOnce(existing as any);
    mockPrismaOrder.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findUnique.mockResolvedValueOnce({ id: 2 } as any);
    mockPrismaOrderItem.update.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({ params: { id: '1' }, body: { quantity: 4 } });
    const res = mockRes();

    await updateOrderItem(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to update order item',
    });
  });
});

describe('deleteOrderItem', () => {
  it('responds 404 when order item does not exist', async () => {
    mockPrismaOrderItem.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await deleteOrderItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Order item not found' });
  });

  it('deletes an order item and responds 204', async () => {
    mockPrismaOrderItem.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaOrderItem.delete.mockResolvedValueOnce({} as any);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await deleteOrderItem(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('responds 500 when database throws', async () => {
    mockPrismaOrderItem.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaOrderItem.delete.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await deleteOrderItem(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to delete order item',
    });
  });
});

describe('validateOrderItem', () => {
  it('returns valid for correct data', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findUnique.mockResolvedValueOnce({ id: 2 } as any);

    const result = await validateOrderItem({
      orderId: 1,
      menuItemId: 2,
      quantity: 3,
      price: 12.5,
      note: 'No nuts',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for missing required fields', async () => {
    const result = await validateOrderItem({});

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('orderId is required');
    expect(result.errors).toContain('menuItemId is required');
    expect(result.errors).toContain('quantity is required');
  });

  it('returns an error for invalid quantity', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findUnique.mockResolvedValueOnce({ id: 2 } as any);

    const result = await validateOrderItem({
      orderId: 1,
      menuItemId: 2,
      quantity: 0,
      price: 12.5,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('quantity must be a positive integer');
  });

  it('returns an error for invalid price', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findUnique.mockResolvedValueOnce({ id: 2 } as any);

    const result = await validateOrderItem({
      orderId: 1,
      menuItemId: 2,
      quantity: 1,
      price: -1,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('price must be a non-negative number');
  });

  it('returns errors when relations do not exist', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce(null);
    mockPrismaMenuItem.findUnique.mockResolvedValueOnce(null);

    const result = await validateOrderItem({
      orderId: 999,
      menuItemId: 888,
      quantity: 1,
      price: 12.5,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Order not found');
    expect(result.errors).toContain('Menu item not found');
  });

  it('returns an error when note is too long', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findUnique.mockResolvedValueOnce({ id: 2 } as any);

    const result = await validateOrderItem({
      orderId: 1,
      menuItemId: 2,
      quantity: 1,
      price: 12.5,
      note: 'N'.repeat(1001),
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Note must be less than 1000 characters');
  });
});
