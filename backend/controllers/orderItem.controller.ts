import prisma from '../prisma';
import { Request, Response } from 'express';

type ExistingOrderItemRecord = NonNullable<
  Awaited<ReturnType<typeof prisma.orderItem.findUnique>>
> & {
  price: number;
  note: string | null;
};

//#region OrderItem Controller
/**
 * GET /orderItems - Get all order items, filter, sort, pagination
 *
 * Fetches a list of order items with optional filtering, sorting, and pagination.
 *
 * @param req - Express request object containing query parameters for filtering, sorting, and pagination.
 * @param res - Express response object used to send the response back to the client.
 * Query Parameters:
 * - orderId:(exact match).
 * - menuItemId:(exact match).
 * - sortBy:(default: 'id').
 * - order:(default: 'asc').
 * - page:(default: 1).
 * - limit:(default: 10).
 *
 * Response:
 * - A JSON object containing pagination info and the list of order items matching the criteria.
 */
export const getOrderItems = async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      menuItemId,
      sortBy = 'id',
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
        orderId ? { orderId: Number(orderId) } : {},
        menuItemId ? { menuItemId: Number(menuItemId) } : {},
      ],
    };

    // Query DB
    const orderItems = await prisma.orderItem.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
    });

    // Total count for pagination
    const total = await prisma.orderItem.count({ where });

    res.json({
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      data: orderItems,
    });
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({ error: 'Failed to fetch order items' });
  }
};

/**
 * POST /orderItems - Create a new order item
 *
 * Creates a new order item.
 *
 * @param req - Express request object containing order item data in the request body.
 * @param res - Express response object used to send the response back to the client.
 * Request Body:
 * - orderId:(required).
 * - menuItemId:(required).
 * - quantity:(required).
 *
 * Response:
 * - The created order item object.
 */
export const createOrderItem = async (req: Request, res: Response) => {
  try {
    const { orderId, menuItemId, quantity, price, note } = req.body;

    const validation = await validateOrderItem({
      orderId,
      menuItemId,
      quantity,
      price,
      note,
    });
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const selectedMenuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { price: true },
    });

    if (!selectedMenuItem) {
      return res.status(400).json({ error: 'Menu item not found' });
    }

    const orderItem = await prisma.orderItem.create({
      data: {
        orderId,
        menuItemId,
        quantity,
        price: price !== undefined ? price : selectedMenuItem.price,
        note: typeof note === 'string' ? note.trim() || null : null,
      },
    });
    res.status(201).json(orderItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order item' });
  }
};

/**
 * GET /orderItems/:id - Get an order item by ID
 *
 * Retrieves an order item by its ID.
 *
 * @param req - Express request object containing the order item ID in the request parameters.
 * @param res - Express response object used to send the response back to the client.
 * Response:
 * - The order item object if found, or a 404 error if not found.
 */
export const getOrderItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: Number(id) },
    });
    if (!orderItem) {
      return res.status(404).json({ error: 'Order item not found' });
    }
    res.json(orderItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order item' });
  }
};

/**
 * PUT /orderItems/:id - Update an order item by ID
 *
 * Updates an order item by its ID.
 *
 * @param req - Express request object containing the order item ID in the request parameters and updated data in the request body.
 * @param res - Express response object used to send the response back to the client.
 * Request Body:
 * - orderId:(optional).
 * - menuItemId:(optional).
 * - quantity:(optional).
 *
 * Response:
 * - The updated order item object if found, or a 404 error if not found.
 */
export const updateOrderItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orderId, menuItemId, quantity, price, note } = req.body;

    const existing = (await prisma.orderItem.findUnique({
      where: { id: Number(id) },
    })) as ExistingOrderItemRecord | null;
    if (!existing) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    const validation = await validateOrderItem({
      orderId: orderId !== undefined ? orderId : existing.orderId,
      menuItemId: menuItemId !== undefined ? menuItemId : existing.menuItemId,
      quantity: quantity !== undefined ? quantity : existing.quantity,
      price: price !== undefined ? price : existing.price,
      note: note !== undefined ? note : existing.note,
    });
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const orderItem = await prisma.orderItem.update({
      where: { id: Number(id) },
      data: {
        orderId: orderId !== undefined ? orderId : existing.orderId,
        menuItemId: menuItemId !== undefined ? menuItemId : existing.menuItemId,
        quantity: quantity !== undefined ? quantity : existing.quantity,
        price: price !== undefined ? price : existing.price,
        note:
          note !== undefined
            ? typeof note === 'string'
              ? note.trim() || null
              : null
            : existing.note,
      },
    });

    res.json(orderItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order item' });
  }
};

/**
 * DELETE /orderItems/:id - Delete an order item by ID
 *
 * Deletes an order item by its ID.
 *
 * @param req - Express request object containing the order item ID in the request parameters.
 * @param res - Express response object used to send the response back to the client.
 * Response:
 * - 204 No Content if the order item was successfully deleted, or a 404 error if not found.
 */
export const deleteOrderItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.orderItem.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    await prisma.orderItem.delete({
      where: { id: Number(id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order item' });
  }
};
//#endregion

// #region Helper Functions

/**
 * Interface representing the result of order item data validation.
 * - valid: A boolean indicating whether the order item data is valid.
 * - errors: An array of strings describing any validation errors that were found.
 */
export interface OrderItemValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates order item data for creating or updating an order item.
 *
 * @param data - An object containing the order item data to validate.
 * @returns An object containing a boolean 'valid' indicating if the data is valid, and an array of 'errors' describing any validation issues.
 */
export const validateOrderItem = async (data: {
  orderId?: number;
  menuItemId?: number;
  quantity?: number;
  price?: number;
  note?: string | null;
}): Promise<OrderItemValidationResult> => {
  const errors: string[] = [];

  if (data.orderId === undefined) errors.push('orderId is required');
  if (data.menuItemId === undefined) errors.push('menuItemId is required');
  if (data.quantity === undefined) errors.push('quantity is required');
  if (
    data.price !== undefined &&
    (typeof data.price !== 'number' || data.price < 0)
  ) {
    errors.push('price must be a non-negative number');
  }

  if (
    data.quantity !== undefined &&
    (data.quantity < 1 || !Number.isInteger(data.quantity))
  ) {
    errors.push('quantity must be a positive integer');
  }

  if (data.orderId !== undefined) {
    const orderExists = await prisma.order.findUnique({
      where: { id: data.orderId },
    });
    if (!orderExists) errors.push('Order not found');
  }

  if (data.menuItemId !== undefined) {
    const menuItemExists = await prisma.menuItem.findUnique({
      where: { id: data.menuItemId },
    });
    if (!menuItemExists) errors.push('Menu item not found');
  }

  if (data.note && data.note.trim().length > 1000) {
    errors.push('Note must be less than 1000 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
//#endregion
