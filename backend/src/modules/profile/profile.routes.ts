import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getProfile, upsertProfile } from './profile.controller';

const router = Router();

router.use(requireAuth);
router.get('/', getProfile);
router.put('/', upsertProfile);

export default router;
