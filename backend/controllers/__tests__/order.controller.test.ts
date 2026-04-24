import { Request, Response } from 'express';
import {
  createOrder,
  deleteOrder,
  getOrderById,
  orders,
  updateOrder,
  validateOrder,
} from '../order.controller';
import prisma from '../../prisma';

jest.mock('../../prisma', () => ({
  __esModule: true,
  default: {
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    client: {
      findUnique: jest.fn(),
    },
    menuItem: {
      findMany: jest.fn(),
    },
  },
}));

const mockPrismaOrder = prisma.order as jest.Mocked<typeof prisma.order>;
const mockPrismaClient = prisma.client as jest.Mocked<typeof prisma.client>;
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

describe('orders', () => {
  it('returns paginated order list with defaults', async () => {
    const orderList = [
      {
        id: 1,
        clientId: 2,
        total: 120,
        status: 'pending',
        client: { id: 2, firstName: 'Jane', lastName: 'Doe' },
        items: [{ id: 10, menuItemId: 3, quantity: 2, price: 60 }],
      },
    ];
    mockPrismaOrder.findMany.mockResolvedValueOnce(orderList as any);
    mockPrismaOrder.count.mockResolvedValueOnce(1);

    const req = mockReq();
    const res = mockRes();

    await orders(req, res);

    expect(mockPrismaOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        data: orderList,
      }),
    );
  });

  it('applies filters to the query', async () => {
    mockPrismaOrder.findMany.mockResolvedValueOnce([]);
    mockPrismaOrder.count.mockResolvedValueOnce(0);

    const req = mockReq({ query: { clientId: '4', status: 'confirmed' } });
    const res = mockRes();

    await orders(req, res);

    const { where } = (mockPrismaOrder.findMany as jest.Mock).mock.calls[0][0];
    expect(JSON.stringify(where)).toContain('4');
    expect(JSON.stringify(where)).toContain('confirmed');
  });

  it('applies client-name search and created date range filters', async () => {
    mockPrismaOrder.findMany.mockResolvedValueOnce([]);
    mockPrismaOrder.count.mockResolvedValueOnce(0);

    const req = mockReq({
      query: {
        search: 'Jane Doe',
        createdFrom: '2026-04-01',
        createdTo: '2026-04-30',
      },
    });
    const res = mockRes();

    await orders(req, res);

    const { where } = (mockPrismaOrder.findMany as jest.Mock).mock.calls[0][0];

    expect(where.AND).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
        expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  client: expect.objectContaining({
                    firstName: expect.objectContaining({ contains: 'Jane' }),
                  }),
                }),
                expect.objectContaining({
                  client: expect.objectContaining({
                    lastName: expect.objectContaining({ contains: 'Jane' }),
                  }),
                }),
              ]),
            }),
            expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({
                  client: expect.objectContaining({
                    firstName: expect.objectContaining({ contains: 'Doe' }),
                  }),
                }),
                expect.objectContaining({
                  client: expect.objectContaining({
                    lastName: expect.objectContaining({ contains: 'Doe' }),
                  }),
                }),
              ]),
            }),
          ]),
        }),
      ]),
    );
  });

  it('responds 500 when database throws', async () => {
    mockPrismaOrder.findMany.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await orders(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch orders' });
  });
});

