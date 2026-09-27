import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getPreference, upsertPreference } from './preferences.controller';

const router = Router();

router.use(requireAuth);
router.get('/', getPreference);
router.put('/', upsertPreference);

export default router;
