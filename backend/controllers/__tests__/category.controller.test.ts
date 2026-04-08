import { Request, Response } from 'express';
import {
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  validateCategory,
} from '../category.controller';
import prisma from '../../prisma';

jest.mock('../../prisma', () => ({
  __esModule: true,
  default: {
    category: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

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
// getCategories
// ---------------------------------------------------------------------------
describe('getCategories', () => {
  it('returns paginated category list with defaults', async () => {
    const categories = [{ id: 1, name: 'Appetizers' }];
    mockPrismaCategory.findMany.mockResolvedValueOnce(categories as any);
    mockPrismaCategory.count.mockResolvedValueOnce(1);

    const req = mockReq();
    const res = mockRes();

    await getCategories(req, res);

    expect(mockPrismaCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        total: 1,
        data: categories,
      }),
    );
  });

  it('applies search filter to query', async () => {
    mockPrismaCategory.findMany.mockResolvedValueOnce([]);
    mockPrismaCategory.count.mockResolvedValueOnce(0);

    const req = mockReq({ query: { search: 'main' } });
    const res = mockRes();

    await getCategories(req, res);

    const { where } = (mockPrismaCategory.findMany as jest.Mock).mock
      .calls[0][0];
    expect(JSON.stringify(where)).toContain('main');
  });

  it('responds 500 when database throws', async () => {
    mockPrismaCategory.findMany.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await getCategories(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to fetch categories',
    });
  });
});

// ---------------------------------------------------------------------------
// createCategory
// ---------------------------------------------------------------------------
describe('createCategory', () => {
  it('creates a category and responds 201', async () => {
    const created = { id: 1, name: 'Desserts' };
    mockPrismaCategory.create.mockResolvedValueOnce(created as any);

    const req = mockReq({ body: { name: 'Desserts' } });
    const res = mockRes();

    await createCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  it('responds 400 when name is missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await createCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.errors).toContain('Name is required');
  });

  it('responds 400 when name is blank', async () => {
    const req = mockReq({ body: { name: '   ' } });
    const res = mockRes();

    await createCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('responds 500 when database throws', async () => {
    mockPrismaCategory.create.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({ body: { name: 'Desserts' } });
    const res = mockRes();

    await createCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to create category',
    });
  });
});

// ---------------------------------------------------------------------------
// getCategoryById
// ---------------------------------------------------------------------------
describe('getCategoryById', () => {
  it('returns the category when found', async () => {
    const category = { id: 1, name: 'Appetizers' };
    mockPrismaCategory.findUnique.mockResolvedValueOnce(category as any);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await getCategoryById(req, res);

    expect(res.json).toHaveBeenCalledWith(category);
  });

  it('responds 404 when category does not exist', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await getCategoryById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
  });

  it('responds 500 when database throws', async () => {
    mockPrismaCategory.findUnique.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await getCategoryById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to fetch category',
    });
  });
});

// ---------------------------------------------------------------------------
// updateCategory
// ---------------------------------------------------------------------------
describe('updateCategory', () => {
  it('responds 400 on validation failure', async () => {
    const req = mockReq({ params: { id: '1' }, body: { name: '' } });
    const res = mockRes();

    await updateCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updates category and responds 200', async () => {
    const updated = { id: 1, name: 'Mains' };
    mockPrismaCategory.findUnique.mockResolvedValueOnce({
      id: 1,
      name: 'Appetizers',
    } as any);
    mockPrismaCategory.update.mockResolvedValueOnce(updated as any);

    const req = mockReq({ params: { id: '1' }, body: { name: 'Mains' } });
    const res = mockRes();

    await updateCategory(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('responds 500 when database throws', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce({
      id: 1,
      name: 'Appetizers',
    } as any);
    mockPrismaCategory.update.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({ params: { id: '1' }, body: { name: 'Mains' } });
    const res = mockRes();

    await updateCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// deleteCategory
// ---------------------------------------------------------------------------
describe('deleteCategory', () => {
  it('responds 404 when category does not exist', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
  });

  it('deletes category and responds 204', async () => {
    mockPrismaCategory.findUnique.mockResolvedValueOnce({
      id: 1,
      name: 'Appetizers',
    } as any);
    mockPrismaCategory.delete.mockResolvedValueOnce({} as any);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await deleteCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// validateCategory
// ---------------------------------------------------------------------------
describe('validateCategory', () => {
  it('returns valid for a non-empty name', async () => {
    const result = await validateCategory({ name: 'Desserts' });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns error when name is empty', async () => {
    const result = await validateCategory({ name: '' });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });

  it('returns error when name is whitespace only', async () => {
    const result = await validateCategory({ name: '   ' });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });
});
