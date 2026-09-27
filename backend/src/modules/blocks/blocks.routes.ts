import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { blockUser, unblockUser } from './blocks.controller';

const router = Router();

router.use(requireAuth);
router.post('/', blockUser);
router.delete('/:userId', unblockUser);

export default router;
