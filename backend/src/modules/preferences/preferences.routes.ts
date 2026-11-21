import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getPreference, upsertPreference } from './preferences.controller';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { preferenceSchema } from './preferences.dto';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(getPreference));
router.put('/', validate(preferenceSchema), asyncHandler(upsertPreference));

export default router;
