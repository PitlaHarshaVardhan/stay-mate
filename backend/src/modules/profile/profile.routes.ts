import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getProfile, upsertProfile } from './profile.controller';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { profileSchema } from './profile.dto';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(getProfile));
router.put('/', validate(profileSchema), asyncHandler(upsertProfile));

export default router;
