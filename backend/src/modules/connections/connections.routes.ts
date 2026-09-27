import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createConnection, deleteConnection, getConnections, updateConnection } from './connections.controller';

const router = Router();

router.use(requireAuth);
router.post('/', createConnection);
router.get('/', getConnections);
router.put('/:id', updateConnection);
router.delete('/:id', deleteConnection);

export default router;
