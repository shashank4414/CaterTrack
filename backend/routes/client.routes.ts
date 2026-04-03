import { Router } from 'express';
import {
  getClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
} from '../controllers/client.controller';

const router = Router();

router.get('/', getClients);
router.post('/', createClient);
router.get('/:id', getClientById);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export default router;
