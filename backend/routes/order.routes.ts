import { Router } from 'express';
import {
  orders,
  createOrder,
  getOrderById,
  updateOrder,
  deleteOrder,
} from '../controllers/order.controller';

const router = Router();

router.get('/', orders);
router.post('/', createOrder);
router.get('/:id', getOrderById);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router;
