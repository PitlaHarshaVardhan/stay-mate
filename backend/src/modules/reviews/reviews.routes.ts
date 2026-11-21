import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { createPropertyReview, createUserReview, listPropertyReviews, listUserReviews } from './reviews.controller';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/asyncHandler';
import { propertyReviewSchema, userReviewSchema } from './reviews.dto';

const router = Router();

router.post('/property', requireAuth, validate(propertyReviewSchema), asyncHandler(createPropertyReview));
router.get('/property/:propertyId', asyncHandler(listPropertyReviews));
router.post('/user', requireAuth, validate(userReviewSchema), asyncHandler(createUserReview));
router.get('/user/:userId', asyncHandler(listUserReviews));

export default router;
