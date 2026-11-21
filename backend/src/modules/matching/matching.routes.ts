import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getMatchingPeople } from './matching.controller';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = Router();

router.use(requireAuth);
router.get('/people', asyncHandler(getMatchingPeople));

export default router;
