import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { createPropertyReview, createUserReview, listPropertyReviews, listUserReviews } from './reviews.controller';

const router = Router();

router.post('/property', requireAuth, createPropertyReview);
router.get('/property/:propertyId', listPropertyReviews);
router.post('/user', requireAuth, createUserReview);
router.get('/user/:userId', listUserReviews);

export default router;
