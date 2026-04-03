import prisma from '../prisma';
import { Request, Response } from 'express';

/**
 * GET /menuItems - Get all menu items, filter, sort, pagination
 *
 * Fetches a list of all menu items with optional filtering, sorting, and pagination.
 *
 * @param req - Express request object containing query parameters for filtering, sorting, and pagination.
 * @param res - Express response object used to send the response back to the client.
 *
 * Query Parameters:
 * - search:(case-insensitive).
 * - categoryId:(exact match).
 * - sortBy:(default: 'name').
 * - order:(default: 'asc').
 * - page:(default: 1).
 * - limit:(default: 10).
 *
 * Response:
 * - A JSON object containing pagination info and the list of menu items matching the criteria.
 */
export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const {
      search,
      categoryId,
      sortBy = 'name',
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
        search
          ? {
              OR: [
                {
                  name: {
                    contains: String(search),
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: String(search),
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : {},

        categoryId ? { categoryId: Number(categoryId) } : {},
      ],
    };

    // Query DB
    const menuItems = await prisma.menuItem.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
    });

    // Total count for pagination
    const total = await prisma.menuItem.count({ where });

    res.json({
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      data: menuItems,
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
};

/**
 * POST /menuItems - Create a new menu item
 *
 * Creates a new menu item with the provided data. Validates the input data before creating the menu item.
 *
 * @param req - Express request object containing the menu item data in the request body.
 * @param res - Express response object used to send the response back to the client.
 *
 * Request Body:
 * - name:(required).
 * - description:(optional).
 * - price:(required, non-negative number).
 * - categoryId:(required, must correspond to an existing category).
 */
export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const { name, description, price, categoryId } = req.body;

    // Validate
    const validation = await validateMenuItem({
      name,
      description,
      price,
      categoryId,
    });

    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    // Create the menu item
    const newMenuItem = await prisma.menuItem.create({
      data: { name, description, price, categoryId },
    });
    res.status(201).json(newMenuItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
};

/**
 * GET /menuItems/:id - Get a menu item by ID
 *
 * Retrieves a menu item by its ID.
 *
 * @param req - Express request object containing the menu item ID in the request parameters.
 * @param res - Express response object used to send the response back to the client.
 *
 * Response:
 * - The menu item object if found, or a 404 error if not found.
 */
export const getMenuItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: Number(id) },
    });
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu item' });
  }
};

/**
 * PUT /menuItems/:id - Update a menu item by ID
 *
 * Updates a menu item with the provided data. Validates the input data before updating the menu item.
 *
 * @param req - Express request object containing the menu item ID in the request parameters and the updated data in the request body.
 * @param res - Express response object used to send the response back to the client.
 *
 * Response:
 * - The updated menu item object if successful, or a 404 error if the menu item is not found.
 */
export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId } = req.body;

    // Validate
    const validation = await validateMenuItem({
      name,
      description,
      price,
      categoryId,
    });
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    //check if menu item exists
    const existing = await prisma.menuItem.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    // Update the menu item
    const menuItem = await prisma.menuItem.update({
      where: { id: Number(id) },
      data: { name, description, price, categoryId },
    });
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
};

/**
 *  DELETE /menuItems/:id - Delete a menu item by ID
 *
 * Deletes a menu item by its ID.
 *
 * @param req - Express request object containing the menu item ID in the request parameters.
 * @param res - Express response object used to send the response back to the client.
 * Response:
 * - A 204 status code if the deletion is successful, or a 404 error if the menu item is not found.
 */
export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.menuItem.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    await prisma.menuItem.delete({
      where: { id: Number(id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
};

//--------------------------------------------- Helper functions ----------------------------------------------

/**
 * Interface representing the result of validating client data.
 * - valid: A boolean indicating whether the client data is valid or not.
 * - errors: An array of strings describing any validation errors that were found.
 */
export interface MenuItemValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates menu item data before creating or updating a menu item.
 * @param data - The menu item data to validate, including name, description, price, and categoryId.
 * @return An object containing a boolean 'valid' indicating if the data is valid, and an array of 'errors' describing any validation issues that were found.
 * This function checks for required fields, validates the price, checks if the category exists, and validates the length of the name and description.
 */
export const validateMenuItem = async (data: {
  name: string;
  description?: string;
  price: number;
  categoryId: number;
}): Promise<MenuItemValidationResult> => {
  const errors: string[] = [];

  // Required fields  if (!data.name) {
  if (!data.name) {
    errors.push('Name is required');
  }
  if (data.price === undefined) {
    errors.push('Price is required');
  }
  if (!data.categoryId) {
    errors.push('Category ID is required');
  }

  // Validate price
  if (
    data.price !== undefined &&
    (typeof data.price !== 'number' || data.price < 0)
  ) {
    errors.push('Price must be a non-negative number');
  }

  // Validate category existence
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      errors.push('Category not found');
    }
  }

  // validate length
  if (data.name && data.name.length > 255) {
    errors.push('Name must be less than 255 characters');
  }
  if (data.description && data.description.length > 1000) {
    errors.push('Description must be less than 1000 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
