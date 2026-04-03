import { Router } from 'express';
import {
  getMenuItems,
  createMenuItem,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
} from '../controllers/menuItem.controller';

const router = Router();

router.get('/', getMenuItems);
router.post('/', createMenuItem);
router.get('/:id', getMenuItemById);
router.put('/:id', updateMenuItem);
router.delete('/:id', deleteMenuItem);

export default router;
