import { Request, Response } from 'express';
import {
  getClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
  validateClient,
} from '../client.controller';
import prisma from '../../prisma';

jest.mock('../../prisma', () => ({
  __esModule: true,
  default: {
    client: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockPrismaClient = prisma.client as jest.Mocked<typeof prisma.client>;

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
// getClients
// ---------------------------------------------------------------------------
describe('getClients', () => {
  it('returns paginated client list with defaults', async () => {
    const clients = [
      {
        id: 1,
        firstName: 'Alice',
        lastName: 'Smith',
        phone: '123',
        email: null,
      },
    ];
    mockPrismaClient.findMany.mockResolvedValueOnce(clients as any);
    mockPrismaClient.count.mockResolvedValueOnce(1);

    const req = mockReq();
    const res = mockRes();

    await getClients(req, res);

    expect(mockPrismaClient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        data: clients,
      }),
    );
  });

  it('applies search filter to query', async () => {
    mockPrismaClient.findMany.mockResolvedValueOnce([]);
    mockPrismaClient.count.mockResolvedValueOnce(0);

    const req = mockReq({ query: { search: 'ali' } });
    const res = mockRes();

    await getClients(req, res);

    const { where } = (mockPrismaClient.findMany as jest.Mock).mock.calls[0][0];
    expect(JSON.stringify(where)).toContain('ali');
  });

  it('responds 500 when database throws', async () => {
    mockPrismaClient.findMany.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq();
    const res = mockRes();

    await getClients(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch clients' });
  });
});

// ---------------------------------------------------------------------------
// createClient
// ---------------------------------------------------------------------------
describe('createClient', () => {
  it('creates a client and responds 201', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce(null); // email uniqueness
    const created = {
      id: 1,
      firstName: 'Alice',
      lastName: 'Smith',
      phone: '+1234567890',
      email: 'alice@example.com',
    };
    mockPrismaClient.create.mockResolvedValueOnce(created as any);

    const req = mockReq({
      body: {
        firstName: 'Alice',
        lastName: 'Smith',
        phone: '+1234567890',
        email: 'alice@example.com',
      },
    });
    const res = mockRes();

    await createClient(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  it('responds 400 when required fields are missing', async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await createClient(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.errors).toContain('First name is required');
    expect(body.errors).toContain('Last name is required');
    expect(body.errors).toContain('Phone number is required');
  });

  it('responds 400 for invalid email format', async () => {
    const req = mockReq({
      body: {
        firstName: 'Alice',
        lastName: 'Smith',
        phone: '+1234567890',
        email: 'not-an-email',
      },
    });
    const res = mockRes();

    await createClient(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.errors).toContain('Invalid email format');
  });

  it('responds 400 when email already exists', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce({
      id: 99,
      email: 'dup@example.com',
    } as any);

    const req = mockReq({
      body: {
        firstName: 'Alice',
        lastName: 'Smith',
        phone: '+1234567890',
        email: 'dup@example.com',
      },
    });
    const res = mockRes();

    await createClient(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.errors).toContain('Email already exists');
  });

  it('responds 500 when database throws', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce(null);
    mockPrismaClient.create.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({
      body: {
        firstName: 'Alice',
        lastName: 'Smith',
        phone: '+1234567890',
        email: 'alice@example.com',
      },
    });
    const res = mockRes();

    await createClient(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create client' });
  });
});

// ---------------------------------------------------------------------------
// getClientById
// ---------------------------------------------------------------------------
describe('getClientById', () => {
  it('returns the client when found', async () => {
    const client = {
      id: 1,
      firstName: 'Alice',
      lastName: 'Smith',
      phone: '123',
      email: null,
    };
    mockPrismaClient.findUnique.mockResolvedValueOnce(client as any);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await getClientById(req, res);

    expect(res.json).toHaveBeenCalledWith(client);
  });

  it('responds 404 when client does not exist', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await getClientById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Client not found' });
  });

  it('responds 500 when database throws', async () => {
    mockPrismaClient.findUnique.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await getClientById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to fetch client' });
  });
});

// ---------------------------------------------------------------------------
// updateClient
// ---------------------------------------------------------------------------
describe('updateClient', () => {
  it('responds 404 when client does not exist', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({
      params: { id: '999' },
      body: { firstName: 'A', lastName: 'B', phone: '+1234567890' },
    });
    const res = mockRes();

    await updateClient(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Client not found' });
  });

  it('responds 400 on validation failure', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce({ id: 1 } as any);

    const req = mockReq({
      params: { id: '1' },
      body: { firstName: '', lastName: '', phone: '' },
    });
    const res = mockRes();

    await updateClient(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('updates client and responds 200', async () => {
    const existing = {
      id: 1,
      firstName: 'Old',
      lastName: 'Name',
      phone: '+1234567890',
      email: null,
    };
    const updated = {
      id: 1,
      firstName: 'New',
      lastName: 'Name',
      phone: '+1234567890',
      email: null,
    };

    // 1st call: existence check; 2nd call (inside validateClient): no email provided so no duplicate check
    mockPrismaClient.findUnique.mockResolvedValueOnce(existing as any);
    mockPrismaClient.update.mockResolvedValueOnce(updated as any);

    const req = mockReq({
      params: { id: '1' },
      body: { firstName: 'New', lastName: 'Name', phone: '+1234567890' },
    });
    const res = mockRes();

    await updateClient(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
  });
});

// ---------------------------------------------------------------------------
// deleteClient
// ---------------------------------------------------------------------------
describe('deleteClient', () => {
  it('responds 404 when client does not exist', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await deleteClient(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Client not found' });
  });

  it('deletes client and responds 204', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaClient.delete.mockResolvedValueOnce({} as any);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await deleteClient(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('responds 500 when database throws', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce({ id: 1 } as any);
    mockPrismaClient.delete.mockRejectedValueOnce(new Error('DB error'));

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await deleteClient(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// validateClient
// ---------------------------------------------------------------------------
describe('validateClient', () => {
  it('returns valid for correct data', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce(null);

    const result = await validateClient({
      firstName: 'Alice',
      lastName: 'Smith',
      phone: '+1234567890',
      email: 'alice@example.com',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors for missing required fields', async () => {
    const result = await validateClient({});

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('First name is required');
    expect(result.errors).toContain('Last name is required');
    expect(result.errors).toContain('Phone number is required');
  });

  it('returns error for invalid email format', async () => {
    const result = await validateClient({
      firstName: 'A',
      lastName: 'B',
      phone: '123',
      email: 'bad-email',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  it('returns error for invalid phone format', async () => {
    const result = await validateClient({
      firstName: 'A',
      lastName: 'B',
      phone: 'abc!@#',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid phone number format');
  });

  it('returns error for duplicate email, skipping the excludeId', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce({
      id: 99,
      email: 'dup@example.com',
    } as any);

    const result = await validateClient(
      { firstName: 'A', lastName: 'B', phone: '123', email: 'dup@example.com' },
      1,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email already exists');
  });

  it('does not flag duplicate when email belongs to the excluded client', async () => {
    mockPrismaClient.findUnique.mockResolvedValueOnce({
      id: 1,
      email: 'same@example.com',
    } as any);

    const result = await validateClient(
      {
        firstName: 'A',
        lastName: 'B',
        phone: '+1234567890',
        email: 'same@example.com',
      },
      1,
    );

    expect(result.valid).toBe(true);
  });
});
