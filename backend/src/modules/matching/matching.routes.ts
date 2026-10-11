import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { getMatchingPeople } from './matching.controller';

const router = Router();

router.use(requireAuth);
router.get('/people', getMatchingPeople);

export default router;
