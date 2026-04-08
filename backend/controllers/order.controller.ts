import prisma from '../prisma';
import { Request, Response } from 'express';

type ExistingOrderRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.order.findUnique>>
> & {
  note: string | null;
};

/**
 * GET /orders - Get all orders, filter, sort, pagination
 *
 * Fetches a list of orders with optional filtering, sorting, and pagination.
 *
 * @param req - Express request object containing query parameters for filtering, sorting, and pagination.
 * @param res - Express response object used to send the response back to the client.
 *
 * Query Parameters:
 * - clientId:(exact match).
 * - status:(exact match).
 * - sortBy:(default: 'createdAt').
 * - order:(default: 'asc').
 * - page:(default: 1).
 * - limit:(default: 10).
 *
 * Response:
 * - A JSON object containing pagination info and the list of orders matching the criteria.
 */
export const orders = async (req: Request, res: Response) => {
  try {
    const {
      clientId,
      status,
      sortBy = 'createdAt',
      order = 'asc',
      page = '1',
      limit = '10',
    } = req.query;

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
        clientId ? { clientId: Number(clientId) } : {},
        status ? { status: String(status) } : {},
      ],
    };

    // Query DB
    const orders = await prisma.order.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
    });

    // Total count for pagination
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
 * POST /orders - Create a new order
 *
 * Creates a new order with the provided details.
 *
 * @param req - Express request object containing the order details in the body.
 * @param res - Express response object used to send the response back to the client.
 *
 * Request Body:
 * - clientId:(required).
 * - status:(required).
 * - total:(required, non-negative number).
 * - deliveryDate:(optional).
 * - discount:(optional, default: 0).
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { clientId, status, total, deliveryDate, discount, note } = req.body;

    //validate
    const validation = await validateOrder({
      clientId,
      status: status ?? 'pending',
      total,
      note,
    });
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Create order
    const newOrder = await prisma.order.create({
      data: {
        clientId,
        status: status ?? undefined,
        total,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        discount: discount ?? 0,
        note: typeof note === 'string' ? note.trim() || null : null,
      },
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /orders/:id - Get order by ID
 *
 * Fetches a single order by its ID.
 *
 * @param req - Express request object containing the order ID in the route parameters.
 * @param res - Express response object used to send the response back to the client.
 *
 * Response:
 * - The order object if found, or a 404 error if not found.
 */
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
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
 * PUT /orders/:id - Update an order
 *
 * Updates an existing order with the provided details.
 *
 * @param req - Express request object containing the order ID in the route parameters and the updated details in the body.
 * @param res - Express response object used to send the response back to the client.
 *
 * Request Body:
 * - clientId:(required).
 * - status:(required).
 * - total:(required, non-negative number).
 * - deliveryDate:(optional).
 * - discount:(optional).
 */
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clientId, status, total, deliveryDate, discount, note } = req.body;

    const existingOrder = (await prisma.order.findUnique({
      where: { id: Number(id) },
    })) as ExistingOrderRecord | null;
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // validate merged update payload against the stored order
    const validation = await validateOrder({
      clientId: clientId !== undefined ? clientId : existingOrder.clientId,
      status: status !== undefined ? status : existingOrder.status,
      total: total !== undefined ? total : existingOrder.total,
      note: note !== undefined ? note : existingOrder.note,
    });
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: {
        clientId: clientId !== undefined ? clientId : existingOrder.clientId,
        status: status !== undefined ? status : existingOrder.status,
        total: total !== undefined ? total : existingOrder.total,
        deliveryDate:
          deliveryDate !== undefined
            ? new Date(deliveryDate)
            : existingOrder.deliveryDate,
        discount: discount !== undefined ? discount : existingOrder.discount,
        note:
          note !== undefined
            ? typeof note === 'string'
              ? note.trim() || null
              : null
            : existingOrder.note,
      },
    });
    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /orders/:id - Delete an order
 *
 * Deletes an existing order by its ID.
 *
 * @param req - Express request object containing the order ID in the route parameters.
 * @param res - Express response object used to send the response back to the client.
 *
 * Response:
 * - A success message if the order was deleted, or a 404 error if the order was not found.
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
    await prisma.order.delete({
      where: { id: Number(id) },
    });
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/--------------------------------------------- Helper Functions ---------------------------------------------/;

/**
 * Validates the order data before creating or updating an order.
 *
 * @param data - An object containing the order details to validate.
 * @return An object containing a boolean 'valid' indicating if the data is valid, and an array of 'errors' if any validation checks fail.
 */
export const validateOrder = async (data: {
  clientId?: number;
  status?: string;
  total?: number;
  note?: string | null;
}): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  // Required fields
  if (data.clientId === undefined) {
    errors.push('clientId is required');
  }
  if (data.status === undefined) {
    errors.push('status is required');
  }
  if (data.total === undefined) {
    errors.push('total is required');
  }
  if (
    data.total !== undefined &&
    (typeof data.total !== 'number' || data.total < 0)
  ) {
    errors.push('total must be a non-negative number');
  }

  // Check existence of clientId
  if (data.clientId !== undefined) {
    const clientExists = await prisma.client.findUnique({
      where: { id: data.clientId },
    });
    if (!clientExists) {
      errors.push('Client not found');
    }
  }

  // validate length
  if (data.status && data.status.length > 50) {
    errors.push('Status must be 50 characters or less');
  }
  if (data.note && data.note.trim().length > 1000) {
    errors.push('Note must be less than 1000 characters');
  }
  return { valid: errors.length === 0, errors };
};

/**
 * Interface representing the result of validating order data.
 * - valid: A boolean indicating whether the order data is valid or not.
 * - errors: An array of strings describing any validation errors that were found.
 * This interface is used to standardize the response from the validateOrder function, allowing the controller functions to easily check if the data is valid and handle any errors accordingly.
 */
export interface OrderValidationResult {
  valid: boolean;
  errors: string[];
}