describe('createOrder', () => {
  it('creates an order with computed totals and responds 201', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findMany.mockResolvedValueOnce([
      { id: 2, price: 12.5 },
      { id: 3, price: 8 },
    ] as any);

    const created = {
      id: 1,
      clientId: 1,
      total: 23,
      status: 'confirmed',
      discount: 10,
      note: 'Window seat',
      client: { id: 1, firstName: 'Jane', lastName: 'Doe' },
      items: [],
    };
    mockPrismaOrder.create.mockResolvedValueOnce(created as any);

    const req = mockReq({
      body: {
        clientId: 1,
        status: 'confirmed',
        discount: 10,
        note: '  Window seat  ',
        items: [
          { menuItemId: 2, quantity: 2, note: '  No onions  ' },
          { menuItemId: 3, quantity: 1 },
        ],
      },
    });
    const res = mockRes();

    await createOrder(req, res);

    expect(mockPrismaOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: 1,
          total: 23,
          status: 'confirmed',
          note: 'Window seat',
          items: {
            create: [
              {
                menuItemId: 2,
                quantity: 2,
                price: 12.5,
                note: 'No onions',
              },
              {
                menuItemId: 3,
                quantity: 1,
                price: 8,
                note: null,
              },
            ],
          },
        }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  it('uses pending when status is omitted', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findMany.mockResolvedValueOnce([
      { id: 2, price: 12.5 },
    ] as any);
    mockPrismaOrder.create.mockResolvedValueOnce({
      id: 1,
      clientId: 1,
      total: 12.5,
      status: 'pending',
    } as any);

    const req = mockReq({
      body: { clientId: 1, items: [{ menuItemId: 2, quantity: 1 }] },
    });
    const res = mockRes();

    await createOrder(req, res);

    expect(mockPrismaOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: 1,
          total: 12.5,
          status: 'pending',
        }),
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('responds 400 when items are missing', async () => {
    const req = mockReq({ body: { clientId: 1, status: 'pending' } });
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.errors).toContain('At least one order item is required');
  });

  it('responds 500 when database throws', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findMany.mockResolvedValueOnce([
      { id: 2, price: 12.5 },
    ] as any);
    mockPrismaOrder.create.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({
      body: { clientId: 1, items: [{ menuItemId: 2, quantity: 1 }] },
    });
    const res = mockRes();

    await createOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

describe('getOrderById', () => {
  it('returns the order when found', async () => {
    const order = {
      id: 1,
      clientId: 1,
      total: 99,
      status: 'pending',
      client: { id: 1, firstName: 'Jane', lastName: 'Doe' },
      items: [],
    };
    mockPrismaOrder.findUnique.mockResolvedValueOnce(order as any);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await getOrderById(req, res);

    expect(res.json).toHaveBeenCalledWith(order);
  });

  it('responds 404 when order does not exist', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
  });

  it('responds 500 when database throws', async () => {
    mockPrismaOrder.findUnique.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await getOrderById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

describe('updateOrder', () => {
  it('responds 404 when order does not exist', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({ params: { id: '999' }, body: { note: 'Rush' } });
    const res = mockRes();

    await updateOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
  });

  it('updates an order and responds 200', async () => {
    const existing = {
      id: 1,
      clientId: 1,
      total: 120,
      status: 'pending',
      deliveryDate: null,
      discount: 0,
      note: null,
      items: [{ id: 10, menuItemId: 2, quantity: 3, price: 12.5, note: null }],
    };
    const updated = {
      ...existing,
      total: 16,
      note: 'Rush',
    };

    mockPrismaOrder.findUnique.mockResolvedValueOnce(existing as any);
    mockPrismaClient.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findMany.mockResolvedValueOnce([
      { id: 2, price: 12.5 },
      { id: 3, price: 8 },
    ] as any);
    mockPrismaOrder.update.mockResolvedValueOnce(updated as any);

    const req = mockReq({
      params: { id: '1' },
      body: {
        discount: 12.5,
        note: '  Rush  ',
        items: [
          { menuItemId: 2, quantity: 1 },
          { menuItemId: 3, quantity: 2 },
        ],
      },
    });
    const res = mockRes();

    await updateOrder(req, res);

    expect(mockPrismaOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          clientId: 1,
          status: 'pending',
          total: 16,
          note: 'Rush',
          items: {
            deleteMany: {},
            create: [
              {
                menuItemId: 2,
                quantity: 1,
                price: 12.5,
                note: null,
              },
              {
                menuItemId: 3,
                quantity: 2,
                price: 8,
                note: null,
              },
            ],
          },
        }),
      }),
    );
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('responds 400 when merged payload is invalid', async () => {
    const existing = {
      id: 1,
      clientId: 1,
      total: 120,
      status: 'pending',
      note: null,
      deliveryDate: null,
      discount: 0,
      items: [{ id: 10, menuItemId: 2, quantity: 3, price: 12.5, note: null }],
    };

    mockPrismaOrder.findUnique.mockResolvedValueOnce(existing as any);
    mockPrismaClient.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findMany.mockResolvedValueOnce([] as any);

    const req = mockReq({
      params: { id: '1' },
      body: { items: [{ menuItemId: 999, quantity: 1 }] },
    });
    const res = mockRes();

    await updateOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.errors).toContain('Menu item 999 not found');
  });

  it('responds 500 when database throws', async () => {
    const existing = {
      id: 1,
      clientId: 1,
      total: 120,
      status: 'pending',
      note: null,
      deliveryDate: null,
      discount: 0,
      items: [{ id: 10, menuItemId: 2, quantity: 3, price: 12.5, note: null }],
    };

    mockPrismaOrder.findUnique.mockResolvedValueOnce(existing as any);
    mockPrismaClient.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.findMany.mockResolvedValueOnce([
      { id: 2, price: 12.5 },
    ] as any);
    mockPrismaOrder.update.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({
      params: { id: '1' },
      body: { items: [{ menuItemId: 2, quantity: 3 }] },
    });
    const res = mockRes();

    await updateOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

describe('deleteOrder', () => {
  it('responds 404 when order does not exist', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await deleteOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Order not found' });
  });

  it('deletes an order and responds 204', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaOrder.update.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaOrder.delete.mockResolvedValueOnce({} as any);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await deleteOrder(req, res);

    expect(mockPrismaOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          items: {
            deleteMany: {},
          },
        },
      }),
    );
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('responds 500 when database throws', async () => {
    mockPrismaOrder.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaOrder.update.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaOrder.delete.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await deleteOrder(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});

describe('validateOrder', () => {
  it('returns valid for correct data', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce({ id: 1 } as any);

    const result = await validateOrder(
      {
        clientId: 1,
        status: 'pending',
        discount: 5,
        note: 'Leave at door',
        items: [{ menuItemId: 2, quantity: 1 }],
      },
      { requireItems: true },
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for missing required fields', async () => {
    const result = await validateOrder({}, { requireItems: true });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('clientId is required');
    expect(result.errors).toContain('status is required');
    expect(result.errors).toContain('At least one order item is required');
  });

  it('returns an error when the client does not exist', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce(null);

    const result = await validateOrder(
      {
        clientId: 999,
        status: 'pending',
        items: [{ menuItemId: 2, quantity: 1 }],
      },
      { requireItems: true },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Client not found');
  });

  it('returns an error when status is invalid', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce({ id: 1 } as any);

    const result = await validateOrder(
      {
        clientId: 1,
        status: 'archived',
        items: [{ menuItemId: 2, quantity: 1 }],
      },
      { requireItems: true },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Status must be one of: pending, confirmed, completed, cancelled',
    );
  });

  it('returns an error when note is too long', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce({ id: 1 } as any);

    const result = await validateOrder(
      {
        clientId: 1,
        status: 'pending',
        note: 'N'.repeat(1001),
        items: [{ menuItemId: 2, quantity: 1 }],
      },
      { requireItems: true },
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Note must be less than 1000 characters');
  });
});
