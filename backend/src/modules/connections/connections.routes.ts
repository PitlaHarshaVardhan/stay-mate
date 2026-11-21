import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createConnection, deleteConnection, getConnections, updateConnection } from './connections.controller';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { connectionSchema, updateConnectionSchema } from './connections.dto';

const router = Router();

router.use(requireAuth);
router.post('/', validate(connectionSchema), asyncHandler(createConnection));
router.get('/', asyncHandler(getConnections));
router.put('/:id', validate(updateConnectionSchema), asyncHandler(updateConnection));
router.delete('/:id', asyncHandler(deleteConnection));

export default router;
