import prisma from '../prisma';
import { Request, Response } from 'express';

//#region Client Controller

/**
 * GET /clients - Get all clients, filter, sort, pagination
 *
 * Fetches a list of clients with optional filtering, sorting, and pagination.
 *
 * @param req - Express request object containing query parameters for filtering, sorting, and pagination.
 * @param res - Express response object used to send the response back to the client.
 * Query Parameters:
 * - search:(case-insensitive).
 * - phone:(case-insensitive).
 * - email:(case-insensitive).
 * - sortBy:(default: 'firstName').
 * - order:(default: 'asc').
 * - page:(default: 1).
 * - limit:(default: 10).
 *
 * Response:
 * - A JSON object containing pagination info and the list of clients matching the criteria.
 */
export const getClients = async (req: Request, res: Response) => {
  try {
    const {
      search,
      phone,
      email,
      sortBy = 'firstName',
      order = 'asc',
      page = '1',
      limit = '10',
    } = req.query;

    const searchValue = Array.isArray(search)
      ? String(search[0] ?? '').trim()
      : String(search ?? '').trim();
    const numericSearch = Number(searchValue);
    const universalSearchFilters = searchValue
      ? [
          {
            firstName: {
              contains: searchValue,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: searchValue,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: searchValue,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: searchValue,
              mode: 'insensitive',
            },
          },
          {
            note: {
              contains: searchValue,
              mode: 'insensitive',
            },
          },
          ...(Number.isInteger(numericSearch) ? [{ id: numericSearch }] : []),
        ]
      : [];

    // Pagination numbers
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sorting (supports multiple fields)
    const sortFields = Array.isArray(sortBy) ? sortBy : [sortBy];
    const sortOrders = Array.isArray(order) ? order : [order];

    const orderBy = sortFields.map((field, index) => ({
      [field as string]: sortOrders[index] === 'desc' ? 'desc' : 'asc',
    }));

    // Build WHERE conditions
    const where: any = {
      AND: [
        universalSearchFilters.length > 0
          ? {
              OR: universalSearchFilters,
            }
          : {},

        phone
          ? { phone: { contains: String(phone), mode: 'insensitive' } }
          : {},

        email
          ? { email: { contains: String(email), mode: 'insensitive' } }
          : {},
      ],
    };

    // Query DB
    const clients = await prisma.client.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
    });

    // Total count for pagination
    const total = await prisma.client.count({ where });

    res.json({
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      data: clients,
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

/**
 * POST /clients - Create a new client
 *
 * Creates a new client.
 *
 * @param req - Express request object containing client data in the request body.
 * @param res - Express response object used to send the response back to the client.
 * Request Body:
 * - firstName:(required).
 * - lastName:(required).
 * - phone:(required).
 * - email:(optional).
 *
 * Response:
 * - The created client object.
 */
export const createClient = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, email, note } = req.body;

    // Validate required fields and formats
    const validation = await validateClient({
      firstName,
      lastName,
      phone,
      email,
      note,
    });
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Create the client
    const client = await prisma.client.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: typeof phone === 'string' ? phone.trim() || null : null,
        email: typeof email === 'string' ? email.trim() || null : null,
        note: typeof note === 'string' ? note.trim() || null : null,
      },
    });
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create client' });
  }
};

/**
 * GET /clients/:id - Get a client by ID
 *
 * Retrieves a client by their ID.
 *
 * @param req - Express request object containing the client ID in the request parameters.
 * @param res - Express response object used to send the response back to the client.
 * Response:
 * - The client object if found, or a 404 error if not found.
 */
export const getClientById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id: Number(id) },
    });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client' });
  }
};

/**
 * PUT /clients/:id - Update a client by ID
 *
 * Updates a client by their ID.
 *
 * @param req - Express request object containing the client ID in the request parameters and updated client data in the request body.
 * @param res - Express response object used to send the response back to the client.
 * Request Body:
 * - firstName:(required).
 * - lastName:(required).
 * - phone:(required).
 * - email:(optional).
 *
 * Response:
 * - The updated client object if found, or a 404 error if not found.
 */
export const updateClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, email, note } = req.body;

    const existing = await prisma.client.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Validate required fields and formats
    const validation = await validateClient(
      { firstName, lastName, phone, email, note },
      Number(id), // exclude current client ID for email uniqueness check
    );
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Update the client
    const client = await prisma.client.update({
      where: { id: Number(id) },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: typeof phone === 'string' ? phone.trim() || null : null,
        email: typeof email === 'string' ? email.trim() || null : null,
        note: typeof note === 'string' ? note.trim() || null : null,
      },
    });

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update client' });
  }
};

/**
 * DELETE /clients/:id - Delete a client by ID
 *
 * Deletes a client by their ID.
 *
 * @param req - Express request object containing the client ID in the request parameters.
 * @param res - Express response object used to send the response back to the client.
 * Response:
 * - 204 No Content if the client was successfully deleted, or a 404 error if not found.
 */
export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.client.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await prisma.client.delete({
      where: { id: Number(id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
};
//#endregion

// #region Helper Functions

// ------------------- Helper Functions ------------------

/**
 * Interface representing the result of client data validation.
 * - valid: A boolean indicating whether the client data is valid.
 * - errors: An array of strings describing any validation errors that were found.
 */
export interface ClientValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates client data for creating or updating a client.
 *
 * @param data - An object containing the client data to validate.
 * @param excludeId - An optional client ID to exclude from duplicate email checks (used during updates).
 * @returns An object containing a boolean 'valid' indicating if the data is valid, and an array of 'errors' describing any validation issues.
 */
export const validateClient = async (
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string | null;
    note?: string | null;
  },
  excludeId?: number, // used for update
): Promise<ClientValidationResult> => {
  const errors: string[] = [];

  const { firstName, lastName, phone, email, note } = data;

  // Required fields
  if (!firstName?.trim()) errors.push('First name is required');
  if (!lastName?.trim()) errors.push('Last name is required');

  // Email format
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }

  // Phone format
  if (phone && !/^\+?[0-9\s\-()]+$/.test(phone)) {
    errors.push('Invalid phone number format');
  }

  if (note && note.trim().length > 1000) {
    errors.push('Note must be less than 1000 characters');
  }

  // Duplicate email check
  if (email) {
    const existing = await prisma.client.findUnique({
      where: { email },
    });

    if (existing && existing.id !== excludeId) {
      errors.push('Email already exists');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
//#endregion
