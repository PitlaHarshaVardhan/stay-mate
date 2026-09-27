import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { createVerificationRequest, listVerifications, reviewVerification } from './verification.controller';

const router = Router();

router.use(requireAuth);
router.post('/', createVerificationRequest);
router.get('/', listVerifications);
router.put('/:id', requireAdmin, reviewVerification);

export default router;
