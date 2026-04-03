import { Request, Response } from 'express';
import {
  getMenuItems,
  createMenuItem,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  validateMenuItem,
} from '../menuItem.controller';
import prisma from '../../prisma';

jest.mock('../../prisma', () => ({
  __esModule: true,
  default: {
    menuItem: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
  },
}));

const mockPrismaMenuItem = prisma.menuItem as jest.Mocked<
  typeof prisma.menuItem
>;
const mockPrismaCategory = prisma.category as jest.Mocked<
  typeof prisma.category
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

// ---------------------------------------------------------------------------
// getMenuItems
// ---------------------------------------------------------------------------
describe('getMenuItems', () => {
  it('returns paginated menu item list with defaults', async () => {
    const items = [
      { id: 1, name: 'Salad', description: null, price: 9.99, categoryId: 1 },
    ];
    mockPrismaMenuItem.findMany.mockResolvedValueOnce(items as any);
    mockPrismaMenuItem.count.mockResolvedValueOnce(1);

    const req = mockReq();
    const res = mockRes();

    await getMenuItems(req, res);

    expect(mockPrismaMenuItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10, total: 1, data: items }),
    );
  });

  it('applies categoryId filter to query', async () => {
    mockPrismaMenuItem.findMany.mockResolvedValueOnce([]);
    mockPrismaMenuItem.count.mockResolvedValueOnce(0);

    const req = mockReq({ query: { categoryId: '3' } });
    const res = mockRes();

    await getMenuItems(req, res);

    const { where } = (mockPrismaMenuItem.findMany as jest.Mock).mock
      .calls[0][0];
    expect(JSON.stringify(where)).toContain('3');
  });

  it('responds 500 when database throws', async () => {
    mockPrismaMenuItem.findMany.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await getMenuItems(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to fetch menu items',
    });
  });
});

// ---------------------------------------------------------------------------
// createMenuItem
// ---------------------------------------------------------------------------
describe('createMenuItem', () => {
  it('creates a menu item and responds 201', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce({
      id: 1,
      name: 'Mains',
    } as any);
    const created = {
      id: 1,
      name: 'Steak',
      description: 'Grilled',
      price: 25.0,
      categoryId: 1,
    };
    mockPrismaMenuItem.create.mockResolvedValueOnce(created as any);

    const req = mockReq({
      body: {
        name: 'Steak',
        description: 'Grilled',
        price: 25.0,
        categoryId: 1,
      },
    });
    const res = mockRes();

    await createMenuItem(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  it('responds 400 when required fields are missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await createMenuItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.errors).toContain('Name is required');
    expect(body.errors).toContain('Price is required');
    expect(body.errors).toContain('Category ID is required');
  });

  it('responds 400 for a negative price', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce({ id: 1 } as any);

    const req = mockReq({ body: { name: 'Steak', price: -5, categoryId: 1 } });
    const res = mockRes();

    await createMenuItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.errors).toContain('Price must be a non-negative number');
  });

  it('responds 400 when category does not exist', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({
      body: { name: 'Steak', price: 25, categoryId: 999 },
    });
    const res = mockRes();

    await createMenuItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.errors).toContain('Category not found');
  });

  it('responds 500 when database throws', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.create.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({ body: { name: 'Steak', price: 25, categoryId: 1 } });
    const res = mockRes();

    await createMenuItem(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to create menu item',
    });
  });
});

// ---------------------------------------------------------------------------
// getMenuItemById
// ---------------------------------------------------------------------------
describe('getMenuItemById', () => {
  it('returns the menu item when found', async () => {
    const item = {
      id: 1,
      name: 'Salad',
      description: null,
      price: 9.99,
      categoryId: 1,
    };
    mockPrismaMenuItem.findUnique.mockResolvedValueOnce(item as any);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await getMenuItemById(req, res);

    expect(res.json).toHaveBeenCalledWith(item);
  });

  it('responds 404 when menu item does not exist', async () => {
    mockPrismaMenuItem.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await getMenuItemById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Menu item not found' });
  });

  it('responds 500 when database throws', async () => {
    mockPrismaMenuItem.findUnique.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await getMenuItemById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to fetch menu item',
    });
  });
});

// ---------------------------------------------------------------------------
// updateMenuItem
// ---------------------------------------------------------------------------
describe('updateMenuItem', () => {
  it('responds 400 on validation failure', async () => {
    const req = mockReq({
      params: { id: '1' },
      body: { name: '', price: -1, categoryId: 0 },
    });
    const res = mockRes();

    await updateMenuItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updates menu item and responds 200', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    const updated = {
      id: 1,
      name: 'Updated Steak',
      description: null,
      price: 30.0,
      categoryId: 1,
    };
    mockPrismaMenuItem.update.mockResolvedValueOnce(updated as any);

    const req = mockReq({
      params: { id: '1' },
      body: { name: 'Updated Steak', price: 30.0, categoryId: 1 },
    });
    const res = mockRes();

    await updateMenuItem(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('responds 500 when database throws', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.update.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({
      params: { id: '1' },
      body: { name: 'Steak', price: 25, categoryId: 1 },
    });
    const res = mockRes();

    await updateMenuItem(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// deleteMenuItem
// ---------------------------------------------------------------------------
describe('deleteMenuItem', () => {
  it('responds 404 when menu item does not exist', async () => {
    mockPrismaMenuItem.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await deleteMenuItem(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Menu item not found' });
  });

  it('deletes menu item and responds 204', async () => {
    mockPrismaMenuItem.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaMenuItem.delete.mockResolvedValueOnce({} as any);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await deleteMenuItem(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// validateMenuItem
// ---------------------------------------------------------------------------
describe('validateMenuItem', () => {
  it('returns valid for correct data', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce({ id: 1 } as any);

    const result = await validateMenuItem({
      name: 'Steak',
      price: 25.0,
      categoryId: 1,
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for missing required fields', async () => {
    const result = await validateMenuItem({
      name: '',
      price: undefined as any,
      categoryId: 0,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name is required');
    expect(result.errors).toContain('Price is required');
    expect(result.errors).toContain('Category ID is required');
  });

  it('returns error for negative price', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce({ id: 1 } as any);

    const result = await validateMenuItem({
      name: 'Steak',
      price: -1,
      categoryId: 1,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Price must be a non-negative number');
  });

  it('returns error when category does not exist', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce(null);

    const result = await validateMenuItem({
      name: 'Steak',
      price: 10,
      categoryId: 999,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Category not found');
  });

  it('returns error when name exceeds 255 characters', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce({ id: 1 } as any);

    const result = await validateMenuItem({
      name: 'A'.repeat(256),
      price: 10,
      categoryId: 1,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name must be less than 255 characters');
  });

  it('returns error when description exceeds 1000 characters', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce({ id: 1 } as any);

    const result = await validateMenuItem({
      name: 'Steak',
      description: 'D'.repeat(1001),
      price: 10,
      categoryId: 1,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Description must be less than 1000 characters',
    );
  });
});
