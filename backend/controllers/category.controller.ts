import prisma from '../prisma';
import { Request, Response } from 'express';

/**
 * GET /categories - Get all categories, filter, sort, pagination
 *
 * Fetches a list of categories with optional filtering, sorting, and pagination.
 *
 * @param req - Express request object containing query parameters for filtering, sorting, and pagination.
 * @param res - Express response object used to send the response back to the client.
 * Query Parameters:
 * - search:(case-insensitive).
 * - sortBy:(default: 'name').
 * - order:(default: 'asc').
 * - page:(default: 1).
 * - limit:(default: 10).
 * Response:
 * - A JSON object containing pagination info and the list of categories matching the criteria.
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const {
      search,
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
              ],
            }
          : {},
      ],
    };

    // Query DB
    const categories = await prisma.category.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
    });

    // Total count for pagination
    const total = await prisma.category.count({ where });

    res.json({
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

/**
 * POST /categories - Create a new category
 *
 * Creates a new category with the provided name.
 *
 * @param req - Express request object containing the new category data in the request body.
 * @param res - Express response object used to send the response back to the client.
 * Request Body:
 * - name:(required).
 * Response:
 * - The created category object.
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category' });
  }
};

/**
 * GET /categories/:id - Get a category by ID
 *
 * Fetches a single category by its ID.
 * @param req - Express request object containing the category ID in the request parameters.
 * @param res - Express response object used to send the response back to the client.
 * Response:
 * - The category object if found, or a 404 error if not found.
 */
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

/**
 * PUT /categories/:id - Update a category by ID
 *
 * Updates a category by its ID.
 *
 * @param req - Express request object containing the category ID in the request parameters and updated category data in the request body.
 * @param res - Express response object used to send the response back to the client.
 * Request Body:
 * - name:(required).
 * Response:
 * - The updated category object if found, or a 404 error if not found.
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    // Validation
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: { name: name.trim() },
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
};

/**
 * DELETE /categories/:id - Delete a category by ID
 *
 * Deletes a category by its ID.
 *
 * @param req - Express request object containing the category ID in the request parameters.
 * @param res - Express response object used to send the response back to the client.
 * Response:
 * - 204 No Content if the category was successfully deleted, or a 404 error if not found.
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id: Number(id) },
    });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
};
