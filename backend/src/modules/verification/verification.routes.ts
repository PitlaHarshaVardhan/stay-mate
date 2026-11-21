import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { createVerificationRequest, listVerifications, reviewVerification } from './verification.controller';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { reviewVerificationSchema, verificationSchema } from './verification.dto';

const router = Router();

router.use(requireAuth);
router.post('/', validate(verificationSchema), asyncHandler(createVerificationRequest));
router.get('/', asyncHandler(listVerifications));
router.put('/:id', requireAdmin, validate(reviewVerificationSchema), asyncHandler(reviewVerification));

export default router;
