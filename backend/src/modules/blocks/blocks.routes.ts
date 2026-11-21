import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { blockUser, unblockUser } from './blocks.controller';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { blockSchema } from './blocks.dto';

const router = Router();

router.use(requireAuth);
router.post('/', validate(blockSchema), asyncHandler(blockUser));
router.delete('/:userId', asyncHandler(unblockUser));

export default router;
